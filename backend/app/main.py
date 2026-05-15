import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import (
    StudentProfile, MatchResponse,
    CoverLetterRequest, CoverLetterResponse,
)
from .agent import run_agent, generate_cover_letter

load_dotenv()

app = FastAPI(title="Co-op Finder")

origins = [o.strip() for o in os.getenv("ALLOWED_ORIGIN", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "model": os.getenv("LLAMA_MODEL", "qwen3.5-4b")}


@app.post("/match", response_model=MatchResponse)
async def match(profile: StudentProfile):
    matches = await run_agent(profile)
    return MatchResponse(matches=matches)


@app.post("/cover-letter", response_model=CoverLetterResponse)
def cover_letter(req: CoverLetterRequest):
    try:
        letter = generate_cover_letter(
            profile=req.profile.model_dump(),
            company=req.company,
            industry=req.industry,
            role=req.role,
            reasoning=req.reasoning,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return CoverLetterResponse(coverLetter=letter)
