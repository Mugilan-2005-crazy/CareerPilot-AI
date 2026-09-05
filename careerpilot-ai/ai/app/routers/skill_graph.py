from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from app.services.skill_graph import (
    get_prerequisites,
    get_dependents,
    get_related_skills,
    get_skill_depth,
    get_learning_order,
    analyze_skill_coverage,
    suggest_next_skills,
    build_skill_graph_subset,
)

router = APIRouter()


@router.get("/prerequisites/{skill}")
def prerequisites(skill: str):
    if not skill or not skill.strip():
        raise HTTPException(status_code=400, detail="Skill name is required")
    return {"skill": skill, "prerequisites": get_prerequisites(skill)}


@router.get("/dependents/{skill}")
def dependents(skill: str):
    if not skill or not skill.strip():
        raise HTTPException(status_code=400, detail="Skill name is required")
    return {"skill": skill, "dependents": get_dependents(skill)}


@router.get("/related/{skill}")
def related(skill: str):
    if not skill or not skill.strip():
        raise HTTPException(status_code=400, detail="Skill name is required")
    return {"skill": skill, "related": get_related_skills(skill)}


@router.get("/depth/{skill}")
def depth(skill: str):
    if not skill or not skill.strip():
        raise HTTPException(status_code=400, detail="Skill name is required")
    return {"skill": skill, "depth": get_skill_depth(skill)}


@router.post("/learning-order")
def learning_order(skills: List[str]):
    if not skills:
        raise HTTPException(status_code=400, detail="At least one skill is required")
    return {"skills": skills, "ordered": get_learning_order(skills)}


@router.post("/coverage")
def coverage(payload: Dict[str, Any]):
    user_skills = payload.get("user_skills", [])
    target_skills = payload.get("target_skills", [])
    if not user_skills or not target_skills:
        raise HTTPException(status_code=400, detail="user_skills and target_skills are required")
    return analyze_skill_coverage(user_skills, target_skills)


@router.post("/suggest-next")
def suggest_next(payload: Dict[str, Any]):
    current_skills = payload.get("current_skills", [])
    target_domain = payload.get("target_domain", "")
    return {"suggestions": suggest_next_skills(current_skills, target_domain)}


@router.post("/subset")
def subset(payload: Dict[str, Any]):
    skills = payload.get("skills", [])
    depth = payload.get("depth", 2)
    return {"graph": build_skill_graph_subset(skills, depth)}
