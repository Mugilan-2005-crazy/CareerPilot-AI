"""
What-If Career Simulation — Hypothetical scenario analysis (v1.1 P1).

Simulates the impact of hypothetical changes (skill improvements, project completion,
certification acquisition) on career readiness, skill gaps, and next-best-actions.
Never mutates the real Career Twin — all projections are explicitly labelled.
"""

from typing import List, Dict, Any, Optional
from copy import deepcopy

from app.services.career_intelligence import (
    CAREERS,
    _normalize_skill,
    _build_advanced_gaps,
    match_career_v2,
    LEVEL_SCORE,
)
from app.services.skill_graph import get_prerequisites, get_dependents


SIMULATION_TYPES = {
    "skill_improvement": "Improve proficiency in a skill",
    "project_completion": "Complete a project that demonstrates skills",
    "certification": "Obtain a certification",
    "evidence_addition": "Add evidence for a claimed skill",
    "target_change": "Change target career",
}


def _apply_simulation(
    current_skills: List[str],
    skill_evidence: Dict[str, Any],
    simulation: Dict[str, Any],
) -> tuple[List[str], Dict[str, Any]]:
    """Apply a single simulation and return modified skills and evidence."""
    new_skills = current_skills.copy()
    new_evidence = deepcopy(skill_evidence)
    sim_type = simulation.get("type", "")

    if sim_type == "skill_improvement":
        skill = _normalize_skill(simulation.get("skill", ""))
        new_proficiency = simulation.get("new_proficiency", "intermediate")
        new_evidence_count = simulation.get("evidence_count", 1)

        if skill not in new_skills:
            new_skills.append(skill)

        new_evidence[skill] = {
            "skill": skill,
            "proficiency": new_proficiency,
            "evidence_count": new_evidence_count,
        }

    elif sim_type == "project_completion":
        skills_demonstrated = [_normalize_skill(s) for s in simulation.get("skills", [])]
        evidence_count = simulation.get("evidence_count", 1)

        for skill in skills_demonstrated:
            if skill not in new_skills:
                new_skills.append(skill)

            existing_evidence = new_evidence.get(skill, {"skill": skill, "evidence_count": 0})
            new_evidence[skill] = {
                "skill": skill,
                "proficiency": existing_evidence.get("proficiency", "intermediate"),
                "evidence_count": existing_evidence.get("evidence_count", 0) + evidence_count,
            }

    elif sim_type == "certification":
        skill = _normalize_skill(simulation.get("skill", ""))
        if skill not in new_skills:
            new_skills.append(skill)

        new_evidence[skill] = {
            "skill": skill,
            "proficiency": simulation.get("proficiency", "advanced"),
            "evidence_count": simulation.get("evidence_count", 2),
        }

    elif sim_type == "evidence_addition":
        skill = _normalize_skill(simulation.get("skill", ""))
        evidence_count = simulation.get("evidence_count", 1)
        proficiency = simulation.get("proficiency", "intermediate")

        if skill not in new_skills:
            new_skills.append(skill)

        existing = new_evidence.get(skill, {"skill": skill, "evidence_count": 0, "proficiency": proficiency})
        new_evidence[skill] = {
            "skill": skill,
            "proficiency": proficiency,
            "evidence_count": existing.get("evidence_count", 0) + evidence_count,
        }

    return new_skills, new_evidence


def _compute_impact(
    baseline_gaps: Dict[str, Any],
    baseline_match: Dict[str, Any],
    simulated_gaps: Dict[str, Any],
    simulated_match: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute the impact of simulation."""
    baseline_readiness = baseline_gaps.get("heuristic_readiness_estimate", 0)
    simulated_readiness = simulated_gaps.get("heuristic_readiness_estimate", 0)

    baseline_alignment = baseline_match.get("overall_alignment", 0)
    simulated_alignment = simulated_match.get("overall_alignment", 0)

    critical_baseline = len(baseline_gaps.get("buckets", {}).get("critical", []))
    critical_simulated = len(simulated_gaps.get("buckets", {}).get("critical", []))

    return {
        "readiness_change": round(simulated_readiness - baseline_readiness, 1),
        "alignment_change": round(simulated_alignment - baseline_alignment, 1),
        "critical_gaps_change": critical_simulated - critical_baseline,
        "readiness_trend": "improving" if simulated_readiness > baseline_readiness else ("stable" if simulated_readiness == baseline_readiness else "declining"),
        "alignment_trend": "improving" if simulated_alignment > baseline_alignment else ("stable" if simulated_alignment == baseline_alignment else "declining"),
    }


def run_what_if_simulation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point: run what-if career simulation.
    """
    target_career = payload.get("target_career", "").strip().lower()
    current_skills = [_normalize_skill(s) for s in payload.get("current_skills", [])]
    skill_evidence = {
        _normalize_skill(e.get("skill", "")): e
        for e in payload.get("skill_evidence", [])
        if isinstance(e, dict) and e.get("skill")
    }
    simulations = payload.get("simulated_improvements", [])
    experience_years = payload.get("experience_years")
    projects_count = payload.get("projects_count")

    career = next((c for c in CAREERS if target_career in c["name"].lower() or target_career in c["id"]), None)
    if not career:
        return {
            "error": "Target career not found",
            "available_careers": [c["name"] for c in CAREERS],
            "source": "heuristic",
        }

    baseline_gaps = _build_advanced_gaps(career, current_skills, skill_evidence)
    baseline_match = match_career_v2({
        "target_career": career["name"],
        "current_skills": current_skills,
        "skill_evidence": [
            {"skill": k, "proficiency": v.get("proficiency", "unknown"), "evidence_count": v.get("evidence_count", 0)}
            for k, v in skill_evidence.items()
        ],
        "experience_years": experience_years,
        "projects_count": projects_count,
    })

    results = []
    for sim in simulations:
        new_skills, new_evidence = _apply_simulation(current_skills, skill_evidence, sim)

        simulated_gaps = _build_advanced_gaps(career, new_skills, new_evidence)
        simulated_match = match_career_v2({
            "target_career": career["name"],
            "current_skills": new_skills,
            "skill_evidence": [
                {"skill": k, "proficiency": v.get("proficiency", "unknown"), "evidence_count": v.get("evidence_count", 0)}
                for k, v in new_evidence.items()
            ],
            "experience_years": experience_years,
            "projects_count": projects_count,
        })

        impact = _compute_impact(baseline_gaps, baseline_match, simulated_gaps, simulated_match)

        results.append({
            "simulation": sim,
            "simulation_type": SIMULATION_TYPES.get(sim.get("type", ""), "Unknown"),
            "baseline_readiness": baseline_gaps["heuristic_readiness_estimate"],
            "simulated_readiness": simulated_gaps["heuristic_readiness_estimate"],
            "baseline_alignment": baseline_match.get("overall_alignment", 0),
            "simulated_alignment": simulated_match.get("overall_alignment", 0),
            "impact": impact,
            "new_critical_gaps": simulated_gaps["buckets"].get("critical", []),
            "resolved_critical_gaps": [
                g for g in baseline_gaps["buckets"].get("critical", [])
                if g not in simulated_gaps["buckets"].get("critical", [])
            ],
        })

    summary = {
        "best_impact": max(results, key=lambda r: r["impact"]["readiness_change"]) if results else None,
        "total_simulations": len(results),
        "overall_readiness_improvement": sum(r["impact"]["readiness_change"] for r in results),
        "overall_alignment_improvement": sum(r["impact"]["alignment_change"] for r in results),
    }

    return {
        "target_career": career["name"],
        "baseline": {
            "readiness": baseline_gaps["heuristic_readiness_estimate"],
            "alignment": baseline_match.get("overall_alignment", 0),
            "critical_gaps": baseline_gaps["buckets"].get("critical", []),
            "high_impact_gaps": baseline_gaps["buckets"].get("high_impact", []),
        },
        "simulations": results,
        "summary": summary,
        "disclaimer": "SIMULATION ONLY — Hypothetical projections based on heuristic models. Not a guarantee of outcomes.",
        "source": "heuristic",
    }