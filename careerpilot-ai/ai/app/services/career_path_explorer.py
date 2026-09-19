"""
Career Path Explorer — Multi-path career exploration (v1.1 P1).

Provides multiple career paths from the same candidate profile,
showing readiness, gaps, and recommended next steps for each path.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.services.career_intelligence import (
    CAREERS,
    _normalize_skill,
    _build_advanced_gaps,
    match_career_v2,
)
from app.services.skill_graph import get_prerequisites, get_dependents, get_learning_order


CAREER_PATHS = {
    "software-development": {
        "name": "Software Development",
        "paths": [
            {
                "id": "frontend",
                "name": "Frontend Developer",
                "target_career": "Software Engineer",
                "focus_skills": ["javascript", "typescript", "react", "html", "css", "vue", "angular"],
                "description": "Build user interfaces and client-side applications",
            },
            {
                "id": "backend",
                "name": "Backend Developer",
                "target_career": "Software Engineer",
                "focus_skills": ["python", "java", "go", "node.js", "sql", "api design", "system design"],
                "description": "Build server-side logic, APIs, and data layers",
            },
            {
                "id": "fullstack",
                "name": "Full Stack Developer",
                "target_career": "Software Engineer",
                "focus_skills": ["javascript", "typescript", "react", "node.js", "python", "sql", "docker"],
                "description": "End-to-end application development",
            },
            {
                "id": "mobile",
                "name": "Mobile Developer",
                "target_career": "Software Engineer",
                "focus_skills": ["swift", "kotlin", "flutter", "react native", "ios", "android"],
                "description": "Build native and cross-platform mobile applications",
            },
        ],
    },
    "data-ai": {
        "name": "Data & AI",
        "paths": [
            {
                "id": "data-analyst",
                "name": "Data Analyst",
                "target_career": "Data Scientist",
                "focus_skills": ["sql", "python", "tableau", "power bi", "excel", "statistics"],
                "description": "Analyze data and create business insights",
            },
            {
                "id": "data-engineer",
                "name": "Data Engineer",
                "target_career": "Data Engineer",
                "focus_skills": ["python", "sql", "spark", "kafka", "airflow", "etl", "data warehouse"],
                "description": "Build data pipelines and infrastructure",
            },
            {
                "id": "ml-engineer",
                "name": "ML Engineer",
                "target_career": "ML Engineer",
                "focus_skills": ["python", "pytorch", "tensorflow", "mlops", "docker", "kubernetes"],
                "description": "Productionize and scale machine learning models",
            },
            {
                "id": "data-scientist",
                "name": "Data Scientist",
                "target_career": "Data Scientist",
                "focus_skills": ["python", "statistics", "machine learning", "sql", "deep learning", "nlp"],
                "description": "Research and develop ML solutions for business problems",
            },
            {
                "id": "genai-engineer",
                "name": "GenAI Engineer",
                "target_career": "ML Engineer",
                "focus_skills": ["python", "pytorch", "transformers", "llm", "rag", "prompt engineering"],
                "description": "Build applications with generative AI and LLMs",
            },
        ],
    },
    "cloud-devops": {
        "name": "Cloud & DevOps",
        "paths": [
            {
                "id": "devops",
                "name": "DevOps Engineer",
                "target_career": "DevOps Engineer",
                "focus_skills": ["linux", "docker", "kubernetes", "ci/cd", "terraform", "aws", "monitoring"],
                "description": "Automate infrastructure and deployment pipelines",
            },
            {
                "id": "cloud-engineer",
                "name": "Cloud Engineer",
                "target_career": "Cloud Engineer",
                "focus_skills": ["aws", "azure", "gcp", "terraform", "kubernetes", "networking", "security"],
                "description": "Design and manage cloud infrastructure",
            },
            {
                "id": "sre",
                "name": "Site Reliability Engineer",
                "target_career": "DevOps Engineer",
                "focus_skills": ["linux", "kubernetes", "prometheus", "grafana", "go", "python", "incident response"],
                "description": "Ensure system reliability and performance at scale",
            },
        ],
    },
    "security": {
        "name": "Cybersecurity",
        "paths": [
            {
                "id": "soc-analyst",
                "name": "SOC Analyst",
                "target_career": "Cybersecurity Analyst",
                "focus_skills": ["networking", "linux", "security fundamentals", "siem", "incident response"],
                "description": "Monitor and respond to security threats",
            },
            {
                "id": "security-engineer",
                "name": "Security Engineer",
                "target_career": "Cybersecurity Analyst",
                "focus_skills": ["python", "network security", "application security", "cloud security", "penetration testing"],
                "description": "Build secure systems and applications",
            },
        ],
    },
}


def _get_career_definition(career: str) -> Optional[Dict[str, Any]]:
    """Resolve a CAREERS entry by display name or id (case-insensitive).

    Career paths declare their target by display name (e.g. "Software
    Engineer") while CAREERS entries are keyed by id (e.g.
    "software-engineer"), so both forms must resolve or every path detail
    lookup fails.
    """
    target = (career or "").strip().lower()
    if not target:
        return None
    for c in CAREERS:
        if target in (c["id"].lower(), c["name"].lower()):
            return c
    for c in CAREERS:
        if target in c["name"].lower() or target in c["id"].lower():
            return c
    return None


def _calculate_path_readiness(
    current_skills: List[str],
    skill_evidence: List[Dict[str, Any]],
    path: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculate readiness for a specific career path."""
    focus_skills = [_normalize_skill(s) for s in path["focus_skills"]]
    current_set = {_normalize_skill(s) for s in current_skills}

    matched = [s for s in focus_skills if s in current_set]
    missing = [s for s in focus_skills if s not in current_set]

    evidence_map = {_normalize_skill(e["skill"]): e for e in skill_evidence if e.get("skill")}

    evidence_backed = sum(
        1 for s in matched
        if s in evidence_map and evidence_map[s].get("evidence_count", 0) > 0
    )

    coverage = len(matched) / len(focus_skills) if focus_skills else 0
    evidence_coverage = evidence_backed / len(matched) if matched else 0

    if coverage >= 0.7 and evidence_coverage >= 0.5:
        readiness = "high"
    elif coverage >= 0.4:
        readiness = "medium"
    else:
        readiness = "low"

    return {
        "path_id": path["id"],
        "path_name": path["name"],
        "description": path["description"],
        "readiness": readiness,
        "coverage_pct": round(coverage * 100, 1),
        "evidence_coverage_pct": round(evidence_coverage * 100, 1),
        "matched_skills": matched,
        "missing_skills": missing,
        "focus_skills": path["focus_skills"],
        "target_career": path["target_career"],
    }


def explore_career_paths(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point: explore multiple career paths from current profile.
    """
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    target_domains = [_normalize_skill(d) for d in payload.get("target_domains", [])]
    experience_years = payload.get("experience_years", 0)
    skill_evidence = payload.get("skill_evidence", [])

    available_domains = list(CAREER_PATHS.keys())
    if target_domains:
        available_domains = [d for d in available_domains if d in target_domains]

    all_paths = []
    for domain_id in available_domains:
        domain = CAREER_PATHS[domain_id]
        for path in domain["paths"]:
            path_readiness = _calculate_path_readiness(current_skills, skill_evidence, path)
            path_readiness["domain"] = domain["name"]
            all_paths.append(path_readiness)

    all_paths.sort(key=lambda p: (p["readiness"] == "high", p["readiness"] == "medium", p["coverage_pct"]), reverse=True)

    return {
        "paths": all_paths,
        "total_paths": len(all_paths),
        "domains_explored": available_domains,
        "source": "heuristic",
    }


def get_path_details(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get detailed analysis for a specific career path including
    skill gaps, learning order, and project recommendations.
    """
    path_id = payload.get("path_id", "")
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    skill_evidence = payload.get("skill_evidence", [])

    target_path = None
    for domain in CAREER_PATHS.values():
        for path in domain["paths"]:
            if path["id"] == path_id:
                target_path = path
                break

    if not target_path:
        return {"error": "Path not found", "available_paths": [p["id"] for d in CAREER_PATHS.values() for p in d["paths"]]}

    target_career = target_path["target_career"]
    career_def = _get_career_definition(target_career)

    if not career_def:
        return {"error": "Career definition not found"}

    advanced_gaps = _build_advanced_gaps(
        career_def,
        current_skills,
        {_normalize_skill(e["skill"]): e for e in skill_evidence if e.get("skill")},
    )

    missing_skills = [g["skill"] for g in advanced_gaps["gaps"] if g["gap_size"] > 0]
    learning_order = get_learning_order(missing_skills)

    from app.services.career_intelligence import recommend_projects
    project_recs = recommend_projects({
        "target_career": target_career,
        "current_skills": current_skills,
        "difficulty": "intermediate",
        "count": 3,
    })

    return {
        "path_id": path_id,
        "path_name": target_path["name"],
        "description": target_path["description"],
        "target_career": target_career,
        "career_definition": career_def,
        "readiness_analysis": _calculate_path_readiness(current_skills, skill_evidence, target_path),
        "skill_gaps": advanced_gaps["gaps"],
        "buckets": advanced_gaps["buckets"],
        "heuristic_readiness_estimate": advanced_gaps["heuristic_readiness_estimate"],
        "learning_order": learning_order,
        "recommended_projects": project_recs.get("recommendations", []),
        "next_steps": _generate_next_steps(advanced_gaps, learning_order),
        "source": "heuristic",
    }


def _generate_next_steps(advanced_gaps: Dict[str, Any], learning_order: List[str]) -> List[str]:
    steps = []
    critical = advanced_gaps.get("buckets", {}).get("critical", [])
    if critical:
        steps.append(f"Start with critical gaps: {', '.join(critical[:2])}")
    if learning_order:
        steps.append(f"Follow learning sequence: {' → '.join(learning_order[:4])}")
    steps.append("Build one portfolio project demonstrating the top missing skill")
    steps.append("Add evidence (assessment, project, certification) for claimed skills")
    return steps