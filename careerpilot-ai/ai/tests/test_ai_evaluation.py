import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _post(path, payload):
    resp = client.post(path, json=payload)
    assert resp.status_code == 200, f"Expected 200 for {path}, got {resp.status_code}: {resp.text}"
    return resp.json()


def test_evaluation_career_matching_response_shape():
    body = _post("/api/ai/career-matching", {"skills": ["python", "sql"], "experience_years": 1})
    assert "top_career" in body
    assert "all_matches" in body
    assert "total_evaluated" in body
    assert "source" in body
    assert 0 <= body["top_career"]["match_score"] <= 100


def test_evaluation_skill_gap_enhanced_response_shape():
    body = _post("/api/ai/skill-gap-enhanced", {"current_skills": ["python"], "target_career": "Data Scientist"})
    assert "target_career" in body
    assert "missing_skills" in body
    assert "priority" in body
    assert "estimated_effort" in body
    assert "source" in body


def test_evaluation_roadmap_response_shape():
    body = _post("/api/ai/roadmap", {"target_career": "Data Scientist", "current_skills": ["python"]})
    assert "target_career" in body
    assert "milestones" in body
    assert "estimated_completion" in body
    assert "source" in body
    for m in body["milestones"]:
        assert "title" in m
        assert "order" in m
        assert "completed" in m


def test_evaluation_project_recommendations_response_shape():
    body = _post("/api/ai/project-recommendations", {"target_career": "Software Engineer", "current_skills": ["python"], "count": 2})
    assert "recommendations" in body
    assert "count" in body
    assert "source" in body
    assert body["count"] == len(body["recommendations"])


def test_evaluation_jd_analysis_response_shape():
    body = _post("/api/ai/jd-analysis", {
        "job_description": "We are looking for a Python developer with SQL and cloud experience.",
        "user_skills": ["python", "sql", "docker"],
    })
    assert "match_score" in body
    assert "fit" in body
    assert "matched_skills" in body
    assert "missing_keywords" in body
    assert "recommendation" in body
    assert 0 <= body["match_score"] <= 100
    assert body["fit"] in {"high", "medium", "low"}


def test_evaluation_career_transition_response_shape():
    body = _post("/api/ai/career-transition", {
        "current_career": "Software Engineer",
        "target_career": "Data Scientist",
        "current_skills": ["python", "sql", "javascript"],
        "experience_years": 3,
    })
    assert "transition_feasibility" in body
    assert "estimated_transition_time" in body
    assert "transferable_skills" in body
    assert "new_skills_required" in body
    assert "recommended_steps" in body
    assert body["transition_feasibility"] in {"high", "medium", "low", "unknown"}


def test_evaluation_resume_analysis_response_shape():
    body = _post("/api/ai/resume-analysis", {"resume_text": "Experienced software engineer with Python and JavaScript skills." * 5, "target_role": "Software Engineer"})
    assert "ats_score" in body
    assert "summary" in body
    assert "keywords_detected" in body
    assert "recommendations" in body
    assert 0 <= body["ats_score"] <= 100


def test_evaluation_skill_gap_response_shape():
    body = _post("/api/ai/skill-gap", {"resume_text": "Python developer with SQL experience.", "role": "Software Engineer"})
    assert "role" in body
    assert "detected_skills" in body
    assert "missing_skills" in body
    assert "gap_summary" in body


def test_evaluation_placement_prediction_response_shape():
    body = _post("/api/ai/placement-prediction", {
        "resume_text": "Python developer with projects.",
        "skills": ["python", "sql"],
        "projects": ["portfolio"],
        "experience_years": 2,
    })
    assert "placement_probability" in body
    assert "confidence" in body
    assert "factors" in body
    assert 0 <= body["placement_probability"] <= 100


def test_evaluation_company_recommendation_response_shape():
    body = _post("/api/ai/company-recommendation", {"skills": ["python", "sql"], "target_role": "Software Engineer"})
    assert "recommended_companies" in body
    assert "match_reason" in body
    assert isinstance(body["recommended_companies"], list)


def test_evaluation_interview_questions_response_shape():
    body = _post("/api/ai/interview-questions", {"role": "Software Engineer", "difficulty": "medium"})
    assert "role" in body
    assert "difficulty" in body
    assert "questions" in body
    assert isinstance(body["questions"], list)
    assert len(body["questions"]) > 0


def test_evaluation_ai_chat_response_shape():
    body = _post("/api/ai/chat", {"message": "What career should I pursue?"})
    assert "response" in body
    assert "source" in body


def test_evaluation_all_endpoints_reject_empty_payloads():
    endpoints = [
        "/api/ai/career-matching",
        "/api/ai/skill-gap-enhanced",
        "/api/ai/roadmap",
        "/api/ai/project-recommendations",
        "/api/ai/jd-analysis",
        "/api/ai/career-transition",
        "/api/ai/resume-analysis",
        "/api/ai/skill-gap",
        "/api/ai/placement-prediction",
        "/api/ai/company-recommendation",
        "/api/ai/interview-questions",
        "/api/ai/chat",
    ]
    for path in endpoints:
        resp = client.post(path, json={})
        assert resp.status_code == 422, f"Expected 422 for {path} with empty payload, got {resp.status_code}"
