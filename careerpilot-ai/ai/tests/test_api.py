"""End-to-end tests for the AI FastAPI service (real HTTP via TestClient)."""
import concurrent.futures
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app, MAX_BODY_BYTES
from app.services import analysis_service

client = TestClient(app)


def _valid_resume_text():
    return "Experienced software engineer with Python, JavaScript, SQL and database design. Led teams and shipped APIs." * 4


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_resume_analysis_valid_request_response_schema():
    resp = client.post(
        "/api/ai/resume-analysis",
        json={"resume_text": _valid_resume_text(), "target_role": "Software Engineer"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "ats_score" in body
    assert isinstance(body["ats_score"], (int, float))
    assert 0 <= body["ats_score"] <= 100
    assert isinstance(body["keywords_detected"], list)
    assert isinstance(body["recommendations"], list)


@pytest.mark.parametrize("payload", [
    {},  # missing required
    {"resume_text": "too short"},  # min_length
    {"resume_text": _valid_resume_text(), "target_role": 123},  # wrong type
    {"resume_text": _valid_resume_text(), "extra": "unexpected"},  # extra field
])
def test_invalid_requests_rejected(payload):
    resp = client.post("/api/ai/resume-analysis", json=payload)
    assert resp.status_code == 422


def test_oversized_request_rejected_with_413():
    payload = {"resume_text": "x" * (MAX_BODY_BYTES + 16)}
    resp = client.post("/api/ai/resume-analysis", json=payload)
    assert resp.status_code == 413


def test_malformed_json_returns_non_200():
    resp = client.post(
        "/api/ai/skill-gap",
        content='{"resume_text":',
        headers={"content-type": "application/json"},
    )
    assert resp.status_code >= 400
    assert resp.status_code != 200


def test_skill_gap_shape():
    resp = client.post(
        "/api/ai/skill-gap",
        json={"resume_text": _valid_resume_text(), "role": "Backend Developer"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "detected_skills" in body
    assert "missing_skills" in body
    assert isinstance(body["missing_skills"], list)


def test_internal_failure_does_not_leak_details(monkeypatch):
    from app.routers import analysis as analysis_router

    def boom(payload):
        raise RuntimeError("TOP-SECRET internal path /etc/app/secret")

    # Patch the name that the router actually calls (it imported the function,
    # so patching the service module attr wouldn't take effect).
    monkeypatch.setattr(analysis_router, "analyze_resume_ats", boom)
    resp = client.post(
        "/api/ai/resume-analysis",
        json={"resume_text": _valid_resume_text()},
    )
    assert resp.status_code == 500
    detail = resp.json()["detail"]
    assert "TOP-SECRET" not in detail
    assert "/etc/app/secret" not in detail
    assert "try again later" in detail


def test_parallel_requests_succeed():
    def call(i):
        r = client.post(
            "/api/ai/company-recommendation",
            json={"skills": ["Python", "SQL"], "target_role": "Data Analyst"},
        )
        return r.status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        results = list(pool.map(call, range(20)))
    assert all(code == 200 for code in results)