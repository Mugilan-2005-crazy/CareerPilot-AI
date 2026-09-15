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


def test_skill_gap_advanced_returns_explainable_gaps():
    resp = client.post(
        "/api/ai/skill-gap-advanced",
        json={
            "target_career": "Data Scientist",
            "current_skills": ["python"],
            "skill_evidence": [
                {"skill": "python", "proficiency": "intermediate", "evidence_count": 3}
            ],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["known_target"] is True
    assert isinstance(body["gaps"], list) and body["gaps"]
    gap = body["gaps"][0]
    for key in (
        "required_proficiency",
        "current_proficiency",
        "evidence_strength",
        "confidence",
        "gap_severity",
        "priority",
        "reason",
        "improvement_path",
    ):
        assert key in gap
    assert set(body["buckets"].keys()) == {"critical", "high_impact", "supporting", "optional"}
    assert 0 <= body["heuristic_readiness_estimate"] <= 100
    # Claimed skill without proficiency evidence must NOT be guessed.
    python_gap = next(g for g in body["gaps"] if g["skill"] == "python")
    assert python_gap["current_proficiency"] == "intermediate"
    assert python_gap["evidence_strength"] == "strong"


def test_skill_gap_advanced_unknown_claimed_skill_not_guessed():
    resp = client.post(
        "/api/ai/skill-gap-advanced",
        json={"target_career": "Data Scientist", "current_skills": ["statistics"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    gap = next(g for g in body["gaps"] if g["skill"] == "statistics")
    assert gap["current_proficiency"] == "unknown"
    assert gap["confidence"] == "low"


def test_skill_gap_advanced_unknown_target_career():
    resp = client.post(
        "/api/ai/skill-gap-advanced",
        json={"target_career": "astronaut", "current_skills": ["python"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["known_target"] is False
    assert body["gaps"] == []


def test_skill_gap_advanced_rejects_extra_fields():
    resp = client.post(
        "/api/ai/skill-gap-advanced",
        json={"target_career": "Data Scientist", "current_skills": ["python"], "injected": True},
    )
    assert resp.status_code == 422


def test_career_match_v2_returns_explainable_dimensions():
    resp = client.post(
        "/api/ai/career-match-v2",
        json={
            "target_career": "Data Scientist",
            "current_skills": ["python", "statistics"],
            "skill_evidence": [
                {"skill": "python", "proficiency": "advanced", "evidence_count": 4},
                {"skill": "statistics", "proficiency": "intermediate", "evidence_count": 2},
            ],
            "experience_years": 1,
            "projects_count": 2,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["known_target"] is True
    assert 0 <= body["overall_alignment"] <= 100
    assert body["confidence"] in ("low", "medium", "high")
    names = {d["name"] for d in body["dimensions"]}
    assert names == {"skillMatch", "evidenceMatch", "experienceMatch", "projectMatch"}
    for dim in body["dimensions"]:
        assert dim["reason"]
    assert "employment" in body["disclaimer"] or "prediction" in body["disclaimer"]
    assert "python" in body["strong_areas"]


def test_career_match_v2_unknown_proficiency_not_guessed():
    # Claimed skill without evidence: must count as unknown, not assumed.
    resp = client.post(
        "/api/ai/career-match-v2",
        json={"target_career": "Data Scientist", "current_skills": ["machine learning"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["confidence"] in ("low", "medium", "high")
    assert "machine learning" in body["missing_requirements"] or body["overall_alignment"] < 100


def test_career_match_v2_missing_dimensions_labelled_insufficient():
    resp = client.post(
        "/api/ai/career-match-v2",
        json={
            "target_career": "Data Scientist",
            "current_skills": ["python"],
            "skill_evidence": [{"skill": "python", "proficiency": "advanced", "evidence_count": 3}],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    dims = {d["name"]: d for d in body["dimensions"]}
    assert dims["experienceMatch"]["score"] is None
    assert "Insufficient evidence" in dims["experienceMatch"]["reason"]
    assert dims["projectMatch"]["score"] is None
    assert any("experience" in r.lower() for r in body["risk_areas"])


def test_career_match_v2_unknown_target():
    resp = client.post(
        "/api/ai/career-match-v2",
        json={"target_career": "astronaut", "current_skills": ["python"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["known_target"] is False


def test_career_match_v2_rejects_extra_fields():
    resp = client.post(
        "/api/ai/career-match-v2",
        json={"target_career": "Data Scientist", "hack": True},
    )
    assert resp.status_code == 422


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
