from fastapi import APIRouter, HTTPException

from app.schemas.analysis import (
    ResumeAnalysisRequest,
    SkillGapRequest,
    PlacementPredictionRequest,
    CompanyRecommendationRequest,
    InterviewQuestionRequest,
)
from app.services.analysis_service import (
    analyze_resume_ats,
    analyze_skill_gaps,
    predict_placement,
    recommend_companies,
    generate_interview_questions,
)

router = APIRouter()

# Fail-closed: never echo an internal exception to the caller. The Node
# gateway translates a 5xx into a safe, generic message anyway.
_SAFE_ERROR = HTTPException(
    status_code=500,
    detail="The AI service could not complete this request. Please try again later.",
)


def _guard(fn, payload):
    try:
        return fn(payload)
    except HTTPException:
        raise
    except Exception:  # noqa: BLE001 - intentional generic exterior boundary
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
