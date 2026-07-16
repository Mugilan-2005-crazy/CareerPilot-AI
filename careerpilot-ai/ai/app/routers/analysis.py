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


@router.post("/resume-analysis")
def resume_analysis(payload: ResumeAnalysisRequest):
    try:
        return analyze_resume_ats(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/skill-gap")
def skill_gap_analysis(payload: SkillGapRequest):
    try:
        return analyze_skill_gaps(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/placement-prediction")
def placement_prediction(payload: PlacementPredictionRequest):
    try:
        return predict_placement(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/company-recommendation")
def company_recommendation(payload: CompanyRecommendationRequest):
    try:
        return recommend_companies(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/interview-questions")
def interview_questions(payload: InterviewQuestionRequest):
    try:
        return generate_interview_questions(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
