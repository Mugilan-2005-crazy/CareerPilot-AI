const { z } = require('zod');

const boundedText = (min, max) => z.string().min(min).max(max);
const text = boundedText(1, 200);
const resumeText = boundedText(20, 50000);
const list = z.array(text).max(100);
const strict = (schema) => schema.strict();

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
};