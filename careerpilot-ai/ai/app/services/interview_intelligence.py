"""
Interview Intelligence — Continuous interview feedback loop (v1.1 P1).

Tracks interview performance, extracts weak areas, and feeds evidence back
into the Career Twin for continuous readiness recomputation.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from collections import defaultdict


INTERVIEW_TYPES = {
    "technical": {
        "name": "Technical Interview",
        "focus": ["problem solving", "coding", "system design", "debugging", "algorithms"],
        "weight": 1.0,
    },
    "behavioral": {
        "name": "Behavioral Interview",
        "focus": ["communication", "teamwork", "leadership", "conflict resolution", "adaptability"],
        "weight": 0.8,
    },
    "hr": {
        "name": "HR Interview",
        "focus": ["culture fit", "motivation", "career goals", "salary expectations", "availability"],
        "weight": 0.6,
    },
    "communication": {
        "name": "Communication Assessment",
        "focus": ["clarity", "structure", "active listening", "presentation", "english proficiency"],
        "weight": 0.7,
    },
    "aptitude": {
        "name": "Aptitude Test",
        "focus": ["quantitative", "logical reasoning", "verbal ability", "data interpretation"],
        "weight": 0.7,
    },
}


def _analyze_session_performance(session: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze a single interview session."""
    session_type = session.get("interview_type", "technical")
    type_config = INTERVIEW_TYPES.get(session_type, INTERVIEW_TYPES["technical"])

    questions = session.get("questions", [])
    if not questions:
        return {"error": "No questions in session"}

    total_score = 0
    topic_scores = defaultdict(list)
    weak_topics = []

    for q in questions:
        score = q.get("score", 0)
        topic = q.get("topic", "general")
        max_score = q.get("max_score", 10)

        if max_score > 0:
            pct = (score / max_score) * 100
            total_score += pct
            topic_scores[topic].append(pct)

    avg_score = total_score / len(questions) if questions else 0

    for topic, scores in topic_scores.items():
        avg_topic = sum(scores) / len(scores)
        if avg_topic < 60:
            weak_topics.append({"topic": topic, "avg_score": round(avg_topic, 1), "count": len(scores)})

    weak_topics.sort(key=lambda x: x["avg_score"])

    return {
        "session_id": session.get("session_id", ""),
        "interview_type": session_type,
        "date": session.get("date", ""),
        "overall_score": round(avg_score, 1),
        "topic_scores": {t: round(sum(s) / len(s), 1) for t, s in topic_scores.items()},
        "weak_topics": weak_topics[:5],
        "questions_attempted": len(questions),
        "strengths": [t for t, s in topic_scores.items() if sum(s) / len(s) >= 80][:3],
    }


def _extract_evidence_from_sessions(sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract skill evidence from interview sessions."""
    skill_evidence = defaultdict(lambda: {"count": 0, "scores": [], "topics": set()})

    for session in sessions:
        session_type = session.get("interview_type", "technical")
        type_config = INTERVIEW_TYPES.get(session_type, INTERVIEW_TYPES["technical"])

        for q in session.get("questions", []):
            topic = q.get("topic", "").lower()
            score = q.get("score", 0)
            max_score = q.get("max_score", 10)

            if max_score > 0:
                pct = (score / max_score) * 100

                for focus in type_config["focus"]:
                    if focus in topic or topic in focus:
                        skill_evidence[focus]["count"] += 1
                        skill_evidence[focus]["scores"].append(pct)
                        skill_evidence[focus]["topics"].add(topic)

    result = {}
    for skill, data in skill_evidence.items():
        if data["count"] > 0:
            avg_score = sum(data["scores"]) / len(data["scores"])
            result[skill] = {
                "skill": skill,
                "proficiency": _score_to_proficiency(avg_score),
                "evidence_count": data["count"],
                "avg_score": round(avg_score, 1),
                "topics_covered": list(data["topics"]),
                "source": "interview",
            }

    return result


def _score_to_proficiency(score: float) -> str:
    if score >= 85:
        return "expert"
    elif score >= 70:
        return "advanced"
    elif score >= 55:
        return "intermediate"
    elif score >= 40:
        return "beginner"
    return "unknown"


def _generate_interview_recommendations(
    weak_topics: List[Dict[str, Any]],
    strengths: List[str],
    interview_type: str,
) -> List[Dict[str, Any]]:
    """Generate targeted recommendations based on interview performance."""
    recommendations = []

    for weak in weak_topics[:3]:
        topic = weak["topic"]
        recommendations.append({
            "type": "skill_gap",
            "priority": "high",
            "title": f"Improve {topic.title()}",
            "description": f"Your {topic} score is {weak['avg_score']}%. Practice targeted problems.",
            "action": f"Complete 5-10 practice problems on {topic}",
            "estimated_hours": 5,
        })

    if strengths:
        recommendations.append({
            "type": "validation",
            "priority": "medium",
            "title": "Validate Strengths",
            "description": f"You're strong in {', '.join(strengths[:2])}. Demonstrate with a project.",
            "action": "Build a project showcasing these strengths",
            "estimated_hours": 10,
        })

    type_config = INTERVIEW_TYPES.get(interview_type, INTERVIEW_TYPES["technical"])
    for focus in type_config["focus"][:2]:
        recommendations.append({
            "type": "practice",
            "priority": "medium",
            "title": f"Practice {focus.title()}",
            "description": f"Regular practice improves {focus} interview performance.",
            "action": f"Weekly {focus} mock interview or practice session",
            "estimated_hours": 2,
        })

    return recommendations


def analyze_interview_intelligence(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point: analyze interview performance and generate intelligence.
    """
    target_role = payload.get("target_role", "")
    current_skills = [s.lower() for s in payload.get("current_skills", [])]
    skill_evidence = payload.get("skill_evidence", [])
    experience_years = payload.get("experience_years", 0)
    interview_type = payload.get("interview_type", "technical")
    completed_sessions = payload.get("completed_sessions", [])

    if not completed_sessions:
        return {
            "target_role": target_role,
            "message": "No interview sessions completed yet. Start practicing to build interview intelligence.",
            "recommendations": [
                {
                    "type": "practice",
                    "priority": "high",
                    "title": "Start Interview Practice",
                    "description": "Begin with mock interviews to establish baseline performance.",
                    "action": "Complete your first mock interview session",
                    "estimated_hours": 1,
                }
            ],
            "source": "heuristic",
        }

    session_analyses = []
    all_weak_topics = []
    all_strengths = []

    for session in completed_sessions:
        analysis = _analyze_session_performance(session)
        if "error" not in analysis:
            session_analyses.append(analysis)
            all_weak_topics.extend(analysis.get("weak_topics", []))
            all_strengths.extend(analysis.get("strengths", []))

    topic_weakness = defaultdict(list)
    for wt in all_weak_topics:
        topic_weakness[wt["topic"]].append(wt["avg_score"])

    aggregated_weak = []
    for topic, scores in topic_weakness.items():
        aggregated_weak.append({
            "topic": topic,
            "avg_score": round(sum(scores) / len(scores), 1),
            "session_count": len(scores),
            "trend": "improving" if len(scores) > 1 and scores[-1] > scores[0] else "stable",
        })
    aggregated_weak.sort(key=lambda x: x["avg_score"])

    interview_evidence = _extract_evidence_from_sessions(completed_sessions)

    latest_session = session_analyses[-1] if session_analyses else None
    overall_trend = "insufficient_data"
    if len(session_analyses) >= 2:
        first_score = session_analyses[0]["overall_score"]
        last_score = session_analyses[-1]["overall_score"]
        if last_score > first_score + 5:
            overall_trend = "improving"
        elif last_score < first_score - 5:
            overall_trend = "declining"
        else:
            overall_trend = "stable"

    recommendations = _generate_interview_recommendations(aggregated_weak, list(set(all_strengths)), interview_type)

    readiness_impact = {}
    for skill, evidence in interview_evidence.items():
        readiness_impact[skill] = {
            "evidence_added": True,
            "proficiency": evidence["proficiency"],
            "confidence": "medium" if evidence["evidence_count"] >= 2 else "low",
            "source": "interview_performance",
        }

    return {
        "target_role": target_role,
        "interview_type": interview_type,
        "sessions_analyzed": len(completed_sessions),
        "overall_trend": overall_trend,
        "latest_session_score": latest_session["overall_score"] if latest_session else None,
        "session_history": [
            {
                "date": s.get("date", ""),
                "score": s.get("overall_score", 0),
                "type": s.get("interview_type", ""),
            }
            for s in session_analyses
        ],
        "aggregated_weak_topics": aggregated_weak[:5],
        "strengths": list(set(all_strengths))[:5],
        "interview_evidence": interview_evidence,
        "readiness_impact": readiness_impact,
        "recommendations": recommendations,
        "source": "heuristic",
        "confidence": "medium" if len(completed_sessions) >= 3 else "low",
    }


def generate_interview_questions_intelligent(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate interview questions tailored to the candidate's profile and gaps.
    """
    target_role = payload.get("target_role", "")
    current_skills = [s.lower() for s in payload.get("current_skills", [])]
    skill_evidence = payload.get("skill_evidence", [])
    experience_years = payload.get("experience_years", 0)
    interview_type = payload.get("interview_type", "technical")
    count = payload.get("count", 10)

    evidence_map = {_normalize_skill(e["skill"]): e for e in skill_evidence if e.get("skill")}

    weak_skills = []
    for skill in current_skills:
        ev = evidence_map.get(skill)
        if not ev or ev.get("evidence_count", 0) == 0:
            weak_skills.append(skill)

    questions = []

    if interview_type == "technical":
        question_pool = _get_technical_questions(target_role, current_skills, weak_skills)
    elif interview_type == "behavioral":
        question_pool = _get_behavioral_questions(target_role, experience_years)
    elif interview_type == "hr":
        question_pool = _get_hr_questions(target_role)
    elif interview_type == "communication":
        question_pool = _get_communication_questions()
    else:
        question_pool = _get_technical_questions(target_role, current_skills, weak_skills)

    selected = question_pool[:count]

    return {
        "target_role": target_role,
        "interview_type": interview_type,
        "questions": selected,
        "tailored_for": {
            "weak_skills": weak_skills[:5],
            "strong_skills": [s for s in current_skills if s not in weak_skills][:5],
        },
        "source": "heuristic",
    }


def _normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def _get_technical_questions(role: str, current_skills: List[str], weak_skills: List[str]) -> List[Dict[str, Any]]:
    role_lower = role.lower()
    questions = []

    if "frontend" in role_lower or "web" in role_lower:
        questions.extend([
            {"topic": "javascript", "question": "Explain event delegation and when you would use it.", "difficulty": "medium"},
            {"topic": "react", "question": "How does React's virtual DOM work? What are the performance implications?", "difficulty": "medium"},
            {"topic": "css", "question": "Explain CSS Grid vs Flexbox. When would you use each?", "difficulty": "easy"},
            {"topic": "typescript", "question": "What are generics in TypeScript? Give a practical example.", "difficulty": "medium"},
            {"topic": "performance", "question": "How would you optimize a slow React application?", "difficulty": "hard"},
        ])
    elif "backend" in role_lower or "api" in role_lower:
        questions.extend([
            {"topic": "api design", "question": "Design a RESTful API for a blog platform. How would you handle versioning?", "difficulty": "medium"},
            {"topic": "database", "question": "Explain database indexing. When does it help and when does it hurt?", "difficulty": "medium"},
            {"topic": "system design", "question": "Design a URL shortener service. How do you handle scale?", "difficulty": "hard"},
            {"topic": "caching", "question": "What caching strategies would you use for a high-read API?", "difficulty": "medium"},
            {"topic": "authentication", "question": "Compare JWT vs session-based auth. What are the tradeoffs?", "difficulty": "medium"},
        ])
    elif "data" in role_lower or "ml" in role_lower:
        questions.extend([
            {"topic": "machine learning", "question": "Explain bias-variance tradeoff. How do you detect overfitting?", "difficulty": "medium"},
            {"topic": "sql", "question": "Write a query to find the second highest salary per department.", "difficulty": "medium"},
            {"topic": "statistics", "question": "When would you use a t-test vs a chi-square test?", "difficulty": "medium"},
            {"topic": "model evaluation", "question": "How do you evaluate an imbalanced classification model?", "difficulty": "medium"},
            {"topic": "mlops", "question": "Describe your approach to model versioning and deployment.", "difficulty": "hard"},
        ])
    elif "devops" in role_lower or "cloud" in role_lower or "sre" in role_lower:
        questions.extend([
            {"topic": "kubernetes", "question": "Explain the difference between a Deployment and a StatefulSet.", "difficulty": "medium"},
            {"topic": "terraform", "question": "How do you manage secrets in Terraform?", "difficulty": "medium"},
            {"topic": "monitoring", "question": "Design an alerting strategy for a microservices architecture.", "difficulty": "hard"},
            {"topic": "ci/cd", "question": "How would you implement zero-downtime deployments?", "difficulty": "medium"},
            {"topic": "linux", "question": "How do you debug a high CPU usage issue on a production server?", "difficulty": "medium"},
        ])
    else:
        questions.extend([
            {"topic": "data structures", "question": "Implement a LRU cache. What is the time complexity?", "difficulty": "medium"},
            {"topic": "algorithms", "question": "Find the longest substring without repeating characters.", "difficulty": "medium"},
            {"topic": "system design", "question": "Design a rate limiter for an API.", "difficulty": "hard"},
            {"topic": "database", "question": "Explain ACID properties. How does a database ensure them?", "difficulty": "medium"},
            {"topic": "concurrency", "question": "What is a race condition? How do you prevent it?", "difficulty": "medium"},
        ])

    for q in questions:
        q["topic"] = q["topic"].lower()

    weak_skill_questions = []
    for skill in weak_skills[:3]:
        weak_skill_questions.append({
            "topic": skill,
            "question": f"Explain your experience with {skill}. Walk me through a project where you used it.",
            "difficulty": "medium",
            "targeted_gap": True,
        })

    return weak_skill_questions + questions


def _get_behavioral_questions(role: str, experience_years: int) -> List[Dict[str, Any]]:
    return [
        {"topic": "teamwork", "question": "Tell me about a time you had a disagreement with a teammate. How did you resolve it?", "difficulty": "easy"},
        {"topic": "problem solving", "question": "Describe a complex problem you solved. What was your approach?", "difficulty": "medium"},
        {"topic": "leadership", "question": "Have you ever mentored someone? How did you help them grow?", "difficulty": "medium"},
        {"topic": "adaptability", "question": "Tell me about a time you had to learn a new technology quickly.", "difficulty": "easy"},
        {"topic": "communication", "question": "How do you explain technical concepts to non-technical stakeholders?", "difficulty": "medium"},
        {"topic": "ownership", "question": "Describe a project you owned end-to-end. What challenges did you face?", "difficulty": "medium"},
    ]


def _get_hr_questions(role: str) -> List[Dict[str, Any]]:
    return [
        {"topic": "motivation", "question": "Why are you interested in this role and our company?", "difficulty": "easy"},
        {"topic": "career goals", "question": "Where do you see yourself in 3-5 years?", "difficulty": "easy"},
        {"topic": "salary", "question": "What are your salary expectations?", "difficulty": "easy"},
        {"topic": "availability", "question": "When can you start? Do you have a notice period?", "difficulty": "easy"},
        {"topic": "culture fit", "question": "What type of work environment do you thrive in?", "difficulty": "easy"},
    ]


def _get_communication_questions() -> List[Dict[str, Any]]:
    return [
        {"topic": "clarity", "question": "Explain a complex technical concept to a 10-year-old.", "difficulty": "medium"},
        {"topic": "structure", "question": "Walk me through your approach to solving a problem, step by step.", "difficulty": "medium"},
        {"topic": "presentation", "question": "Describe a project you're proud of in 2 minutes.", "difficulty": "easy"},
        {"topic": "active listening", "question": "How do you ensure you understand requirements before starting?", "difficulty": "easy"},
    ]