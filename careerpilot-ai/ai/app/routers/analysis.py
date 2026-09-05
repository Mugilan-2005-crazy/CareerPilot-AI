from fastapi import APIRouter, HTTPException

from app.schemas.analysis import (
    ResumeAnalysisRequest,
    SkillGapRequest,
    PlacementPredictionRequest,
    CompanyRecommendationRequest,
    InterviewQuestionRequest,
    JDAnalysisRequest,
    CareerTransitionRequest,
)
from app.schemas.career_intelligence import (
    CareerMatchRequest,
    SkillGapEnhancedRequest,
    RoadmapRequest,
    ProjectRecommendationRequest,
)
from app.schemas.analysis import (
    ChatRequest,
)
from app.services.analysis_service import (
    analyze_resume_ats,
    analyze_skill_gaps,
    predict_placement,
    recommend_companies,
    generate_interview_questions,
    chat,
    analyze_job_description,
    analyze_career_transition,
)
from app.services.career_intelligence import (
    match_careers,
    analyze_skill_gap_enhanced,
    generate_roadmap,
    recommend_projects,
)

router = APIRouter()

_SAFE_ERROR = HTTPException(
    status_code=500,
    detail="The AI service could not complete this request. Please try again later.",
)


def _guard(fn, payload):
    try:
        return fn(payload)
    except HTTPException:
        raise
    except Exception:  # noqa: BLE001
        raise _SAFE_ERROR from None


@router.post("/resume-analysis")
def resume_analysis(payload: ResumeAnalysisRequest):
    return _guard(analyze_resume_ats, payload)


@router.post("/skill-gap")
def skill_gap_analysis(payload: SkillGapRequest):
    return _guard(analyze_skill_gaps, payload)


@router.post("/placement-prediction")
def placement_prediction(payload: PlacementPredictionRequest):
    return _guard(predict_placement, payload)


@router.post("/company-recommendation")
def company_recommendation(payload: CompanyRecommendationRequest):
    return _guard(recommend_companies, payload)


@router.post("/interview-questions")
def interview_questions(payload: InterviewQuestionRequest):
    return _guard(generate_interview_questions, payload)


@router.post("/chat")
def chat_endpoint(payload: ChatRequest):
    return _guard(chat, payload.model_dump())


@router.post("/career-matching")
def career_matching(payload: CareerMatchRequest):
    return _guard(match_careers, payload.model_dump())


@router.post("/skill-gap-enhanced")
def skill_gap_enhanced(payload: SkillGapEnhancedRequest):
    return _guard(analyze_skill_gap_enhanced, payload.model_dump())


@router.post("/roadmap")
def roadmap(payload: RoadmapRequest):
    return _guard(generate_roadmap, payload.model_dump())


@router.post("/project-recommendations")
def project_recommendations(payload: ProjectRecommendationRequest):
    return _guard(recommend_projects, payload.model_dump())


@router.post("/jd-analysis")
def jd_analysis(payload: JDAnalysisRequest):
    return _guard(analyze_job_description, payload.model_dump())


@router.post("/career-transition")
def career_transition(payload: CareerTransitionRequest):
    return _guard(analyze_career_transition, payload.model_dump())
