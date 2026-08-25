const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const jwt = require('jsonwebtoken');

const {
  Dashboard,
  combinedDashbaord,
  PendingDurationSummary,
  uploadFile,
  characterList,
  employeeList,
  tenantList,
  domesticList,
  complaintList,
  postmortemList,
  login,  
  loginsession,
  updateStatus,
  queueStream,
  queueStatus,
} = require('../controllers/characterController');

const authMiddleware = require("../auth/authMiddleware");

/**
 * SSE auth middleware
 * EventSource cannot send custom headers, so the JWT is passed as ?token=…
 */
const sseAuthMiddleware = (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      res.status(401).end('Unauthorized');
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_err) {
    res.status(401).end('Invalid or expired token');
  }
};

const router = express.Router();

router.get('/dashboard', authMiddleware,Dashboard);
router.get('/combinedDashbaord', authMiddleware, combinedDashbaord);
router.get('/PendingDurationSummary', authMiddleware,PendingDurationSummary);
router.get('/characterList', authMiddleware, characterList);
router.get('/employeeList', authMiddleware, employeeList);
router.get('/tenantList', authMiddleware, tenantList);
router.get('/domesticList', authMiddleware, domesticList);
router.get('/complaintList', authMiddleware, complaintList);
router.get('/postmortemList', authMiddleware, postmortemList);
router.post('/upload', upload.single('excel_file'), uploadFile);
router.post('/login',login);
router.get('/login',loginsession);
router.get('/updateStatus', authMiddleware,updateStatus);

// ── Real-time queue routes ────────────────────────────────────────────────────
// SSE stream: browser connects here and receives push events for queue changes.
// Auth via ?token= query param (EventSource cannot send headers).
router.get('/queueStream', sseAuthMiddleware, queueStream);

// Snapshot: returns all currently PENDING / PROCESSING rows for initial load.
router.get('/queueStatus', authMiddleware, queueStatus);
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;

