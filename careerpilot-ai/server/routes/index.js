const express = require('express');
const authRoutes = require('./authRoutes');
const aiRoutes = require('./aiRoutes');
const companyRoutes = require('./companyRoutes');

// generic route factories
const genericRoutesFactory = require('./genericRoutes');

const Profile = require('../models/Profile');
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

const genericController = require('../controllers/genericController');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/companies', companyRoutes);

// mount generic CRUD routes
router.use('/profiles', genericRoutesFactory(Profile, genericController(Profile)));
router.use('/aptitude-questions', genericRoutesFactory(AptitudeQuestion, genericController(AptitudeQuestion)));
router.use('/technical-questions', genericRoutesFactory(TechnicalQuestion, genericController(TechnicalQuestion)));
router.use('/communication-questions', genericRoutesFactory(CommunicationQuestion, genericController(CommunicationQuestion)));
router.use('/coding-questions', genericRoutesFactory(CodingQuestion, genericController(CodingQuestion)));
router.use('/mock-interviews', genericRoutesFactory(MockInterview, genericController(MockInterview)));
router.use('/resume-analyses', genericRoutesFactory(ResumeAnalysis, genericController(ResumeAnalysis)));
router.use('/skill-gap-reports', genericRoutesFactory(SkillGapReport, genericController(SkillGapReport)));
router.use('/placement-predictions', genericRoutesFactory(PlacementPrediction, genericController(PlacementPrediction)));
router.use('/progress', genericRoutesFactory(Progress, genericController(Progress)));
router.use('/notifications', genericRoutesFactory(Notification, genericController(Notification)));
router.use('/admin-logs', genericRoutesFactory(AdminLog, genericController(AdminLog)));

module.exports = router;
