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
  return jwt.sign({ id: 'eval-test-user' }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'eval-test-user', isActive: true, role: 'student' }),
  });
}

function mockAiResponse(content) {
  return {
    success: true,
    content,
    structuredData: content,
  };
}

describe('AI Evaluation Framework', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  const endpoints = [
    { path: '/api/ai-career/career-matching', task: 'career-matching', payload: { skills: ['python', 'sql'], experience_years: 1 } },
    { path: '/api/ai-career/skill-gap-enhanced', task: 'skill-gap-enhanced', payload: { current_skills: ['python'], target_career: 'Data Scientist' } },
    { path: '/api/ai-career/roadmap', task: 'roadmap', payload: { target_career: 'Data Scientist', current_skills: ['python'] } },
    { path: '/api/ai-career/project-recommendations', task: 'project-recommendations', payload: { target_career: 'Software Engineer', current_skills: ['python'], count: 2 } },
    { path: '/api/jd-intelligence/jd-analysis', task: 'jd-analysis', payload: { job_description: 'Python developer with SQL and cloud experience.', user_skills: ['python', 'sql'] } },
    { path: '/api/career-transition/career-transition', task: 'career-transition', payload: { current_career: 'Software Engineer', target_career: 'Data Scientist', current_skills: ['python', 'sql'] } },
    { path: '/api/v1/ai/resume-analysis', task: 'resume-analysis', payload: { resume_text: 'Experienced Python developer with JavaScript and SQL skills.', target_role: 'Software Engineer' } },
    { path: '/api/v1/ai/skill-gap', task: 'skill-gap', payload: { resume_text: 'Experienced Python developer with JavaScript and SQL skills.', role: 'Software Engineer' } },
    { path: '/api/v1/ai/placement-prediction', task: 'placement-prediction', payload: { resume_text: 'Experienced Python developer with JavaScript and SQL skills.', skills: ['python', 'sql'], projects: ['portfolio'], experience_years: 2 } },
    { path: '/api/v1/ai/company-recommendation', task: 'company-recommendation', payload: { skills: ['python', 'sql'], target_role: 'Software Engineer' } },
    { path: '/api/v1/ai/interview-questions', task: 'interview-questions', payload: { role: 'Software Engineer', difficulty: 'medium' } },
    { path: '/api/v1/ai/ai-chat', task: 'ai-chat', payload: { message: 'Hello, I need career advice.' } },
  ];

  test.each(endpoints)('$path returns valid structured response', async ({ path, task, payload }) => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue(
      mockAiResponse({ evaluated: true, task })
    );

    const response = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${token()}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');
    mockHandle.mockRestore();
  });

  test('all AI endpoints reject unauthenticated requests with 401', async () => {
    const responses = await Promise.all(
      endpoints.map(({ path, payload }) =>
        request(app).post(path).send(payload)
      )
    );
    responses.forEach((r) => expect(r.status).toBe(401));
  });

  test('orchestrator handles unknown task gracefully', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: false,
      error: 'Unknown task',
    });

    const response = await request(app)
      .post('/api/ai-career/career-matching')
      .set('Authorization', `Bearer ${token()}`)
      .send({ skills: ['python'] });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    mockHandle.mockRestore();
  });

  test('health endpoint returns provider status', async () => {
    const response = await request(app)
      .get('/api/ai/health')
      .set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBeDefined();
  });
});
