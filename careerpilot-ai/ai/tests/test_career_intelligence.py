import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_career_matching_returns_top_career():
    resp = client.post(
        "/api/ai/career-matching",
        json={"skills": ["python", "sql"], "experience_years": 1},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "top_career" in body
    assert "all_matches" in body
    assert 0 <= body["top_career"]["match_score"] <= 100


def test_skill_gap_enhanced_returns_gaps():
    resp = client.post(
        "/api/ai/skill-gap-enhanced",
        json={"current_skills": ["python"], "target_career": "Data Scientist"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "missing_skills" in body
    assert isinstance(body["missing_skills"], list)


def test_roadmap_returns_milestones():
    resp = client.post(
        "/api/ai/roadmap",
        json={"target_career": "Data Scientist", "current_skills": ["python"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "milestones" in body
    assert isinstance(body["milestones"], list)


def test_project_recommendations_returns_recommendations():
    resp = client.post(
        "/api/ai/project-recommendations",
        json={"target_career": "Software Engineer", "current_skills": ["python"], "count": 2},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "recommendations" in body
    assert body["count"] >= 0


def test_jd_analysis_returns_match_score():
    resp = client.post(
        "/api/ai/jd-analysis",
        json={
            "job_description": "We are looking for a Python developer with SQL and cloud experience.",
            "user_skills": ["python", "sql", "docker"],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "match_score" in body
    assert "fit" in body
    assert body["fit"] in {"high", "medium", "low"}


def test_career_transition_returns_feasibility():
    resp = client.post(
        "/api/ai/career-transition",
        json={
            "current_career": "Software Engineer",
            "target_career": "Data Scientist",
            "current_skills": ["python", "sql", "javascript"],
            "experience_years": 3,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "transition_feasibility" in body
    assert "transferable_skills" in body
    assert "new_skills_required" in body


@pytest.mark.parametrize("payload", [
    {},
    {"skills": []},
    {"skills": ["python"], "experience_years": -1},
])
def test_career_matching_rejects_invalid(payload):
    resp = client.post("/api/ai/career-matching", json=payload)
    assert resp.status_code == 422
