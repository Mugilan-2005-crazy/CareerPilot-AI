from typing import List, Dict, Any, Optional
import random

from app.services.skill_graph import (
    get_prerequisites,
    get_related_skills,
    get_learning_order,
    analyze_skill_coverage,
)

CAREERS = [
    {
        "id": "software-engineer",
        "name": "Software Engineer",
        "domain": "Software Engineering",
        "experience_level": "entry",
        "required_skills": ["python", "javascript", "sql", "git", "data structures"],
        "preferred_skills": ["react", "node.js", "docker", "aws", "system design"],
        "education": ["BS in Computer Science or related field"],
        "tools": ["git", "docker", "ide", "ci/cd"],
        "certifications": ["aws developer", "google cloud professional"],
        "learning_path": ["Programming Fundamentals", "Data Structures", "System Design", "Cloud Basics"],
    },
    {
        "id": "data-scientist",
        "name": "Data Scientist",
        "domain": "Data Science",
        "experience_level": "entry",
        "required_skills": ["python", "sql", "statistics", "machine learning", "data analysis"],
        "preferred_skills": ["deep learning", "nlp", "computer vision", "big data", "spark"],
        "education": ["BS/MS in Statistics, Math, CS, or related field"],
        "tools": ["pandas", "numpy", "scikit-learn", "jupyter", "sql"],
        "certifications": ["aws machine learning", "google data engineer", "coursera data science"],
        "learning_path": ["Python", "Statistics", "SQL", "Machine Learning", "Deep Learning", "MLOps"],
    },
    {
        "id": "data-engineer",
        "name": "Data Engineer",
        "domain": "Data Engineering",
        "experience_level": "entry",
        "required_skills": ["python", "sql", "etl", "data warehousing", "cloud"],
        "preferred_skills": ["spark", "kafka", "airflow", "docker", "kubernetes"],
        "education": ["BS in CS, Engineering, or related field"],
        "tools": ["spark", "airflow", "dbt", "snowflake", "redshift"],
        "certifications": ["aws data engineer", "google cloud data engineer", "databricks certified"],
        "learning_path": ["SQL", "Python", "ETL/ELT", "Data Modeling", "Cloud Data Platforms", "Orchestration"],
    },
    {
        "id": "ml-engineer",
        "name": "ML Engineer",
        "domain": "AI/ML",
        "experience_level": "mid",
        "required_skills": ["python", "machine learning", "deep learning", "mlops", "docker"],
        "preferred_skills": ["kubernetes", "aws", "gcp", "pytorch", "tensorflow", "model serving"],
        "education": ["MS/PhD in ML, CS, or related field (preferred)"],
        "tools": ["pytorch", "tensorflow", "mlflow", "kubernetes", "docker", "aws sagemaker"],
        "certifications": ["aws machine learning specialty", "gcp professional ml engineer"],
        "learning_path": ["ML Fundamentals", "Deep Learning", "MLOps", "Model Deployment", "Scaling"],
    },
    {
        "id": "cloud-engineer",
        "name": "Cloud Engineer",
        "domain": "Cloud Computing",
        "experience_level": "entry",
        "required_skills": ["cloud", "linux", "networking", "python", "terraform"],
        "preferred_skills": ["kubernetes", "docker", "aws", "azure", "gcp", "ci/cd"],
        "education": ["BS in CS or related field"],
        "tools": ["terraform", "docker", "kubernetes", "aws cli", "ansible"],
        "certifications": ["aws solutions architect", "azure administrator", "cka", "ckad"],
        "learning_path": ["Linux/Networking", "Cloud Fundamentals", "Containers", "IaC", "Orchestration", "Security"],
    },
    {
        "id": "devops-engineer",
        "name": "DevOps Engineer",
        "domain": "DevOps",
        "experience_level": "mid",
        "required_skills": ["linux", "docker", "kubernetes", "ci/cd", "terraform", "python"],
        "preferred_skills": ["aws", "azure", "gcp", "ansible", "monitoring", "security"],
        "education": ["BS in CS or related field"],
        "tools": ["jenkins", "gitlab ci", "terraform", "prometheus", "grafana", "ansible"],
        "certifications": ["cka", "aws devops engineer", "terraform associate"],
        "learning_path": ["OS/Networking", "Containers", "Orchestration", "IaC", "CI/CD", "Observability"],
    },
    {
        "id": "cybersecurity-analyst",
        "name": "Cybersecurity Analyst",
        "domain": "Cybersecurity",
        "experience_level": "entry",
        "required_skills": ["networking", "linux", "security fundamentals", "python", "siem"],
        "preferred_skills": ["cloud security", "incident response", "forensics", "compliance"],
        "education": ["BS in Cybersecurity, CS, or related field"],
        "tools": ["wireshark", "nmap", "splunk", "siem", "vpn", "firewalls"],
        "certifications": ["security+", "ceh", "cysa+", "gsec"],
        "learning_path": ["Networking", "Linux", "Security Fundamentals", "SIEM/Logging", "Incident Response", "Compliance"],
    },
]

PROJECTS = [
    {
        "title": "Personal Portfolio Website",
        "description": "Build a responsive portfolio website with project showcase and contact form.",
        "problem": "Developers need a professional online presence to showcase their work and attract opportunities.",
        "technologies": ["react", "typescript", "tailwind css", "vite"],
        "skills_covered": ["frontend", "react", "css", "responsive design"],
        "difficulty": "beginner",
        "expected_outcome": "A deployed portfolio site with 3-4 projects showcased.",
        "architecture": "Single-page React app with component-based architecture.",
        "milestones": ["Setup project", "Build components", "Add projects", "Deploy"],
        "resume_bullets": ["Built responsive portfolio website using React and Tailwind CSS", "Implemented component-based architecture with 95% Lighthouse score"],
        "portfolio_impact": 0.7,
        "industry_relevance": 0.8,
        "differentiation": 0.3,
    },
    {
        "title": "E-commerce API",
        "description": "Design and implement a RESTful API for an e-commerce platform with authentication and payments.",
        "problem": "Online stores need reliable, scalable APIs to manage products, orders, and users.",
        "technologies": ["node.js", "express", "mongodb", "jwt", "stripe"],
        "skills_covered": ["backend", "api design", "authentication", "database", "payments"],
        "difficulty": "intermediate",
        "expected_outcome": "A production-ready API with auth, CRUD operations, and payment integration.",
        "architecture": "Layered Node.js API with controllers, services, and MongoDB repository.",
        "milestones": ["Schema design", "Auth system", "CRUD endpoints", "Payment integration", "Testing"],
        "resume_bullets": ["Architected RESTful e-commerce API handling 1000+ requests/day", "Implemented JWT authentication and Stripe payment integration"],
        "portfolio_impact": 0.9,
        "industry_relevance": 0.9,
        "differentiation": 0.5,
    },
    {
        "title": "Real-time Chat Application",
        "description": "Build a real-time chat app with WebSockets, user presence, and message history.",
        "problem": "Teams need real-time communication tools with reliable message delivery.",
        "technologies": ["react", "socket.io", "node.js", "redis", "mongodb"],
        "skills_covered": ["websockets", "real-time", "react", "backend", "redis"],
        "difficulty": "intermediate",
        "expected_outcome": "A chat app with rooms, private messaging, and online status indicators.",
        "architecture": "Socket.io server with React frontend and Redis for session management.",
        "milestones": ["WebSocket setup", "Room management", "Private messaging", "Online status", "Deploy"],
        "resume_bullets": ["Developed real-time chat application supporting 500+ concurrent users", "Implemented WebSocket communication with Redis pub/sub for horizontal scaling"],
        "portfolio_impact": 0.8,
        "industry_relevance": 0.7,
        "differentiation": 0.6,
    },
    {
        "title": "Data Pipeline with Airflow",
        "description": "Build an ETL pipeline that extracts data from APIs, transforms it, and loads into a warehouse.",
        "problem": "Organizations need reliable data pipelines to consolidate data from multiple sources.",
        "technologies": ["python", "apache airflow", "postgresql", "aws s3", "pandas"],
        "skills_covered": ["etl", "data engineering", "airflow", "python", "data warehousing"],
        "difficulty": "advanced",
        "expected_outcome": "A scheduled DAG that processes 1M+ records daily with monitoring.",
        "architecture": "Airflow DAGs orchestrating Python tasks with S3 and PostgreSQL.",
        "milestones": ["Data source setup", "Extraction tasks", "Transformation logic", "Loading pipeline", "Monitoring"],
        "resume_bullets": ["Built production ETL pipeline processing 1M+ records daily with Apache Airflow", "Reduced data latency by 60% through optimized transformation logic"],
        "portfolio_impact": 0.9,
        "industry_relevance": 0.95,
        "differentiation": 0.7,
    },
    {
        "title": "ML Image Classifier",
        "description": "Train and deploy an image classification model using transfer learning.",
        "problem": "Businesses need automated image classification for content moderation and product tagging.",
        "technologies": ["python", "pytorch", "fastapi", "docker", "aws"],
        "skills_covered": ["deep learning", "computer vision", "pytorch", "api design", "deployment"],
        "difficulty": "advanced",
        "expected_outcome": "A deployed model API with 90%+ accuracy on test dataset.",
        "architecture": "PyTorch model served via FastAPI with Docker containerization.",
        "milestones": ["Dataset preparation", "Model training", "Evaluation", "API wrapper", "Deployment"],
        "resume_bullets": ["Developed image classifier achieving 92% accuracy using transfer learning", "Deployed model via FastAPI Docker container on AWS ECS"],
        "portfolio_impact": 0.95,
        "industry_relevance": 0.9,
        "differentiation": 0.8,
    },
    {
        "title": "Infrastructure as Code with Terraform",
        "description": "Provision and manage cloud infrastructure using Terraform on AWS.",
        "problem": "Manual infrastructure management is error-prone and doesn't scale.",
        "technologies": ["terraform", "aws", "github actions", "python"],
        "skills_covered": ["terraform", "aws", "iac", "devops", "ci/cd"],
        "difficulty": "intermediate",
        "expected_outcome": "A reusable Terraform module deploying a 3-tier architecture.",
        "architecture": "Modular Terraform with remote state in S3 and CI/CD via GitHub Actions.",
        "milestones": ["VPC setup", "Compute resources", "Database setup", "CI/CD pipeline", "Documentation"],
        "resume_bullets": ["Provisioned 3-tier AWS infrastructure using Terraform with 99.9% uptime", "Implemented CI/CD pipeline reducing deployment time from hours to minutes"],
        "portfolio_impact": 0.8,
        "industry_relevance": 0.85,
        "differentiation": 0.6,
    },
]

LEARNING_RESOURCES = [
    {
        "title": "Python for Everybody",
        "description": "Comprehensive Python course covering basics to advanced topics.",
        "type": "course",
        "provider": "Coursera",
        "skills": ["python"],
        "related_careers": ["software-engineer", "data-scientist", "data-engineer"],
        "difficulty": "beginner",
        "estimated_hours": 40,
        "is_free": True,
        "rating": 4.8,
    },
    {
        "title": "Machine Learning Specialization",
        "description": "Andrew Ng's ML course covering supervised/unsupervised learning and best practices.",
        "type": "course",
        "provider": "Coursera",
        "skills": ["machine learning", "python", "deep learning"],
        "related_careers": ["data-scientist", "ml-engineer"],
        "difficulty": "intermediate",
        "estimated_hours": 60,
        "is_free": False,
        "rating": 4.9,
    },
    {
        "title": "AWS Certified Solutions Architect",
        "description": "Official AWS training for solutions architect certification.",
        "type": "certification",
        "provider": "AWS",
        "skills": ["aws", "cloud", "architecture"],
        "related_careers": ["cloud-engineer", "devops-engineer", "software-engineer"],
        "difficulty": "intermediate",
        "estimated_hours": 80,
        "is_free": False,
        "rating": 4.7,
    },
    {
        "title": "Docker and Kubernetes: The Complete Guide",
        "description": "Hands-on guide to containerization and orchestration.",
        "type": "course",
        "provider": "Udemy",
        "skills": ["docker", "kubernetes", "devops"],
        "related_careers": ["devops-engineer", "cloud-engineer", "ml-engineer"],
        "difficulty": "intermediate",
        "estimated_hours": 35,
        "is_free": False,
        "rating": 4.6,
    },
    {
        "title": "Cybersecurity Fundamentals",
        "description": "Introduction to cybersecurity concepts, threats, and defenses.",
        "type": "course",
        "provider": "Coursera",
        "skills": ["security fundamentals", "networking", "linux"],
        "related_careers": ["cybersecurity-analyst"],
        "difficulty": "beginner",
        "estimated_hours": 30,
        "is_free": True,
        "rating": 4.5,
    },
]


def _normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def _calculate_career_match(
    skills: List[str],
    interests: List[str],
    experience_years: int,
    career: Dict[str, Any],
    proficiency_map: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    user_skills = set(_normalize_skill(s) for s in skills)
    required = set(_normalize_skill(s) for s in career.get("required_skills", []))
    preferred = set(_normalize_skill(s) for s in career.get("preferred_skills", []))

    required_match = user_skills & required
    preferred_match = user_skills & preferred
    total_required = len(required) or 1

    skill_score = (len(required_match) / total_required) * 70 + (len(preferred_match) / max(len(preferred), 1)) * 20

    proficiency_bonus = 0.0
    if proficiency_map:
        for skill in required_match | preferred_match:
            level = proficiency_map.get(skill, "intermediate")
            if level == "expert":
                proficiency_bonus += 1.5
            elif level == "advanced":
                proficiency_bonus += 1.0
            elif level == "intermediate":
                proficiency_bonus += 0.5
    proficiency_bonus = min(10, proficiency_bonus)

    experience_bonus = min(10, experience_years * 2)
    interest_bonus = 5 if any(_normalize_skill(i) in [career["domain"].lower()] for i in interests) else 0

    match_score = min(100, round(skill_score + proficiency_bonus + experience_bonus + interest_bonus))

    missing = list(required - user_skills)
    strengths = list(required_match)

    return {
        "career": career["name"],
        "career_id": career["id"],
        "match_score": match_score,
        "confidence": "high" if match_score > 75 else "medium" if match_score > 50 else "low",
        "strengths": strengths,
        "skill_gaps": missing,
        "recommended_next_skills": missing[:3],
        "reasoning": f"Skill compatibility: {len(required_match)}/{total_required} required skills matched. Experience: {experience_years} years.",
        "alternative_careers": [],
        "source": "heuristic",
        "score_breakdown": {
            "skill_compatibility": round(skill_score, 1),
            "proficiency_bonus": round(proficiency_bonus, 1),
            "experience_bonus": experience_bonus,
            "interest_bonus": interest_bonus,
        },
    }


def match_careers(payload: Dict[str, Any]) -> Dict[str, Any]:
    skills = [_normalize_skill(s) for s in payload.get("skills", [])]
    interests = [_normalize_skill(s) for s in payload.get("interests", [])]
    experience_years = payload.get("experience_years", 0)
    target_domains = [_normalize_skill(d) for d in payload.get("target_domains", [])]
    proficiency_map = payload.get("proficiency", {})

    candidates = CAREERS
    if target_domains:
        candidates = [c for c in candidates if c["domain"].lower() in target_domains]

    results = [_calculate_career_match(skills, interests, experience_years, c, proficiency_map) for c in candidates]
    results.sort(key=lambda x: x["match_score"], reverse=True)

    top = results[0] if results else None
    alternatives = [r for r in results[1:] if r["match_score"] >= 40][:3]

    if top:
        top["alternative_careers"] = [a["career_id"] for a in alternatives]

    return {
        "top_career": top,
        "all_matches": results[:5],
        "total_evaluated": len(results),
        "source": "heuristic",
    }


def _classify_gap_priority(missing: List[str], required: List[str]) -> str:
    if not missing:
        return "low"
    ratio = len(missing) / len(required) if required else 1
    if ratio > 0.7 or any(_normalize_skill(s) in ["system design", "machine learning", "deep learning"] for s in missing):
        return "critical"
    if ratio > 0.4:
        return "high"
    if ratio > 0.1:
        return "medium"
    return "low"


def analyze_skill_gap_enhanced(payload: Dict[str, Any]) -> Dict[str, Any]:
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    target_career = payload.get("target_career", "").strip().lower()
    experience_years = payload.get("experience_years", 0)
    proficiency_map = payload.get("proficiency", {})

    career = next((c for c in CAREERS if target_career in c["name"].lower() or target_career in c["id"]), None)

    if not career:
        return {
            "target_career": target_career,
            "detected_skills": current_skills,
            "missing_skills": [],
            "gap_summary": "Target career not found in knowledge base. Please verify the career name.",
            "priority": "unknown",
            "estimated_effort": "unknown",
            "prerequisites": [],
            "recommended_projects": [],
            "source": "heuristic",
        }

    required = [_normalize_skill(s) for s in career.get("required_skills", [])]
    preferred = [_normalize_skill(s) for s in career.get("preferred_skills", [])]

    detected = [s for s in current_skills if s in required or s in preferred]
    missing = [s for s in required if s not in current_skills]

    priority = _classify_gap_priority(missing, required)
    base_hours = len(missing) * 20

    proficiency_adjustment = 0
    for skill in current_skills:
        level = proficiency_map.get(skill, "intermediate")
        if level == "expert":
            proficiency_adjustment -= 5
        elif level == "advanced":
            proficiency_adjustment -= 3
        elif level == "beginner":
            proficiency_adjustment += 5

    estimated_hours = max(10, base_hours + proficiency_adjustment)

    missing_with_prereqs = []
    for skill in missing:
        prereqs = get_prerequisites(skill)
        missing_with_prereqs.append({
            "skill": skill,
            "priority": "critical" if skill in required[:3] else "high",
            "prerequisites": prereqs,
            "estimated_hours": 20,
        })

    recommended_projects = [
        p["title"] for p in PROJECTS
        if any(s in p["skills_covered"] for s in missing)
    ][:3]

    return {
        "target_career": career["name"],
        "detected_skills": detected,
        "missing_skills": missing,
        "gap_summary": f"{len(missing)} required skills missing for {career['name']}. Experience: {experience_years} years.",
        "priority": priority,
        "estimated_effort": f"{estimated_hours} hours",
        "missing_skills_detailed": missing_with_prereqs,
        "prerequisites": [],
        "recommended_projects": recommended_projects,
        "source": "heuristic",
    }


def generate_roadmap(payload: Dict[str, Any]) -> Dict[str, Any]:
    target_career = payload.get("target_career", "").strip().lower()
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    available_hours = payload.get("available_hours_per_week", 10)
    duration_months = payload.get("duration_months", 6)
    learning_preference = payload.get("learning_preference", "mixed")
    completed_skills = [_normalize_skill(s) for s in payload.get("completed_skills", [])]
    failed_skills = [_normalize_skill(s) for s in payload.get("failed_skills", [])]

    career = next((c for c in CAREERS if target_career in c["name"].lower() or target_career in c["id"]), None)

    if not career:
        return {
            "target_career": target_career,
            "milestones": [],
            "estimated_completion": "unknown",
            "source": "heuristic",
        }

    learning_path = career.get("learning_path", [])
    total_weeks = duration_months * 4
    available_skills = set(current_skills) | set(completed_skills)
    skills_to_learn = [s for s in learning_path if _normalize_skill(s) not in available_skills]

    for skill in failed_skills:
        if skill in skills_to_learn:
            skills_to_learn.remove(skill)
            skills_to_learn.append(f"retry-{skill}")

    ordered_skills = get_learning_order(skills_to_learn)
    weeks_per_milestone = max(1, total_weeks // max(len(ordered_skills), 1)) if ordered_skills else 0

    milestones = []
    current_week = 0
    for idx, topic in enumerate(ordered_skills):
        current_week += weeks_per_milestone
        milestones.append({
            "title": topic,
            "description": f"Complete {topic} learning through {learning_preference} resources.",
            "skills": [],
            "estimated_weeks": weeks_per_milestone,
            "completed": False,
            "order": idx + 1,
        })

    return {
        "target_career": career["name"],
        "duration_months": duration_months,
        "available_hours_per_week": available_hours,
        "milestones": milestones,
        "estimated_completion": f"{duration_months} months",
        "source": "heuristic",
    }


def recommend_projects(payload: Dict[str, Any]) -> Dict[str, Any]:
    target_career = payload.get("target_career", "").strip().lower()
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    difficulty = payload.get("difficulty", "intermediate")
    count = payload.get("count", 3)
    completed_projects = [_normalize_skill(s) for s in payload.get("completed_projects", [])]

    career = next((c for c in CAREERS if target_career in c["name"].lower() or target_career in c["id"]), None)

    filtered = [p for p in PROJECTS if p["difficulty"] == difficulty]
    if not filtered:
        filtered = PROJECTS

    scored = []
    for p in filtered:
        if _normalize_skill(p["title"]) in completed_projects:
            continue
        skill_overlap = len(set(_normalize_skill(s) for s in p["skills_covered"]) & set(current_skills))
        base_score = skill_overlap * 2
        project_score = (
            base_score
            + (p.get("portfolio_impact", 0.5) * 10)
            + (p.get("industry_relevance", 0.5) * 10)
            + (p.get("differentiation", 0.5) * 10)
        )
        scored.append((project_score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    recommendations = [p for _, p in scored[:count]]

    return {
        "target_career": target_career,
        "difficulty": difficulty,
        "recommendations": recommendations,
        "count": len(recommendations),
        "source": "heuristic",
    }
