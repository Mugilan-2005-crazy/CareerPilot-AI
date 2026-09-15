from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any

STRICT = ConfigDict(extra="forbid")


class CareerMatchRequest(BaseModel):
    model_config = STRICT
    skills: List[str] = Field(..., max_length=100, min_length=1)
    interests: List[str] = Field(default_factory=list, max_length=50)
    experience_years: int = Field(0, ge=0, le=60)
    target_domains: List[str] = Field(default_factory=list, max_length=20)


class SkillGapEnhancedRequest(BaseModel):
    model_config = STRICT
    current_skills: List[str] = Field(..., max_length=100, min_length=1)
    target_career: str = Field(..., min_length=1, max_length=200)
    experience_years: int = Field(0, ge=0, le=60)


class SkillGapAdvancedRequest(BaseModel):
    model_config = STRICT
    target_career: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    experience_years: int = Field(0, ge=0, le=60)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)


class CareerMatchV2Request(BaseModel):
    model_config = STRICT
    target_career: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    projects_count: Optional[int] = Field(None, ge=0, le=20)


class RoadmapRequest(BaseModel):
    model_config = STRICT
    target_career: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(..., max_length=100)
    available_hours_per_week: int = Field(10, ge=1, le=80)
    duration_months: int = Field(6, ge=1, le=60)
    learning_preference: str = Field("mixed", max_length=50)


class ProjectRecommendationRequest(BaseModel):
    model_config = STRICT
    target_career: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(..., max_length=100)
    difficulty: str = Field("intermediate", max_length=50)
    count: int = Field(3, ge=1, le=10)
