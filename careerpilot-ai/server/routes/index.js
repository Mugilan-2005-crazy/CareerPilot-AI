const express = require('express');
const authRoutes = require('./authRoutes');
const aiRoutes = require('./aiRoutes');
const v1Routes = require('./v1');
const companyRoutes = require('./companyRoutes');
const companyAptitudeTrainingRoutes = require('./companyAptitudeTrainingRoutes');
const createResourceRoutes = require('./resourceRoutes');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Company = require('../models/Company');
const Resume = require('../models/Resume');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const TechnicalQuestion = require('../models/TechnicalQuestion');
const CommunicationQuestion = require('../models/CommunicationQuestion');
const CodingQuestion = require('../models/CodingQuestion');
const MockInterview = require('../models/MockInterview');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const SkillGapReport = require('../models/SkillGapReport');
const PlacementPrediction = require('../models/PlacementPrediction');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const AdminLog = require('../models/AdminLog');

const createResourceController = require('../controllers/resourceController');

const router = express.Router();

/**
 * API VERSIONING STRATEGY
 * 
 * Canonical endpoints: /api/v1/* (with security hardening)
 * - /api/v1/auth/* - Authentication endpoints
 * - /api/v1/ai/* - AI endpoints (AUTHENTICATED with JWT)
 * 
 * Legacy compatibility: /api/* (maintained for backward compatibility)
 * - /api/auth/* - Legacy auth endpoints
 * - /api/ai/* - Legacy AI endpoints (auth enforced via authMiddleware, same
 *               security boundary as /api/v1/ai/*)
 * - Other resources continue at /api/*
 * 
 * Migration: Clients should transition to /api/v1/ai/* with Bearer tokens
 */

// API v1 - Versioned endpoints with security hardening
router.use('/v1', v1Routes);

// Legacy endpoints (backward compatibility - will be deprecated in Phase 12)
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/companies', companyRoutes);
router.use('/company-aptitude-training', companyAptitudeTrainingRoutes);

router.use('/users', createResourceRoutes(User, createResourceController(User, { searchFields: ['name', 'email'], ownerField: 'id', ownedByCurrentUser: false, defaultFilters: { isActive: true } }), { readRoles: ['admin'], writeRoles: ['admin'] }));
router.use('/profiles', createResourceRoutes(Profile, createResourceController(Profile, { searchFields: ['fullName', 'headline', 'skills'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/companies', createResourceRoutes(Company, createResourceController(Company, { searchFields: ['name', 'industry', 'description'] }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/resumes', createResourceRoutes(Resume, createResourceController(Resume, { searchFields: ['title', 'filename'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/aptitude-questions', createResourceRoutes(AptitudeQuestion, createResourceController(AptitudeQuestion, { searchFields: ['question', 'topic', 'tags'] }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/technical-questions', createResourceRoutes(TechnicalQuestion, createResourceController(TechnicalQuestion, { searchFields: ['title', 'topic', 'tags'] }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/communication-questions', createResourceRoutes(CommunicationQuestion, createResourceController(CommunicationQuestion, { searchFields: ['prompt', 'topic', 'tags'] }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/coding-questions', createResourceRoutes(CodingQuestion, createResourceController(CodingQuestion, { searchFields: ['title', 'topic', 'tags'] }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/mock-interviews', createResourceRoutes(MockInterview, createResourceController(MockInterview, { searchFields: ['feedback', 'role'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/resume-analyses', createResourceRoutes(ResumeAnalysis, createResourceController(ResumeAnalysis, { searchFields: ['summary', 'keywords'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/skill-gap-reports', createResourceRoutes(SkillGapReport, createResourceController(SkillGapReport, { searchFields: ['role', 'summary', 'missingSkills'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/placement-predictions', createResourceRoutes(PlacementPrediction, createResourceController(PlacementPrediction, { searchFields: ['notes', 'factors'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/progress', createResourceRoutes(Progress, createResourceController(Progress, { searchFields: ['module', 'milestone'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['student', 'admin'] }));
router.use('/notifications', createResourceRoutes(Notification, createResourceController(Notification, { searchFields: ['title', 'message'], ownerField: 'user' }), { readRoles: ['student', 'admin'], writeRoles: ['admin'] }));
router.use('/admin-logs', createResourceRoutes(AdminLog, createResourceController(AdminLog, { searchFields: ['action', 'details'], ownerField: 'admin' }), { readRoles: ['admin'], writeRoles: ['admin'] }));

module.exports = router;
