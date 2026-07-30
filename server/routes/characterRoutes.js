const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { asyncHandler } = require('../middlewares/errorHandler');
const upload = require('../middlewares/uploadMiddleware');

// Routes
router.get('/mindate', asyncHandler((req, res) => characterController.getMinDate(req, res)));
router.get('/maxdate', asyncHandler((req, res) => characterController.getMaxDate(req, res)));

router.get('/dashboard', asyncHandler((req, res) => characterController.getDashboard(req, res)));
router.post('/dashboard', asyncHandler((req, res) => characterController.getDashboardByDate(req, res)));

router.get('/pending', asyncHandler((req, res) => characterController.getPending(req, res)));
router.get('/details', asyncHandler((req, res) => characterController.getDetails(req, res)));
router.get('/remain', asyncHandler((req, res) => characterController.getRemain(req, res)));

router.post('/upload', upload.single('excel_file'), asyncHandler((req, res) => characterController.uploadFile(req, res)));

module.exports = router;
