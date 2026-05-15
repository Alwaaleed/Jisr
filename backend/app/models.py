from typing import List, Optional
from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    major: str
    industries: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    cities: List[str] = Field(default_factory=list)
    dreamCompanies: str = ""


class CompanyMatch(BaseModel):
    company: str
    industry: str
    size: str = ""
    role: str
    location: str
    fitScore: float
    reasoning: str
    applyUrl: str
    publicContact: Optional[str] = None
    coverLetter: str = ""


class MatchResponse(BaseModel):
    matches: List[CompanyMatch]


class CoverLetterRequest(BaseModel):
    profile: StudentProfile
    company: str
    industry: str
    role: str
    reasoning: str = ""


class CoverLetterResponse(BaseModel):
    coverLetter: str
