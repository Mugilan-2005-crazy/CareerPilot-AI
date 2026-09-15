const { z } = require('zod');

const PROFICIENCY = ['unknown', 'beginner', 'intermediate', 'advanced', 'expert'];
const PROVENANCE = ['user-provided', 'system-derived', 'ai-inferred', 'externally-verified'];

const evidence = z.object({
  source: z.enum(PROVENANCE),
  ref: z.string().max(300).optional(),
  weight: z.number().min(0).max(1).optional(),
});

const skillState = z.object({
  name: z.string().trim().min(1).max(100),
  proficiency: z.enum(PROFICIENCY).optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.array(evidence).max(20).optional(),
});

// Strict: unknown keys (including `role`, `user`, `derived`, `version`,
// `_id`) are rejected — mass-assignment protection at the schema layer.
const careerTwinUpdate = z
  .object({
    identity: z
      .object({
        fullName: z.string().trim().max(120).optional(),
        headline: z.string().trim().max(160).optional(),
        currentLevel: z
          .enum(['student', 'fresher', 'junior', 'mid', 'senior', 'career-transition'])
          .optional(),
      })
      .strict()
      .optional(),
    skills: z.array(skillState).max(200).optional(),
    targetRoles: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    preferences: z
      .object({
        availableHoursPerWeek: z.number().int().min(0).max(80).optional(),
        preferredLanguage: z.enum(['en', 'ta', 'tanglish', 'hi']).optional(),
        deadline: z.string().datetime().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

module.exports = { careerTwinUpdate, PROFICIENCY, PROVENANCE };
