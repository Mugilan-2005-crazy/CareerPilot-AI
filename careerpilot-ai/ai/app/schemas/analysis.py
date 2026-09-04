from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

RESUME_TEXT_MAX = 50_000  # matches the Node gatekeeper limit

# Strict models: unknown fields are rejected (fail-closed), matching the
# Node-side Zod `.strict()` schemas. Extra fields could otherwise be smuggled
# through to prompts or future parsing logic.
STRICT = ConfigDict(extra="forbid")


class ResumeAnalysisRequest(BaseModel):
    model_config = STRICT
    resume_text: str = Field(..., min_length=20, max_length=RESUME_TEXT_MAX)
    target_role: Optional[str] = Field(None, max_length=200)


class SkillGapRequest(BaseModel):
    model_config = STRICT
    resume_text: str = Field(..., min_length=20, max_length=RESUME_TEXT_MAX)
    role: str = Field(..., min_length=1, max_length=200)


class PlacementPredictionRequest(BaseModel):
    model_config = STRICT
    resume_text: str = Field(..., min_length=20, max_length=RESUME_TEXT_MAX)
    skills: List[str] = Field(..., max_length=100, min_length=0)
    projects: List[str] = Field(default_factory=list, max_length=100)
    experience_years: int = Field(0, ge=0, le=60)


class CompanyRecommendationRequest(BaseModel):
    model_config = STRICT
    skills: List[str] = Field(..., max_length=100)
    target_role: str = Field(..., min_length=1, max_length=200)
    location: Optional[str] = Field(None, max_length=200)


class InterviewQuestionRequest(BaseModel):
    model_config = STRICT
    role: str = Field(..., min_length=1, max_length=200)
    experience_level: str = Field("mid", max_length=50)
    difficulty: str = Field("medium", max_length=50)
