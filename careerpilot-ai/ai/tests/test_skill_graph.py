import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_prerequisites_endpoint():
    resp = client.get("/api/skill-graph/prerequisites/python")
    assert resp.status_code == 200
    body = resp.json()
    assert "prerequisites" in body
    assert isinstance(body["prerequisites"], list)


def test_dependents_endpoint():
    resp = client.get("/api/skill-graph/dependents/python")
    assert resp.status_code == 200
    body = resp.json()
    assert "dependents" in body
    assert isinstance(body["dependents"], list)


def test_related_endpoint():
    resp = client.get("/api/skill-graph/related/python")
    assert resp.status_code == 200
    body = resp.json()
    assert "related" in body
    assert isinstance(body["related"], list)


def test_depth_endpoint():
    resp = client.get("/api/skill-graph/depth/python")
    assert resp.status_code == 200
    body = resp.json()
    assert "depth" in body
    assert body["depth"] > 0


def test_learning_order_endpoint():
    resp = client.post("/api/skill-graph/learning-order", json=["pytorch", "deep learning", "machine learning"])
    assert resp.status_code == 200
    body = resp.json()
    assert "ordered" in body
    assert isinstance(body["ordered"], list)
    assert len(body["ordered"]) >= 1


def test_coverage_endpoint():
    resp = client.post("/api/skill-graph/coverage", json={
        "user_skills": ["python", "sql"],
        "target_skills": ["python", "sql", "machine learning", "docker"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "coverage_percentage" in body
    assert "missing" in body
    assert body["coverage_percentage"] == 50.0


def test_suggest_next_endpoint():
    resp = client.post("/api/skill-graph/suggest-next", json={
        "current_skills": ["python", "sql"],
        "target_domain": "Data Science",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "suggestions" in body
    assert isinstance(body["suggestions"], list)


def test_subset_endpoint():
    resp = client.post("/api/skill-graph/subset", json={
        "skills": ["python", "sql"],
        "depth": 2,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "graph" in body
    assert isinstance(body["graph"], dict)


def test_skill_graph_validates_missing_skill():
    resp = client.get("/api/skill-graph/prerequisites/")
    assert resp.status_code >= 400


def test_skill_graph_rejects_invalid_method():
    resp = client.put("/api/skill-graph/prerequisites/python")
    assert resp.status_code >= 400
