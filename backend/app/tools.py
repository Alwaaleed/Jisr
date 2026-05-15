import logging
from typing import List, Dict, Any
import httpx

log = logging.getLogger("kfu.tools")


def sync_searxng_search(query: str, searxng_url: str, limit: int = 10) -> List[Dict[str, str]]:
    try:
        with httpx.Client(timeout=8.0) as client:
            r = client.get(
                f"{searxng_url.rstrip('/')}/search",
                params={"q": query, "format": "json", "categories": "general", "language": "all"},
                headers={"User-Agent": "kfu-coop-finder/0.1"},
            )
            r.raise_for_status()
            data = r.json()
            return [
                {"title": x.get("title", ""), "url": x.get("url", ""), "content": x.get("content", "")}
                for x in data.get("results", [])[:limit]
            ]
    except Exception as e:
        log.warning("searxng_search failed (%s): %s", searxng_url, e)
        return []


async def searxng_search(query: str, searxng_url: str, limit: int = 10) -> List[Dict[str, str]]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                f"{searxng_url.rstrip('/')}/search",
                params={"q": query, "format": "json", "categories": "general", "language": "all"},
                headers={"User-Agent": "kfu-coop-finder/0.1"},
            )
            r.raise_for_status()
            data = r.json()
            return [
                {"title": x.get("title", ""), "url": x.get("url", ""), "content": x.get("content", "")}
                for x in data.get("results", [])[:limit]
            ]
    except Exception as e:
        log.warning("searxng_search (async) failed (%s): %s", searxng_url, e)
        return []
