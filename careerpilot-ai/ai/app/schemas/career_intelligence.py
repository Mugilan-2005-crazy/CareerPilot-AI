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


class ResumeIntelligenceRequest(BaseModel):
    model_config = STRICT
    resume_text: str = Field(..., min_length=20, max_length=50000)
    target_role: Optional[str] = Field(None, max_length=200)


class JDIntelligenceRequest(BaseModel):
    model_config = STRICT
    job_description: str = Field(..., min_length=20, max_length=50000)
    user_skills: List[str] = Field(..., max_length=100, min_length=1)


class CareerPathExplorerRequest(BaseModel):
    model_config = STRICT
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    target_domains: List[str] = Field(default_factory=list, max_length=20)
    experience_years: int = Field(0, ge=0, le=60)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)


class WhatIfSimulationRequest(BaseModel):
    model_config = STRICT
    target_career: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)
    simulated_improvements: List[Dict[str, Any]] = Field(default_factory=list, max_length=20)
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    projects_count: Optional[int] = Field(None, ge=0, le=20)


class InterviewIntelligenceRequest(BaseModel):
    model_config = STRICT
    target_role: str = Field(..., min_length=1, max_length=200)
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)
    experience_years: int = Field(0, ge=0, le=60)
    interview_type: str = Field("technical", max_length=50)
    completed_sessions: List[Dict[str, Any]] = Field(default_factory=list, max_length=50)


class CareerPathDetailsRequest(BaseModel):
    model_config = STRICT
    path_id: str = Field(..., min_length=1, max_length=100)
    current_skills: List[str] = Field(default_factory=list, max_length=100)
    skill_evidence: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)
