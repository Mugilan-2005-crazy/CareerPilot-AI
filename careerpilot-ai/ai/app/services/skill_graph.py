from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field

SKILL_GRAPH = {
    "python": {
        "children": {
            "data analysis": {"children": {"pandas": {}, "numpy": {}, "visualization": {}}},
            "machine learning": {"children": {"scikit-learn": {}, "feature engineering": {}, "model evaluation": {}}},
            "backend": {"children": {"fastapi": {}, "apis": {}}},
        }
    },
    "javascript": {
        "children": {
            "frontend": {"children": {"react": {}, "vue": {}, "angular": {}}},
            "backend": {"children": {"node.js": {}, "express": {}}},
        }
    },
    "sql": {
        "children": {
            "data analysis": {},
            "data engineering": {},
            "backend": {},
        }
    },
    "cloud": {
        "children": {
            "aws": {},
            "azure": {},
            "gcp": {},
        }
    },
    "docker": {
        "children": {
            "kubernetes": {},
            "devops": {},
        }
    },
    "machine learning": {
        "children": {
            "deep learning": {"children": {"pytorch": {}, "tensorflow": {}}},
            "nlp": {},
            "computer vision": {},
        }
    },
    "deep learning": {
        "children": {
            "llm engineering": {},
            "rag engineering": {},
            "ai agents": {},
        }
    },
    "data engineering": {
        "children": {
            "big data": {"children": {"spark": {}, "kafka": {}}},
            "data warehousing": {},
        }
    },
    "cybersecurity": {
        "children": {
            "security fundamentals": {},
            "incident response": {},
            "forensics": {},
        }
    },
    "linux": {
        "children": {
            "networking": {},
            "security fundamentals": {},
            "devops": {},
        }
    },
}


def _normalize(skill: str) -> str:
    return skill.strip().lower()


def _find_node(graph: Dict[str, Any], skill: str) -> Optional[Dict[str, Any]]:
    skill = _normalize(skill)
    for key, value in graph.items():
        if _normalize(key) == skill:
            return value
        if "children" in value:
            found = _find_node(value["children"], skill)
            if found is not None:
                return found
    return None


def _path_to_node(graph: Dict[str, Any], target: str, path: List[str] = None) -> Optional[List[str]]:
    if path is None:
        path = []
    target = _normalize(target)
    for key, value in graph.items():
        current_path = path + [key]
        if _normalize(key) == target:
            return current_path
        if "children" in value:
            found = _path_to_node(value["children"], target, current_path)
            if found is not None:
                return found
    return None


def get_prerequisites(skill: str) -> List[str]:
    skill = _normalize(skill)
    path = _path_to_node(SKILL_GRAPH, skill)
    if path and len(path) > 1:
        return [p for p in path[:-1]]
    return []


def get_dependents(skill: str) -> List[str]:
    skill = _normalize(skill)
    result = []

    def _collect(node_graph: Dict[str, Any], target: str):
        for key, value in node_graph.items():
            if _normalize(key) == target and "children" in value:
                result.extend(value["children"].keys())
                return True
            if "children" in value:
                if _collect(value["children"], target):
                    return True
        return False

    _collect(SKILL_GRAPH, skill)
    return list(dict.fromkeys(result))


def get_related_skills(skill: str) -> List[str]:
    skill = _normalize(skill)
    prereqs = set(get_prerequisites(skill))
    dependents = set(get_dependents(skill))
    return list((prereqs | dependents))[:20]


def get_skill_depth(skill: str) -> int:
    skill = _normalize(skill)
    path = _path_to_node(SKILL_GRAPH, skill)
    return len(path) if path else 0


def get_learning_order(skills: List[str]) -> List[str]:
    skills = [_normalize(s) for s in skills]
    visited: Set[str] = set()
    ordered: List[str] = []

    def _order(skill: str):
        skill = _normalize(skill)
        if skill in visited:
            return
        visited.add(skill)
        prereqs = get_prerequisites(skill)
        for prereq in prereqs:
            if prereq in skills:
                _order(prereq)
        if skill in skills:
            ordered.append(skill)

    for s in skills:
        _order(s)

    return ordered


def analyze_skill_coverage(user_skills: List[str], target_skills: List[str]) -> Dict[str, Any]:
    user_set = {_normalize(s) for s in user_skills}
    target_set = {_normalize(s) for s in target_skills}
    covered = list(user_set & target_set)
    missing = list(target_set - user_set)
    coverage_pct = round((len(covered) / len(target_set)) * 100, 1) if target_set else 0.0
    return {
        "target_skills": list(target_set),
        "covered": covered,
        "missing": missing,
        "coverage_percentage": coverage_pct,
    }


def suggest_next_skills(current_skills: List[str], target_domain: str = "") -> List[Dict[str, Any]]:
    current_set = {_normalize(s) for s in current_skills}
    suggestions = []

    for skill, value in SKILL_GRAPH.items():
        skill_norm = _normalize(skill)
        if skill_norm in current_set:
            continue
        prereqs = get_prerequisites(skill)
        if all(_normalize(p) in current_set for p in prereqs):
            suggestions.append({
                "skill": skill,
                "reason": "Prerequisites met",
                "prerequisites": prereqs,
                "depth": get_skill_depth(skill),
            })

    suggestions.sort(key=lambda x: x["depth"])
    return suggestions[:10]


def build_skill_graph_subset(skills: List[str], depth: int = 2) -> Dict[str, Any]:
    skills = [_normalize(s) for s in skills]
    result = {}

    for skill in skills:
        path = _path_to_node(SKILL_GRAPH, skill)
        if not path:
            continue
        for i, node in enumerate(path):
            if i > depth:
                break
            current = result
            for p in path[:i + 1]:
                if p not in current:
                    current[p] = {"children": {}}
                current = current[p]["children"]

    return result
