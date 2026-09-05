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
  return jwt.sign({ id: 'jd-test-user' }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'jd-test-user', isActive: true, role: 'student' }),
  });
}

describe('JD intelligence AI endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test('jd-analysis returns match score and fit', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        match_score: 85,
        fit: 'high',
        required_keywords: ['python', 'sql'],
        preferred_keywords: ['docker', 'cloud'],
        matched_skills: ['python', 'sql'],
        missing_keywords: [],
        recommendation: 'Strong alignment. Highlight matched skills in your application.',
      },
      structuredData: {
        match_score: 85,
        fit: 'high',
      },
    });

    const response = await request(app)
      .post('/api/jd-intelligence/jd-analysis')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        job_description: 'We are looking for a Python developer with SQL and cloud experience.',
        user_skills: ['python', 'sql', 'docker'],
      });

    expect(response.status).toBe(200);
    expect(response.body.match_score).toBeGreaterThanOrEqual(0);
    expect(response.body.match_score).toBeLessThanOrEqual(100);
    expect(response.body.fit).toBeDefined();
    mockHandle.mockRestore();
  });

  test('unauthenticated jd-analysis requests are rejected', async () => {
    const response = await request(app)
      .post('/api/jd-intelligence/jd-analysis')
      .send({
        job_description: 'We are looking for a Python developer.',
        user_skills: ['python'],
      });

    expect(response.status).toBe(401);
  });
});

describe('career transition AI endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test('career-transition returns feasibility and skills', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        transition_feasibility: 'medium',
        estimated_transition_time: '6-12 months',
        transferable_skills: ['python', 'sql'],
        new_skills_required: ['statistics', 'machine learning'],
        recommended_steps: ['Assess your current proficiency.', 'Build projects.'],
      },
      structuredData: {
        transition_feasibility: 'medium',
        transferable_skills: ['python', 'sql'],
      },
    });

    const response = await request(app)
      .post('/api/career-transition/career-transition')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        current_career: 'Software Engineer',
        target_career: 'Data Scientist',
        current_skills: ['python', 'sql', 'javascript'],
        experience_years: 3,
      });

    expect(response.status).toBe(200);
    expect(response.body.transition_feasibility).toBeDefined();
    expect(response.body.transferable_skills).toBeDefined();
    expect(Array.isArray(response.body.transferable_skills)).toBe(true);
    mockHandle.mockRestore();
  });

  test('unauthenticated career-transition requests are rejected', async () => {
    const response = await request(app)
      .post('/api/career-transition/career-transition')
      .send({
        current_career: 'Software Engineer',
        target_career: 'Data Scientist',
        current_skills: ['python'],
      });

    expect(response.status).toBe(401);
  });
});
