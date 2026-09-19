"""
Resume Intelligence — Structured extraction pipeline (v1.1 P1).

Extracts structured career evidence from resume text (PDF/DOCX/text).
All outputs are deterministic heuristics; no external LLM required.
"""

from typing import List, Dict, Any, Optional
import re
from dataclasses import dataclass, field

SKILL_KEYWORDS = {
    "programming": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql",
    ],
    "frontend": [
        "react", "vue", "angular", "svelte", "next.js", "nuxt", "html", "css",
        "tailwind", "bootstrap", "sass", "less", "webpack", "vite", "redux",
        "zustand", "context api", "hooks", "jsx", "tsx",
    ],
    "backend": [
        "node.js", "express", "fastapi", "django", "flask", "spring boot",
        "asp.net", "gin", "echo", "nestjs", "graphql", "rest", "grpc",
        "microservices", "api design", "authentication", "authorization",
    ],
    "database": [
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb",
        "cassandra", "elasticsearch", "sql", "nosql", "orm", "prisma",
        "typeorm", "mongoose", "sqlalchemy", "entity framework",
    ],
    "cloud": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci",
        "serverless", "lambda", "cloudformation", "pulumi",
    ],
    "data": [
        "pandas", "numpy", "polars", "spark", "hadoop", "kafka", "airflow",
        "dbt", "snowflake", "bigquery", "redshift", "etl", "elt",
        "data warehouse", "data lake", "streaming", "batch processing",
    ],
    "ml": [
        "machine learning", "deep learning", "pytorch", "tensorflow", "keras",
        "scikit-learn", "xgboost", "lightgbm", "hugging face", "transformers",
        "llm", "nlp", "computer vision", "reinforcement learning", "mlops",
        "model serving", "feature engineering", "model evaluation",
    ],
    "devops": [
        "linux", "bash", "shell scripting", "nginx", "apache", "load balancing",
        "monitoring", "prometheus", "grafana", "elk", "logging", "observability",
        "incident response", "on-call", "sre", "platform engineering",
    ],
    "security": [
        "cybersecurity", "network security", "application security", "penetration testing",
        "vulnerability assessment", "siem", "soc", "incident response",
        "compliance", "gdpr", "hipaa", "pci dss", "owasp", "threat modeling",
    ],
    "tools": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence", "notion",
        "figma", "postman", "insomnia", "swagger", "openapi", "vs code",
        "intellij", "vim", "tmux", "docker compose", "make", "cmake",
    ],
}

PROJECT_INDICATORS = [
    "project", "built", "developed", "created", "designed", "implemented",
    "architected", "engineered", "delivered", "launched", "deployed",
]

EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e",
    "b.sc", "m.sc", "bca", "mca", "diploma", "certification",
    "university", "college", "institute", "degree", "graduated",
]

EXPERIENCE_KEYWORDS = [
    "experience", "worked", "employed", "intern", "internship", "role",
    "position", "company", "organization", "startup", "freelance",
    "contract", "full-time", "part-time", "remote",
]

CERTIFICATION_KEYWORDS = [
    "certified", "certification", "certificate", "aws certified", "azure certified",
    "google cloud certified", "ckad", "cka", "ckas", "pmp", "scrum master",
    "csm", "psm", "itil", "cissp", "ceh", "security+", "network+",
]


def _extract_sections(text: str) -> Dict[str, str]:
    """Split resume into logical sections based on common headers."""
    sections = {}
    current_section = "header"
    current_content = []

    lines = text.split("\n")
    for line in lines:
        line_stripped = line.strip()
        lower = line_stripped.lower()

        is_header = any(
            lower.startswith(keyword)
            for keyword in [
                "experience", "work history", "employment",
                "education", "academic", "qualification",
                "project", "personal project", "portfolio",
                "skill", "technical skill", "technology", "tech stack",
                "certification", "certificate", "license",
                "achievement", "award", "honor", "publication",
                "summary", "objective", "profile", "about",
            ]
        )

        if is_header and len(line_stripped) < 50:
            if current_content:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = line_stripped
            current_content = []
        else:
            current_content.append(line_stripped)

    if current_content:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def _extract_skills_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract skills with categories from text."""
    text_lower = text.lower()
    found_skills = []

    for category, skills in SKILL_KEYWORDS.items():
        for skill in skills:
            if skill.lower() in text_lower:
                found_skills.append({
                    "name": skill.title(),
                    "category": category,
                    "source": "resume",
                    "confidence": 0.7,
                })

    return found_skills


def _extract_projects(text: str) -> List[Dict[str, Any]]:
    """Extract project information from resume text."""
    projects = []
    sections = _extract_sections(text)

    project_text = ""
    for section_name, content in sections.items():
        if any(kw in section_name.lower() for kw in ["project", "portfolio"]):
            project_text += content + "\n"

    if not project_text:
        project_text = text

    sentences = re.split(r"[.!?]\s+", project_text)
    for sent in sentences:
        sent_lower = sent.lower()
        if any(indicator in sent_lower for indicator in PROJECT_INDICATORS):
            tech_found = _extract_skills_from_text(sent)
            if tech_found or len(sent) > 50:
                projects.append({
                    "description": sent.strip(),
                    "technologies": [t["name"] for t in tech_found[:5]],
                    "source": "resume",
                })

    return projects[:10]


def _extract_education(text: str) -> List[Dict[str, Any]]:
    """Extract education information."""
    education = []
    sections = _extract_sections(text)

    edu_text = ""
    for section_name, content in sections.items():
        if any(kw in section_name.lower() for kw in ["education", "academic", "qualification", "degree"]):
            edu_text += content + "\n"

    if not edu_text:
        edu_text = text

    lines = edu_text.split("\n")
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in EDUCATION_KEYWORDS):
            education.append({
                "detail": line.strip(),
                "source": "resume",
            })

    return education[:5]


def _extract_experience(text: str) -> List[Dict[str, Any]]:
    """Extract work experience."""
    experience = []
    sections = _extract_sections(text)

    exp_text = ""
    for section_name, content in sections.items():
        if any(kw in section_name.lower() for kw in ["experience", "work", "employment", "career"]):
            exp_text += content + "\n"

    if not exp_text:
        exp_text = text

    lines = exp_text.split("\n")
    current_role = None
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        line_lower = line_stripped.lower()
        if any(kw in line_lower for kw in EXPERIENCE_KEYWORDS):
            if current_role:
                experience.append(current_role)
            current_role = {"detail": line_stripped, "source": "resume", "technologies": []}
        elif current_role and len(line_stripped) > 10:
            current_role["detail"] += " " + line_stripped
            techs = _extract_skills_from_text(line_stripped)
            current_role["technologies"].extend([t["name"] for t in techs])

    if current_role:
        experience.append(current_role)

    return experience[:5]


def _extract_certifications(text: str) -> List[Dict[str, Any]]:
    """Extract certifications."""
    certs = []
    text_lower = text.lower()
    for kw in CERTIFICATION_KEYWORDS:
        if kw in text_lower:
            certs.append({
                "name": kw.title(),
                "source": "resume",
            })
    return certs


def _extract_achievements(text: str) -> List[Dict[str, Any]]:
    """Extract measurable achievements."""
    achievements = []
    sections = _extract_sections(text)

    for section_name, content in sections.items():
        if any(kw in section_name.lower() for kw in ["achievement", "award", "honor", "accomplishment"]):
            lines = content.split("\n")
            for line in lines:
                line_stripped = line.strip()
                if line_stripped and len(line_stripped) > 20:
                    achievements.append({
                        "detail": line_stripped,
                        "source": "resume",
                    })

    return achievements[:5]


def analyze_resume_intelligence(payload) -> Dict[str, Any]:
    """
    Main entry point: structured resume intelligence extraction.

    Accepts either the Pydantic request model or an already-dumped dict so the
    HTTP router and direct callers share a single contract.
    """
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump()
    resume_text = payload.get("resume_text", "")
    target_role = payload.get("target_role")

    skills = _extract_skills_from_text(resume_text)
    projects = _extract_projects(resume_text)
    education = _extract_education(resume_text)
    experience = _extract_experience(resume_text)
    certifications = _extract_certifications(resume_text)
    achievements = _extract_achievements(resume_text)

    all_tech = set()
    for s in skills:
        all_tech.add(s["name"].lower())
    for p in projects:
        for t in p.get("technologies", []):
            all_tech.add(t.lower())

    result = {
        "extracted_skills": skills,
        "extracted_projects": projects,
        "extracted_education": education,
        "extracted_experience": experience,
        "extracted_certifications": certifications,
        "extracted_achievements": achievements,
        "technology_inventory": sorted(list(all_tech)),
        "skill_count": len(skills),
        "project_count": len(projects),
        "experience_count": len(experience),
        "source": "heuristic",
        "confidence": "medium",
        "note": "Extraction is heuristic; verify against original resume.",
    }

    if target_role:
        result["target_role"] = target_role
        role_skills = _get_role_skills(target_role)
        missing = [s for s in role_skills if s not in all_tech]
        result["role_alignment"] = {
            "target_role": target_role,
            "matched_skills": [s for s in role_skills if s in all_tech],
            "missing_skills": missing,
            "coverage_pct": round((len(role_skills) - len(missing)) / len(role_skills) * 100, 1) if role_skills else 0,
        }

    return result


def _get_role_skills(role: str) -> List[str]:
    role_lower = role.lower()
    if "software" in role_lower or "backend" in role_lower or "fullstack" in role_lower or "full stack" in role_lower:
        return ["python", "javascript", "sql", "git", "docker", "api design", "system design"]
    if "data scientist" in role_lower or "ml engineer" in role_lower or "machine learning" in role_lower:
        return ["python", "sql", "machine learning", "pytorch", "tensorflow", "statistics", "data analysis"]
    if "data engineer" in role_lower:
        return ["python", "sql", "spark", "airflow", "kafka", "etl", "data warehouse"]
    if "devops" in role_lower or "cloud engineer" in role_lower or "sre" in role_lower:
        return ["linux", "docker", "kubernetes", "terraform", "aws", "ci/cd", "monitoring"]
    if "frontend" in role_lower:
        return ["javascript", "typescript", "react", "html", "css", "git", "testing"]
    if "security" in role_lower or "cyber" in role_lower:
        return ["networking", "linux", "security fundamentals", "python", "siem"]
    return ["python", "javascript", "sql", "git", "problem solving", "communication"]