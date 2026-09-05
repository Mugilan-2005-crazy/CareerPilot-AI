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


def chat(payload) -> dict:
    message = payload.get("message", "").strip().lower()
    context = payload.get("context", {})

    if not message:
        return {"response": "Hello! I'm your CareerPilot AI assistant. Ask me about careers, skills, roadmaps, or job preparation.", "source": "heuristic"}

    if any(word in message for word in ["career", "job", "role", "become"]):
        return {
            "response": "To find the best career match, I can analyze your skills, interests, and experience. Would you like me to run a career compatibility assessment?",
            "source": "heuristic",
            "suggested_action": "career-matching",
        }

    if any(word in message for word in ["skill", "learn", "study", "course"]):
        return {
            "response": "Skill development is key to career growth. Share your current skills and target career, and I'll identify the gaps and create a learning roadmap.",
            "source": "heuristic",
            "suggested_action": "skill-gap-enhanced",
        }

    if any(word in message for word in ["roadmap", "plan", "timeline", "schedule"]):
        return {
            "response": "A structured learning roadmap can keep you on track. Tell me your target career, current skills, and available time per week.",
            "source": "heuristic",
            "suggested_action": "roadmap",
        }

    if any(word in message for word in ["project", "build", "portfolio", "practice"]):
        return {
            "response": "Hands-on projects are the best way to prove your skills. I can recommend projects tailored to your target career and current skill level.",
            "source": "heuristic",
            "suggested_action": "project-recommendations",
        }

    if any(word in message for word in ["interview", "question", "prepare", "hire"]):
        return {
            "response": "Interview preparation requires both technical and behavioral practice. I can generate role-specific interview questions for you.",
            "source": "heuristic",
            "suggested_action": "interview-questions",
        }

    if any(word in message for word in ["resume", "cv", "ats", "format"]):
        return {
            "response": "A strong resume should highlight achievements with metrics. Paste your resume text and I can provide ATS feedback and improvement suggestions.",
            "source": "heuristic",
            "suggested_action": "resume-analysis",
        }

    return {
        "response": "I'm here to help with career planning, skill development, roadmaps, projects, and interview preparation. What would you like to focus on?",
        "source": "heuristic",
    }


def analyze_job_description(payload) -> dict:
    jd_text = payload.get("job_description", "").lower()
    user_skills = [s.lower() for s in payload.get("user_skills", [])]

    keywords = _extract_keywords(jd_text)
    required = []
    preferred = []
    for kw in keywords:
        if any(term in kw for term in ["must", "required", "essential", "minimum"]):
            required.append(kw)
        else:
            preferred.append(kw)

    matched = [s for s in user_skills if any(s in kw or kw in s for kw in keywords)]
    missing = [kw for kw in required if not any(s in kw or kw in s for s in user_skills)]

    match_score = 0
    if keywords:
        match_score = round((len(matched) / len(keywords)) * 100)

    fit = "low"
    if match_score >= 75:
        fit = "high"
    elif match_score >= 50:
        fit = "medium"

    return {
        "match_score": match_score,
        "fit": fit,
        "required_keywords": required,
        "preferred_keywords": preferred,
        "matched_skills": matched,
        "missing_keywords": missing,
        "recommendation": (
            "Strong alignment. Highlight matched skills in your application."
            if fit == "high"
            else "Moderate alignment. Address missing keywords with projects or learning."
            if fit == "medium"
            else "Low alignment. Consider upskilling in missing areas before applying."
        ),
    }


def analyze_career_transition(payload) -> dict:
    current_career = payload.get("current_career", "").strip().lower()
    target_career = payload.get("target_career", "").strip().lower()
    current_skills = [s.lower() for s in payload.get("current_skills", [])]
    experience_years = payload.get("experience_years", 0)

    if not current_career or not target_career:
        return {
            "transition_feasibility": "unknown",
            "estimated_transition_time": "unknown",
            "transferable_skills": [],
            "new_skills_required": [],
            "recommended_steps": [],
        }

    career_map = {
        "software engineer": ["python", "javascript", "sql", "git", "data structures", "system design"],
        "data scientist": ["python", "sql", "statistics", "machine learning", "data analysis"],
        "data engineer": ["python", "sql", "etl", "data warehousing", "cloud"],
        "ml engineer": ["python", "machine learning", "deep learning", "mlops", "docker"],
        "cloud engineer": ["cloud", "linux", "networking", "python", "terraform"],
        "devops engineer": ["linux", "docker", "kubernetes", "ci/cd", "terraform", "python"],
        "cybersecurity analyst": ["networking", "linux", "security fundamentals", "python", "siem"],
    }

    target_skills = set(career_map.get(target_career, []))
    if not target_skills:
        return {
            "transition_feasibility": "unknown",
            "estimated_transition_time": "unknown",
            "transferable_skills": [],
            "new_skills_required": [],
            "recommended_steps": [f"Target career '{target_career}' is not in the knowledge base."],
        }

    transferable = [s for s in current_skills if s in target_skills]
    new_required = [s for s in target_skills if s not in current_skills]

    coverage = len(transferable) / len(target_skills) if target_skills else 0
    if coverage >= 0.7:
        feasibility = "high"
        transition_time = "3-6 months"
    elif coverage >= 0.4:
        feasibility = "medium"
        transition_time = "6-12 months"
    else:
        feasibility = "low"
        transition_time = "12-24 months"

    steps = [
        f"Assess your current proficiency in {', '.join(transferable[:3]) or 'transferable skills'}.",
        f"Build projects that combine your {current_career} experience with {target_career} requirements.",
        f"Fill skill gaps: {', '.join(new_required[:3]) or 'none identified'}.",
        "Obtain relevant certifications for the target role.",
        "Network with professionals in the target field.",
    ]

    return {
        "current_career": current_career,
        "target_career": target_career,
        "transition_feasibility": feasibility,
        "estimated_transition_time": transition_time,
        "experience_years": experience_years,
        "transferable_skills": transferable,
        "new_skills_required": new_required,
        "skill_coverage": round(coverage * 100, 1),
        "recommended_steps": steps,
    }
