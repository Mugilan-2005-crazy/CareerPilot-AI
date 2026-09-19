"""
JD Intelligence — Structured Job Description extraction and matching (v1.1 P1).

Extracts structured requirements from job descriptions and matches against
candidate profiles using the Skill Graph for dependency-aware analysis.
"""

from typing import List, Dict, Any, Optional, Set
import re
from collections import Counter

from app.services.skill_graph import get_prerequisites, get_dependents, analyze_skill_coverage


JD_SECTION_PATTERNS = {
    "requirements": [
        "requirement", "qualification", "must have", "required", "essential",
        "minimum", "mandatory", "prerequisite", "you must", "you need",
    ],
    "preferred": [
        "preferred", "nice to have", "bonus", "plus", "advantage", "desirable",
        "ideal", "would be great", "experience with", "familiarity with",
    ],
    "responsibilities": [
        "responsib", "duty", "role", "will do", "day to day", "what you",
        "you will", "key task", "deliver", "own", "lead", "design", "build",
    ],
    "benefits": [
        "benefit", "perk", "offer", "salary", "compensation", "package",
        "health", "insurance", "vacation", "pto", "remote", "flexible",
    ],
    "about": [
        "about us", "company", "who we are", "mission", "vision", "culture",
        "team", "environment", "values",
    ],
}


TECH_KEYWORDS = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql",
        "bash", "shell", "powershell",
    ],
    "frameworks": [
        "react", "vue", "angular", "svelte", "next.js", "nuxt", "express",
        "fastapi", "django", "flask", "spring boot", "asp.net", "gin", "echo",
        "nestjs", "graphql", "grpc", "rails", "laravel",
    ],
    "databases": [
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb",
        "cassandra", "elasticsearch", "snowflake", "bigquery", "redshift",
        "oracle", "sql server", "mariadb",
    ],
    "cloud": [
        "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform",
        "ansible", "helm", "istio", "prometheus", "grafana", "elk", "datadog",
        "lambda", "cloudformation", "pulumi", "serverless",
    ],
    "data_ml": [
        "pandas", "numpy", "spark", "hadoop", "kafka", "airflow", "dbt",
        "pytorch", "tensorflow", "scikit-learn", "xgboost", "lightgbm",
        "hugging face", "transformers", "llm", "nlp", "computer vision",
        "mlops", "feature engineering", "etl", "data warehouse", "data lake",
    ],
    "tools": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence", "notion",
        "figma", "postman", "insomnia", "swagger", "openapi", "vs code",
        "intellij", "vim", "tmux", "jenkins", "circleci", "github actions",
        "gitlab ci", "argo", "argo cd",
    ],
    "methodologies": [
        "agile", "scrum", "kanban", "tdd", "bdd", "ci/cd", "devops",
        "microservices", "monorepo", "ddd", "clean architecture", "hexagonal",
        "event driven", "serverless", "rest", "graphql",
    ],
}


ALL_TECH_KEYWORDS = []
for cat, keywords in TECH_KEYWORDS.items():
    ALL_TECH_KEYWORDS.extend(keywords)
ALL_TECH_KEYWORDS = list(set(ALL_TECH_KEYWORDS))


EXPERIENCE_PATTERNS = [
    r"(\d+)[\s\-]?(?:year|yr)s?(?:\s+of\s+experience)?",
    r"experience\s+(?:of\s+)?(\d+)[\s\-]?(?:year|yr)s?",
    r"(\d+)\+?\s*(?:year|yr)s?(?:\s+experience)?",
]


def _extract_sections(jd_text: str) -> Dict[str, str]:
    """Split JD into logical sections."""
    sections = {}
    current_section = "header"
    current_content = []

    lines = jd_text.split("\n")
    for line in lines:
        line_stripped = line.strip()
        lower = line_stripped.lower()

        matched_section = None
        for section_name, patterns in JD_SECTION_PATTERNS.items():
            if any(p in lower for p in patterns) and len(line_stripped) < 80:
                matched_section = section_name
                break

        if matched_section:
            if current_content:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = matched_section
            current_content = []
        else:
            current_content.append(line_stripped)

    if current_content:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def _extract_technologies(text: str) -> List[Dict[str, Any]]:
    """Extract technology mentions with categories."""
    text_lower = text.lower()
    found = []

    for category, keywords in TECH_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                count = text_lower.count(kw)
                found.append({
                    "technology": kw,
                    "category": category,
                    "mentions": count,
                })

    found.sort(key=lambda x: x["mentions"], reverse=True)
    return found


def _extract_experience_years(text: str) -> Optional[int]:
    """Extract years of experience required."""
    text_lower = text.lower()
    years = []

    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                y = int(match)
                if 0 <= y <= 20:
                    years.append(y)
            except ValueError:
                pass

    return max(years) if years else None


def _extract_keywords(text: str, max_keywords: int = 30) -> List[str]:
    """Extract important keywords from text."""
    words = re.findall(r"[A-Za-z+#.]{3,}", text.lower())
    stop_words = {
        "the", "and", "for", "with", "from", "your", "this", "that", "have",
        "has", "will", "were", "was", "into", "about", "using", "based",
        "can", "are", "skill", "skills", "experience", "work", "team",
        "you", "our", "we", "their", "will", "must", "should", "need",
        "role", "job", "position", "company", "candidate", "applicant",
    }
    filtered = [w for w in words if w not in stop_words and len(w) > 2]
    freq = Counter(filtered)
    return [w for w, _ in freq.most_common(max_keywords)]


def _classify_requirements(jd_text: str) -> Dict[str, List[str]]:
    """Classify requirements as required vs preferred."""
    sections = _extract_sections(jd_text)
    required = []
    preferred = []

    for section_name, content in sections.items():
        techs = _extract_technologies(content)
        tech_names = [t["technology"] for t in techs]
        if "requirement" in section_name:
            required.extend(tech_names)
        elif "preferred" in section_name:
            preferred.extend(tech_names)
        elif "responsib" in section_name:
            preferred.extend(tech_names)

    if not required and not preferred:
        all_techs = _extract_technologies(jd_text)
        required = [t["technology"] for t in all_techs[:10]]
        preferred = [t["technology"] for t in all_techs[10:20]]

    return {
        "required": list(dict.fromkeys(required)),
        "preferred": list(dict.fromkeys(preferred)),
    }


def _extract_role_from_jd(jd_text: str) -> str:
    """Infer target role from JD."""
    text_lower = jd_text.lower()

    role_patterns = {
        "Software Engineer": ["software engineer", "backend developer", "full stack", "fullstack"],
        "Frontend Developer": ["frontend developer", "front-end developer", "ui developer", "web developer"],
        "Data Scientist": ["data scientist", "machine learning engineer", "ml engineer", "ai engineer"],
        "Data Engineer": ["data engineer", "data platform engineer"],
        "DevOps Engineer": ["devops engineer", "site reliability", "sre", "platform engineer", "cloud engineer"],
        "ML Engineer": ["ml engineer", "machine learning engineer", "ai engineer", "mle"],
        "Mobile Developer": ["mobile developer", "ios developer", "android developer", "flutter", "react native"],
        "Security Engineer": ["security engineer", "cybersecurity", "application security", "information security"],
        "QA Engineer": ["qa engineer", "test engineer", "quality assurance", "sd", "test automation"],
    }

    for role, patterns in role_patterns.items():
        if any(p in text_lower for p in patterns):
            return role

    return "Software Engineer"


def analyze_jd_intelligence(payload) -> Dict[str, Any]:
    """
    Main entry point: structured JD intelligence extraction.

    Accepts either the Pydantic request model or an already-dumped dict so the
    HTTP router and direct callers share a single contract.
    """
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump()
    jd_text = payload.get("job_description", "")
    user_skills = [s.lower() for s in payload.get("user_skills", [])]

    sections = _extract_sections(jd_text)
    technologies = _extract_technologies(jd_text)
    experience_years = _extract_experience_years(jd_text)
    keywords = _extract_keywords(jd_text)
    req_classification = _classify_requirements(jd_text)
    inferred_role = _extract_role_from_jd(jd_text)

    required_skills = req_classification["required"]
    preferred_skills = req_classification["preferred"]

    user_set = set(user_skills)
    required_set = set(required_skills)
    preferred_set = set(preferred_skills)

    matched_required = list(user_set & required_set)
    missing_required = list(required_set - user_set)
    matched_preferred = list(user_set & preferred_set)
    missing_preferred = list(preferred_set - user_set)

    required_coverage = len(matched_required) / len(required_set) if required_set else 1.0
    preferred_coverage = len(matched_preferred) / len(preferred_set) if preferred_set else 1.0

    overall_match = round((required_coverage * 0.7 + preferred_coverage * 0.3) * 100, 1)

    if overall_match >= 75:
        fit = "high"
    elif overall_match >= 50:
        fit = "medium"
    else:
        fit = "low"

    skill_gap_analysis = analyze_skill_coverage(user_skills, required_skills + preferred_skills)

    dependency_gaps = []
    for skill in missing_required[:5]:
        prereqs = get_prerequisites(skill)
        missing_prereqs = [p for p in prereqs if p not in user_set]
        if missing_prereqs:
            dependency_gaps.append({
                "skill": skill,
                "missing_prerequisites": missing_prereqs,
            })

    return {
        "job_description": {
            "inferred_role": inferred_role,
            "experience_years_required": experience_years,
            "keywords": keywords,
            "technologies": technologies,
            "sections_found": list(sections.keys()),
        },
        "requirements": {
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "total_required": len(required_skills),
            "total_preferred": len(preferred_skills),
        },
        "match_analysis": {
            "overall_match_score": overall_match,
            "fit": fit,
            "required_coverage_pct": round(required_coverage * 100, 1),
            "preferred_coverage_pct": round(preferred_coverage * 100, 1),
            "matched_required": matched_required,
            "missing_required": missing_required,
            "matched_preferred": matched_preferred,
            "missing_preferred": missing_preferred,
        },
        "skill_gap_analysis": skill_gap_analysis,
        "dependency_aware_gaps": dependency_gaps,
        "recommendations": _generate_jd_recommendations(
            missing_required, missing_preferred, matched_required, fit
        ),
        "source": "heuristic",
        "confidence": "medium",
    }


def _generate_jd_recommendations(
    missing_required: List[str],
    missing_preferred: List[str],
    matched_required: List[str],
    fit: str,
) -> List[str]:
    recs = []

    if fit == "high":
        recs.append("Strong alignment. Emphasize matched required skills in your application.")
    elif fit == "medium":
        recs.append("Moderate alignment. Address top missing required skills with projects or certifications.")
    else:
        recs.append("Low alignment. Significant upskilling needed before applying.")

    if missing_required:
        recs.append(f"Priority gaps to close: {', '.join(missing_required[:3])}.")

    if missing_preferred:
        recs.append(f"Nice-to-have skills to consider: {', '.join(missing_preferred[:3])}.")

    if matched_required:
        recs.append(f"Highlight these strengths: {', '.join(matched_required[:3])}.")

    return recs