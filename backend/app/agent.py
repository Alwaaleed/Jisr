import os
import json
import logging
from typing import List, TypedDict, Any, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx
from langgraph.graph import StateGraph, END

from .models import StudentProfile, CompanyMatch
from .tools import sync_searxng_search

LLAMA_HOST = os.getenv("LLAMA_HOST", "http://localhost:8080")
LLAMA_MODEL = os.getenv("LLAMA_MODEL", "qwen3.5-4b")
SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:8888")

log = logging.getLogger("coop.agent")


class AgentState(TypedDict):
    profile: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    ranked: List[Dict[str, Any]]


def _llm_call(system: str, user: str, temperature: float = 0.2, max_tokens: int = 14000) -> str:
    """Direct call to llama.cpp's OpenAI-compatible endpoint.

    We avoid langchain's ChatOpenAI wrapper because it returns empty content
    for qwen thinking models — likely due to extra headers/fields that change
    llama.cpp's behavior. Direct httpx calls return clean JSON reliably.
    """
    payload = {
        "model": LLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    with httpx.Client(timeout=300.0) as client:
        r = client.post(f"{LLAMA_HOST}/v1/chat/completions", json=payload)
        r.raise_for_status()
        data = r.json()
    choice = data["choices"][0]
    msg = choice.get("message", {})
    content = msg.get("content") or ""
    if not content.strip():
        content = msg.get("reasoning_content") or msg.get("reasoning") or ""
    return content


def _extract_json(text: str) -> Dict[str, Any]:
    if "</think>" in text:
        text = text.split("</think>", 1)[1]
    text = text.replace("```json", "").replace("```", "")
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        return {}
    try:
        return json.loads(text[start:end + 1])
    except Exception:
        return {}


def _heuristic_score(profile: Dict[str, Any], company: Dict[str, Any]) -> float:
    score = 0.4
    if company["industry"] in (profile.get("industries") or []):
        score += 0.25
    role_overlap = len(set(profile.get("roles") or []) & set(company["roles"]))
    if role_overlap:
        score += min(0.2, 0.08 * role_overlap)
    if profile.get("cities"):
        if any(loc in profile["cities"] for loc in company["locations"]):
            score += 0.1
    if company.get("_is_dream"):
        score += 0.1
    if company.get("_source") == "web":
        score += 0.05
    size = company.get("size", "")
    if size == "Startup":
        score += 0.1
    elif size == "Scaleup":
        score += 0.05
    return max(0.0, min(1.0, score))


def _default_reasoning(profile: Dict[str, Any], company: Dict[str, Any]) -> str:
    bits = []
    if company["industry"] in (profile.get("industries") or []):
        bits.append(f"تعمل في قطاع {company['industry']} الذي اخترته")
    overlap = list(set(profile.get("roles") or []) & set(company["roles"]))
    if overlap:
        bits.append(f"توظّف في مسارات {', '.join(overlap[:2])}")
    if company.get("_is_dream"):
        bits.append("ضمن قائمة الشركات التي تطمح للعمل بها")
    if company.get("_source") == "web":
        bits.append("مُكتشفة من البحث على الويب")
    if not bits:
        return "ملائمة محتملة بناءً على ملفك الشخصي."
    return f"{company['company']} " + "، و".join(bits) + "."


def _pick_role(profile: Dict[str, Any], company: Dict[str, Any]) -> str:
    student_roles = profile.get("roles") or []
    for r in student_roles:
        if r in company["roles"]:
            return r
    return company["roles"][0] if company["roles"] else ""



def web_search_node(state: AgentState) -> AgentState:
    p = state["profile"]
    industries = p.get("industries") or []
    roles = p.get("roles") or []
    if not industries:
        return state

    roles_en = " ".join(roles[:2])
    industry_main = industries[0]
    cities = p.get("cities") or []
    city_part = " ".join(cities[:2]) if cities else "Saudi Arabia"

    queries = [
        f'{industry_main} {roles_en} internship {city_part}',
        f'{industry_main} startup co-op {city_part}',
    ]
    if len(industries) > 1:
        queries.append(f'{industries[1]} {roles_en} internship {city_part}')

    log.info("web_search: running %d queries in parallel against SearXNG at %s", len(queries), SEARXNG_URL)
    results: List[Dict[str, str]] = []
    seen_urls: set[str] = set()
    with ThreadPoolExecutor(max_workers=len(queries)) as pool:
        futures = {pool.submit(sync_searxng_search, q, SEARXNG_URL, 15): q for q in queries}
        for fut in as_completed(futures):
            for r in fut.result():
                if r["url"] not in seen_urls:
                    seen_urls.add(r["url"])
                    results.append(r)
    if not results:
        log.info("web_search: no results")
        return state

    log.info("web_search: got %d raw results, extracting…", len(results))
    trimmed = [
        {"title": r.get("title", "")[:120], "url": r.get("url", "")}
        for r in results[:20]
    ]
    system = (
        "You extract real Saudi employer companies from a list of web search results. "
        "Extract AT LEAST 8 distinct companies if they appear in the results. "
        "For each UNIQUE real company that appears, return its name, a careers/jobs URL, "
        "and guess its industry from this list: "
        f"{list(set(industries))}. "
        "Skip: listicles, LinkedIn search pages, Indeed/Bayt/Naukri aggregators, "
        "government portals (Tamheer), blog posts, news articles. "
        "Return ONLY valid JSON with no extra text: "
        '{"companies":[{"company":"...","careers_url":"...","industry":"..."}]} '
        "/no_think"
    )
    user = f"Search results:\n{json.dumps(trimmed, ensure_ascii=False)}"

    extracted: List[Dict[str, Any]] = []
    try:
        text = _llm_call(system, user)
        log.info("web_search: LLM raw response (%d chars). HEAD: %s\n...TAIL: %s", len(text), text[:800], text[-1500:])
        data = _extract_json(text)
        log.info("web_search: parsed JSON keys=%s", list(data.keys()) if data else "EMPTY")
        raw = data.get("companies", [])
        if isinstance(raw, list):
            extracted = [x for x in raw if isinstance(x, dict)]
        log.info("web_search: extracted %d company dicts from JSON: %s", len(extracted), extracted)
    except Exception as e:
        log.warning("web_search extraction failed: %s", e)
        return state

    dream_tokens = [d.strip().lower() for d in (p.get("dreamCompanies") or "").split(",") if d.strip()]
    seen_names: set[str] = set()
    new_candidates: List[Dict[str, Any]] = []
    for e in extracted:
        name = (e.get("company") or "").strip()
        url = (e.get("careers_url") or "").strip()
        if not name or not url:
            continue
        if name.lower() in seen_names:
            continue
        if not url.startswith(("http://", "https://")):
            continue
        industry = e.get("industry") or (industries[0] if industries else "")
        is_dream = any(tok in name.lower() for tok in dream_tokens)
        new_candidates.append({
            "company": name,
            "industry": industry,
            "size": "Unknown",
            "roles": roles or ["Backend"],
            "locations": p.get("cities") or ["Any"],
            "careers_url": url,
            "public_contact": None,
            "_is_dream": is_dream,
            "_source": "web",
        })
        seen_names.add(name.lower())

    log.info("web_search: found %d candidates", len(new_candidates))
    return {**state, "candidates": new_candidates}


def llm_rerank_node(state: AgentState) -> AgentState:
    p = state["profile"]
    candidates = state["candidates"]
    if not candidates:
        return {**state, "ranked": []}

    numbered = [
        {
            "id": i,
            "company": c["company"],
            "industry": c["industry"],
            "size": c.get("size", "Unknown"),
            "roles": c["roles"],
            "locations": c["locations"],
            "source": c.get("_source", "seed"),
        }
        for i, c in enumerate(candidates)
    ]

    system = (
        "You are a co-op advisor  "
        "Given a student profile and a numbered list of Saudi companies, pick up to 10 "
        "that genuinely fit the student's stated target industries and roles. "
        "IMPORTANT: Prefer startups and scaleups over large enterprise companies. "
        "your value is surfacing lesser-known companies they might miss. "
        "For each selected company, return its `id` (integer, matching the list), "
        "a `fitScore` between 0 and 1, and one short sentence of `reasoning` IN ARABIC about WHY it fits. "
        "Respond ONLY with valid JSON in this exact shape, with no extra text: "
        '{"matches":[{"id":0,"fitScore":0.0,"reasoning":"..."}]} '
    )
    user = (
        f"Student: major={p.get('major')}, "
        f"industries={p.get('industries')}, roles={p.get('roles')}, "
        f"skills={p.get('skills')}, languages={p.get('languages')}, cities={p.get('cities')}, "
        f"dream_companies={p.get('dreamCompanies')}\n\n"
        f"Companies:\n{json.dumps(numbered, ensure_ascii=False)}"
    )

    hints: Dict[int, Dict[str, Any]] = {}
    try:
        text = _llm_call(system, user)
        data = _extract_json(text)
        for m in data.get("matches", []):
            if isinstance(m, dict) and "id" in m:
                try:
                    hints[int(m["id"])] = m
                except (TypeError, ValueError):
                    continue
    except Exception as e:
        log.warning("LLM rerank failed, using heuristic fallback: %s", e)

    ranked: List[Dict[str, Any]] = []
    for i, c in enumerate(candidates):
        hint = hints.get(i)
        if hint:
            score = float(hint.get("fitScore", 0.5))
            if c.get("_is_dream"):
                score = min(1.0, score + 0.1)
            reasoning = hint.get("reasoning") or _default_reasoning(p, c)
        else:
            score = _heuristic_score(p, c)
            reasoning = _default_reasoning(p, c)

        ranked.append({
            "company": c["company"],
            "industry": c["industry"],
            "size": c.get("size", ""),
            "role": _pick_role(p, c),
            "location": c["locations"][0] if c["locations"] else "",
            "fitScore": score,
            "reasoning": reasoning,
            "applyUrl": c["careers_url"],
            "publicContact": c.get("public_contact"),
            "coverLetter": "",
        })

    ranked.sort(key=lambda x: x["fitScore"], reverse=True)
    log.info("llm_rerank: %d matches (llm_hinted=%d)", len(ranked[:10]), len(hints))
    return {**state, "ranked": ranked[:10]}


def generate_cover_letter(profile: Dict[str, Any], company: str, industry: str, role: str, reasoning: str) -> str:
    system = (
        "You write concise, professional co-op cover-letter paragraphs in ARABIC for Saudi university students. "
        "Rules: under 140 Arabic words, one paragraph, confident but humble, specific to the target company. "
        "Do NOT include salutations or sign-offs. "
        "Do NOT include placeholders — output only the body paragraph, written in Arabic."
    )
    user = (
        f"Student major: {profile.get('major')}. "
        f"Skills: {', '.join(profile.get('skills') or []) or 'general IT'}. "
        f"Languages: {', '.join(profile.get('languages') or []) or 'Arabic, English'}.\n"
        f"Target: {company} — {industry} — role {role}.\n"
        f"Fit reason: {reasoning}"
    )
    try:
        text = _llm_call(system, user, temperature=0.4)
        if "</think>" in text:
            text = text.split("</think>", 1)[1]
        text = text.strip()
        if not text:
            raise ValueError("LLM returned empty response")
        return text
    except Exception as e:
        log.warning("cover letter generation failed for %s: %s", company, e)
        raise RuntimeError(f"فشل توليد خطاب التقديم: {e}")


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("web_search", web_search_node)
    g.add_node("llm_rerank", llm_rerank_node)
    g.set_entry_point("web_search")
    g.add_edge("web_search", "llm_rerank")
    g.add_edge("llm_rerank", END)
    return g.compile()


AGENT = build_graph()


async def run_agent(profile: StudentProfile) -> List[CompanyMatch]:
    initial: AgentState = {"profile": profile.model_dump(), "candidates": [], "ranked": []}
    final = await AGENT.ainvoke(initial)
    return [CompanyMatch(**m) for m in final.get("ranked", [])]
