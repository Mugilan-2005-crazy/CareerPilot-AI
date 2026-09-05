const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const app = require('../app');
const orchestrator = require('../services/ai/orchestrator');
const { JWT_SECRET } = require('../config/environment');

function token() {
  return jwt.sign({ id: 'career-test-user' }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'career-test-user', isActive: true, role: 'student' }),
  });
}

describe('career intelligence AI endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test('career-matching returns top career and matches', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        top_career: { career: 'Software Engineer', match_score: 80, confidence: 'medium', strengths: ['python'], skill_gaps: ['javascript'], reasoning: 'test', alternative_careers: [] },
        all_matches: [{ career: 'Software Engineer', match_score: 80 }],
      },
      structuredData: {
        top_career: { career: 'Software Engineer', match_score: 80 },
        all_matches: [{ career: 'Software Engineer', match_score: 80 }],
      },
    });

    const response = await request(app)
      .post('/api/ai-career/career-matching')
      .set('Authorization', `Bearer ${token()}`)
      .send({ skills: ['python', 'sql'], experience_years: 1 });

    expect(response.status).toBe(200);
    expect(response.body.top_career).toBeDefined();
    expect(response.body.all_matches).toBeDefined();
    expect(response.body.top_career.match_score).toBeGreaterThanOrEqual(0);
    expect(response.body.top_career.match_score).toBeLessThanOrEqual(100);
    mockHandle.mockRestore();
  });

  test('skill-gap-enhanced returns detected and missing skills', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        target_career: 'Data Scientist',
        missing_skills: ['statistics'],
        recommended_projects: ['ML Image Classifier'],
      },
      structuredData: {
        target_career: 'Data Scientist',
        missing_skills: ['statistics'],
      },
    });

    const response = await request(app)
      .post('/api/ai-career/skill-gap-enhanced')
      .set('Authorization', `Bearer ${token()}`)
      .send({ current_skills: ['python'], target_career: 'Data Scientist' });

    expect(response.status).toBe(200);
    expect(response.body.target_career).toBeDefined();
    expect(response.body.missing_skills).toBeDefined();
    expect(Array.isArray(response.body.missing_skills)).toBe(true);
    mockHandle.mockRestore();
  });

  test('roadmap returns milestones', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        milestones: [{ title: 'Python', estimated_weeks: 2, completed: false, order: 1 }],
      },
      structuredData: {
        milestones: [{ title: 'Python', estimated_weeks: 2, completed: false, order: 1 }],
      },
    });

    const response = await request(app)
      .post('/api/ai-career/roadmap')
      .set('Authorization', `Bearer ${token()}`)
      .send({ target_career: 'Data Scientist', current_skills: ['python'] });

    expect(response.status).toBe(200);
    expect(response.body.milestones).toBeDefined();
    expect(Array.isArray(response.body.milestones)).toBe(true);
    mockHandle.mockRestore();
  });

  test('project-recommendations returns recommendations', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        recommendations: [{ title: 'Personal Portfolio', difficulty: 'beginner' }],
        count: 1,
      },
      structuredData: {
        recommendations: [{ title: 'Personal Portfolio', difficulty: 'beginner' }],
        count: 1,
      },
    });

    const response = await request(app)
      .post('/api/ai-career/project-recommendations')
      .set('Authorization', `Bearer ${token()}`)
      .send({ target_career: 'Software Engineer', current_skills: ['python'], count: 2 });

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toBeDefined();
    expect(response.body.count).toBeGreaterThanOrEqual(0);
    mockHandle.mockRestore();
  });

  test('unauthenticated career intelligence requests are rejected', async () => {
    const responses = await Promise.all([
      request(app).post('/api/ai-career/career-matching').send({ skills: ['python'] }),
      request(app).post('/api/ai-career/skill-gap-enhanced').send({ current_skills: ['python'], target_career: 'Data Scientist' }),
      request(app).post('/api/ai-career/roadmap').send({ target_career: 'Data Scientist', current_skills: ['python'] }),
      request(app).post('/api/ai-career/project-recommendations').send({ target_career: 'Software Engineer', current_skills: ['python'] }),
    ]);

    responses.forEach((r) => expect(r.status).toBe(401));
  });
});
