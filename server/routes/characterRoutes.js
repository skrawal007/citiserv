const express = require('express');
const upload = require('../middlewares/uploadMiddleware');


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
  updateStatus
} = require('../controllers/characterController');

const authMiddleware = require("../auth/authMiddleware");

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

module.exports = router;
