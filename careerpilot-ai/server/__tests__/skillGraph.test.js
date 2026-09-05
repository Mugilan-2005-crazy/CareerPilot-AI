const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../controllers/ai/skillGraphController', () => ({
  getSkillPrerequisites: jest.fn(),
  getSkillDependents: jest.fn(),
  getRelatedSkills: jest.fn(),
  getSkillDepth: jest.fn(),
  postLearningOrder: jest.fn(),
  postSkillCoverage: jest.fn(),
  postSuggestNextSkills: jest.fn(),
  postSkillGraphSubset: jest.fn(),
}));

const User = require('../models/User');
const skillGraphController = require('../controllers/ai/skillGraphController');
const app = require('../app');
const { JWT_SECRET } = require('../config/environment');

function token() {
  return jwt.sign({ id: 'skillgraph-test-user' }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'skillgraph-test-user', isActive: true, role: 'student' }),
  });
}

describe('skill graph AI endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test('prerequisites returns list for known skill', async () => {
    skillGraphController.getSkillPrerequisites.mockImplementation((req, res) => {
      res.json({ skill: req.params.skill, prerequisites: ['programming', 'algorithms'] });
    });

    const resp = await request(app)
      .get('/api/skill-graph/prerequisites/python')
      .set('Authorization', `Bearer ${token()}`);

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.prerequisites)).toBe(true);
  });

  test('dependents returns list for known skill', async () => {
    skillGraphController.getSkillDependents.mockImplementation((req, res) => {
      res.json({ skill: req.params.skill, dependents: ['react', 'vue'] });
    });

    const resp = await request(app)
      .get('/api/skill-graph/dependents/javascript')
      .set('Authorization', `Bearer ${token()}`);

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.dependents)).toBe(true);
  });

  test('related returns list for known skill', async () => {
    skillGraphController.getRelatedSkills.mockImplementation((req, res) => {
      res.json({ skill: req.params.skill, related: ['python', 'django'] });
    });

    const resp = await request(app)
      .get('/api/skill-graph/related/python')
      .set('Authorization', `Bearer ${token()}`);

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.related)).toBe(true);
  });

  test('depth returns positive integer for known skill', async () => {
    skillGraphController.getSkillDepth.mockImplementation((req, res) => {
      res.json({ skill: req.params.skill, depth: 2 });
    });

    const resp = await request(app)
      .get('/api/skill-graph/depth/python')
      .set('Authorization', `Bearer ${token()}`);

    expect(resp.status).toBe(200);
    expect(typeof resp.body.depth).toBe('number');
    expect(resp.body.depth).toBeGreaterThan(0);
  });

  test('learning-order returns ordered skills', async () => {
    skillGraphController.postLearningOrder.mockImplementation((req, res) => {
      res.json({ skills: req.body.skills, ordered: ['machine learning', 'deep learning', 'pytorch'] });
    });

    const resp = await request(app)
      .post('/api/skill-graph/learning-order')
      .set('Authorization', `Bearer ${token()}`)
      .send({ skills: ['pytorch', 'deep learning', 'machine learning'] });

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.ordered)).toBe(true);
  });

  test('coverage returns percentage and missing skills', async () => {
    skillGraphController.postSkillCoverage.mockImplementation((req, res) => {
      res.json({
        user_skills: req.body.user_skills,
        target_skills: req.body.target_skills,
        coverage_percentage: 50.0,
        missing: ['machine learning', 'docker'],
      });
    });

    const resp = await request(app)
      .post('/api/skill-graph/coverage')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        user_skills: ['python', 'sql'],
        target_skills: ['python', 'sql', 'machine learning', 'docker'],
      });

    expect(resp.status).toBe(200);
    expect(resp.body.coverage_percentage).toBe(50.0);
    expect(Array.isArray(resp.body.missing)).toBe(true);
  });

  test('suggest-next returns suggestions', async () => {
    skillGraphController.postSuggestNextSkills.mockImplementation((req, res) => {
      res.json({ suggestions: [{ skill: 'machine learning', reason: 'Prerequisites met' }] });
    });

    const resp = await request(app)
      .post('/api/skill-graph/suggest-next')
      .set('Authorization', `Bearer ${token()}`)
      .send({ current_skills: ['python', 'sql'] });

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.suggestions)).toBe(true);
  });

  test('subset returns graph structure', async () => {
    skillGraphController.postSkillGraphSubset.mockImplementation((req, res) => {
      res.json({ graph: { python: { children: { 'data analysis': {} } } } });
    });

    const resp = await request(app)
      .post('/api/skill-graph/subset')
      .set('Authorization', `Bearer ${token()}`)
      .send({ skills: ['python', 'sql'], depth: 2 });

    expect(resp.status).toBe(200);
    expect(typeof resp.body.graph).toBe('object');
  });

  test('unauthenticated skill graph requests are rejected', async () => {
    const responses = await Promise.all([
      request(app).get('/api/skill-graph/prerequisites/python'),
      request(app).post('/api/skill-graph/learning-order').send({ skills: ['python'] }),
    ]);

    responses.forEach((r) => expect(r.status).toBe(401));
  });
});
