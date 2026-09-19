import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

RESUME_TEXT = (
    "Senior software engineer with 6 years of experience building Python, JavaScript and SQL "
    "systems. Built a payments API with FastAPI, PostgreSQL and Docker. AWS certified."
)
JD_TEXT = (
    "We require a Python developer with SQL, Docker and AWS experience. Nice to have: Kubernetes "
    "and React. 3+ years of experience required."
)
SKILL_EVIDENCE = [{"skill": "python", "proficiency": "advanced", "evidence_count": 2}]


def test_resume_intelligence_extracts_structured_evidence():
    resp = client.post(
        "/api/ai/resume-intelligence",
        json={"resume_text": RESUME_TEXT, "target_role": "Software Engineer"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["extracted_skills"]
    assert body["skill_count"] >= 1
    assert body["technology_inventory"]
    assert body["source"] == "heuristic"
    assert "role_alignment" in body
    assert 0 <= body["role_alignment"]["coverage_pct"] <= 100


def test_resume_intelligence_works_without_target_role():
    resp = client.post("/api/ai/resume-intelligence", json={"resume_text": RESUME_TEXT})
    assert resp.status_code == 200
    assert "role_alignment" not in resp.json()


def test_resume_intelligence_rejects_extra_fields():
    resp = client.post(
        "/api/ai/resume-intelligence",
        json={"resume_text": RESUME_TEXT, "hack": True},
    )
    assert resp.status_code == 422


def test_jd_intelligence_classifies_and_matches_requirements():
    resp = client.post(
        "/api/ai/jd-intelligence",
        json={"job_description": JD_TEXT, "user_skills": ["python", "sql"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["job_description"]["inferred_role"]
    assert body["requirements"]["required_skills"]
    assert "python" in body["match_analysis"]["matched_required"]
    assert body["match_analysis"]["fit"] in {"low", "medium", "high"}
    assert 0 <= body["match_analysis"]["overall_match_score"] <= 100
    assert body["recommendations"]


def test_career_path_explorer_returns_ranked_paths():
    resp = client.post(
        "/api/ai/career-path-explorer",
        json={
            "current_skills": ["python", "sql"],
            "target_domains": ["software-development"],
            "experience_years": 2,
            "skill_evidence": SKILL_EVIDENCE,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_paths"] >= 1
    assert body["domains_explored"] == ["software-development"]
    for path in body["paths"]:
        assert path["readiness"] in {"low", "medium", "high"}
        assert 0 <= path["coverage_pct"] <= 100


def test_career_path_details_resolves_career_definition_by_display_name():
    """Regression: paths declare target_career by display name, CAREERS is keyed by id."""
    resp = client.post(
        "/api/ai/career-path-details",
        json={"path_id": "backend", "current_skills": ["python", "sql"], "skill_evidence": SKILL_EVIDENCE},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["path_id"] == "backend"
    assert body["career_definition"]["id"] == "software-engineer"
    assert body["skill_gaps"]
    assert body["next_steps"]


def test_career_path_details_requires_path_id():
    resp = client.post("/api/ai/career-path-details", json={"current_skills": ["python"]})
    assert resp.status_code == 422


def test_career_path_details_unknown_path_does_not_error():
    resp = client.post("/api/ai/career-path-details", json={"path_id": "not-a-real-path"})
    assert resp.status_code == 200
    assert "available_paths" in resp.json()


def test_what_if_simulation_is_labelled_and_measures_impact():
    resp = client.post(
        "/api/ai/what-if-simulation",
        json={
            "target_career": "Data Scientist",
            "current_skills": ["python", "sql"],
            "skill_evidence": [{"skill": "python", "proficiency": "intermediate", "evidence_count": 1}],
            "simulated_improvements": [
                {"type": "skill_improvement", "skill": "machine learning",
                 "new_proficiency": "advanced", "evidence_count": 2},
            ],
            "experience_years": 2,
            "projects_count": 3,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["disclaimer"].startswith("SIMULATION ONLY")
    assert body["summary"]["total_simulations"] == 1
    impact = body["simulations"][0]["impact"]
    assert impact["readiness_change"] >= 0
    assert impact["readiness_trend"] in {"improving", "stable", "declining"}


def test_interview_intelligence_without_sessions_prompts_practice():
    resp = client.post(
        "/api/ai/interview-intelligence",
        json={"target_role": "Software Engineer", "current_skills": ["python"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["recommendations"]
    assert "No interview sessions" in body["message"]


def test_interview_intelligence_extracts_weak_topics_and_evidence():
    resp = client.post(
        "/api/ai/interview-intelligence",
        json={
            "target_role": "Software Engineer",
            "current_skills": ["python", "algorithms"],
            "skill_evidence": [{"skill": "python", "proficiency": "intermediate", "evidence_count": 1}],
            "experience_years": 2,
            "interview_type": "technical",
            "completed_sessions": [
                {"session_id": "s1", "interview_type": "technical", "date": "2026-01-02",
                 "questions": [{"topic": "algorithms", "score": 4, "max_score": 10},
                               {"topic": "system design", "score": 3, "max_score": 10}]},
            ],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["sessions_analyzed"] == 1
    assert body["latest_session_score"] == 35.0
    assert body["aggregated_weak_topics"]
    assert body["interview_evidence"]
    assert body["readiness_impact"]


def test_interview_questions_intelligent_targets_unproven_skills():
    resp = client.post(
        "/api/ai/interview-questions-intelligent",
        json={
            "target_role": "Software Engineer",
            "current_skills": ["python", "sql"],
            "skill_evidence": [],
            "experience_years": 2,
            "interview_type": "technical",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["questions"]
    assert all("question" in q and "topic" in q for q in body["questions"])
    assert any(q.get("targeted_gap") for q in body["questions"])


def test_extension_endpoints_are_deterministic():
    """Same input must produce the same output (no hidden randomness)."""
    cases = [
        ("/api/ai/resume-intelligence", {"resume_text": RESUME_TEXT, "target_role": "Software Engineer"}),
        ("/api/ai/jd-intelligence", {"job_description": JD_TEXT, "user_skills": ["python", "sql"]}),
        ("/api/ai/career-path-explorer", {"current_skills": ["python", "sql"], "experience_years": 2}),
        ("/api/ai/career-path-details", {"path_id": "backend", "current_skills": ["python"]}),
        ("/api/ai/interview-intelligence", {"target_role": "Software Engineer", "current_skills": ["python"]}),
    ]
    for path, payload in cases:
        first = client.post(path, json=payload)
        second = client.post(path, json=payload)
        assert first.status_code == 200, path
        assert first.json() == second.json(), path