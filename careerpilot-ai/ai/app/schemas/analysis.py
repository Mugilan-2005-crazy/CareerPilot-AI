from pydantic import BaseModel, Field
from typing import List, Optional


class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)
    target_role: Optional[str] = None


class SkillGapRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)
    role: str


class PlacementPredictionRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)
    skills: List[str]
    projects: List[str] = []
    experience_years: int = 0


class CompanyRecommendationRequest(BaseModel):
    skills: List[str]
    target_role: str
    location: Optional[str] = None


class InterviewQuestionRequest(BaseModel):
    role: str
    experience_level: str = "mid"
    difficulty: str = "medium"
