import re
from typing import List


def _extract_keywords(text: str) -> List[str]:
    words = re.findall(r"[A-Za-z+#.]+", text.lower())
    stop_words = {
        "the",
        "and",
        "for",
        "with",
        "from",
        "your",
        "this",
        "that",
        "have",
        "has",
        "will",
        "were",
        "was",
        "into",
        "about",
        "using",
        "based",
        "can",
        "are",
        "skill",
        "skills",
        "experience",
    }
    return [word for word in words if word not in stop_words and len(word) > 2][:20]


def analyze_resume_ats(payload) -> dict:
    resume_text = payload.resume_text
    keywords = _extract_keywords(resume_text)
    score = min(95, 60 + min(25, len(keywords) // 2))

    return {
        "ats_score": round(score, 1),
        "summary": "Resume provides strong technical evidence and should be refined for ATS optimization.",
        "keywords_detected": keywords,
        "recommendations": [
            "Add measurable achievements and impact metrics.",
            "Include role-specific keywords to improve ATS matching.",
            "Use a clean section structure for better parsing.",
        ],
    }


def analyze_skill_gaps(payload) -> dict:
    resume_text = payload.resume_text.lower()
    role = payload.role.lower()
    skills = []

    if "python" in resume_text:
        skills.append("Python")
    if "javascript" in resume_text or "react" in resume_text:
        skills.append("JavaScript")
    if "sql" in resume_text or "database" in resume_text:
        skills.append("SQL")

    missing = []
    if role in {"software engineer", "backend developer"}:
        missing.extend(["System Design", "Data Structures", "APIs"])
    elif role in {"data analyst", "data scientist"}:
        missing.extend(["Statistics", "Machine Learning", "SQL"])
    else:
        missing.extend(["Communication", "Problem Solving", "Project Ownership"])

    return {
        "role": payload.role,
        "detected_skills": skills,
        "missing_skills": missing,
        "gap_summary": "The candidate shows foundational capability but would benefit from targeted improvement in the listed areas.",
    }


def predict_placement(payload) -> dict:
    skills_count = len(payload.skills)
    projects_count = len(payload.projects)
    experience_years = payload.experience_years

    base_score = 45 + min(25, skills_count * 5) + min(15, projects_count * 3) + min(15, experience_years * 3)
    probability = max(30, min(95, base_score))

    return {
        "placement_probability": round(probability, 1),
        "confidence": "medium",
        "factors": [
            "Skill breadth",
            "Project quality",
            "Experience maturity",
            "Resume strength",
        ],
    }


def recommend_companies(payload) -> dict:
    role = payload.target_role.lower()
    skills = payload.skills
    companies = []

    if role in {"software engineer", "backend developer"}:
        companies = ["Infosys", "TCS", "Wipro", "Capgemini"]
    elif role in {"data analyst", "data scientist"}:
        companies = ["Accenture", "Cognizant", "Infosys"]
    else:
        companies = ["TCS", "Infosys", "Capgemini"]

    return {
        "recommended_companies": companies,
        "match_reason": f"Based on your {', '.join(skills[:4]) or 'profile'} and target role, these companies are strong alignment candidates.",
    }


def generate_interview_questions(payload) -> dict:
    role = payload.role.lower()
    difficulty = payload.difficulty.lower()

    if role in {"software engineer", "backend developer"}:
        questions = [
            "Explain the difference between REST and GraphQL.",
            "How would you design a scalable API for a high-traffic system?",
            "Describe how you would optimize a slow database query.",
        ]
    elif role in {"data analyst", "data scientist"}:
        questions = [
            "How do you handle missing values in a dataset?",
            "Explain the tradeoff between bias and variance.",
            "How would you evaluate a machine learning model?",
        ]
    else:
        questions = [
            "Tell me about yourself and your strengths.",
            "How do you approach a new problem under time pressure?",
            "Describe a time you worked in a team to deliver a result.",
        ]

    return {
        "role": payload.role,
        "difficulty": difficulty,
        "questions": questions,
    }
