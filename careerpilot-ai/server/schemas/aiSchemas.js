const { z } = require('zod');

const boundedText = (min, max) => z.string().min(min).max(max);
const text = boundedText(1, 200);
const resumeText = boundedText(20, 50000);
const list = z.array(text).max(100);
const strict = (schema) => schema.strict();

const skillEvidence = z.object({
  skill: text,
  proficiency: z.enum(['unknown', 'beginner', 'intermediate', 'advanced', 'expert']),
  evidence_count: z.number().int().min(0).max(50).default(0),
});

const simulatedImprovement = z.object({
  type: z.enum(['skill_improvement', 'project_completion', 'certification', 'evidence_addition', 'target_change']),
  skill: text.optional(),
  new_proficiency: z.enum(['unknown', 'beginner', 'intermediate', 'advanced', 'expert']).optional(),
  evidence_count: z.number().int().min(0).max(50).optional(),
  skills: z.array(text).optional(),
  proficiency: z.enum(['unknown', 'beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

module.exports = {
  'resume-analysis': strict(z.object({
    resume_text: resumeText,
    target_role: text.optional(),
  })),
  'skill-gap': strict(z.object({
    resume_text: resumeText,
    role: text,
  })),
  'placement-prediction': strict(z.object({
    resume_text: resumeText,
    skills: list,
    projects: list.default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
  })),
  'company-recommendation': strict(z.object({
    skills: list,
    target_role: text,
    location: text.optional(),
  })),
  'interview-questions': strict(z.object({
    role: text,
    experience_level: text.default('mid'),
    difficulty: text.default('medium'),
  })),
  'career-matching': strict(z.object({
    skills: list,
    interests: list.default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
    target_domains: list.default([]),
  })),
  'career-match-v2': strict(z.object({
    target_career: text,
    current_skills: list.default([]),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
    experience_years: z.number().int().min(0).max(60).nullable().optional(),
    projects_count: z.number().int().min(0).max(20).nullable().optional(),
  })),
  'skill-gap-enhanced': strict(z.object({
    current_skills: list,
    target_career: text,
    experience_years: z.number().int().min(0).max(60).default(0),
  })),
  'skill-gap-advanced': strict(z.object({
    target_career: text,
    current_skills: list.default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
  })),
  'roadmap': strict(z.object({
    target_career: text,
    current_skills: list,
    available_hours_per_week: z.number().int().min(1).max(80).default(10),
    duration_months: z.number().int().min(1).max(60).default(6),
    learning_preference: text.default('mixed'),
  })),
  'project-recommendations': strict(z.object({
    target_career: text,
    current_skills: list,
    difficulty: text.default('intermediate'),
    count: z.number().int().min(1).max(10).default(3),
  })),
  'ai-chat': strict(z.object({
    message: boundedText(1, 2000),
    context: z.record(z.any()).default({}),
  })),
  'jd-analysis': strict(z.object({
    job_description: resumeText,
    user_skills: list,
  })),
  'career-transition': strict(z.object({
    current_career: text,
    target_career: text,
    current_skills: list,
    experience_years: z.number().int().min(0).max(60).default(0),
  })),
  'resume-intelligence': strict(z.object({
    resume_text: resumeText,
    target_role: text.optional(),
  })),
  'jd-intelligence': strict(z.object({
    job_description: resumeText,
    user_skills: list,
  })),
  'career-path-explorer': strict(z.object({
    current_skills: list.default([]),
    target_domains: list.default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
  })),
  'career-path-details': strict(z.object({
    path_id: text,
    current_skills: list.default([]),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
  })),
  'what-if-simulation': strict(z.object({
    target_career: text,
    current_skills: list.default([]),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
    simulated_improvements: z.array(simulatedImprovement).max(20).default([]),
    experience_years: z.number().int().min(0).max(60).nullable().optional(),
    projects_count: z.number().int().min(0).max(20).nullable().optional(),
  })),
  'interview-intelligence': strict(z.object({
    target_role: text,
    current_skills: list.default([]),
    skill_evidence: z.array(skillEvidence).max(100).default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
    interview_type: text.default('technical'),
    completed_sessions: z.array(z.record(z.any())).max(50).default([]),
  })),
};