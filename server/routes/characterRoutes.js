const express = require('express');
const upload = require('../middlewares/uploadMiddleware');


const {
  getMinDate,
  getMaxDate,
  Dashboard,
  combinedDashbaord,
  getDashboardByDate,
  getPending,
  getDetails,
  getRemain,
  uploadFile,
  characterList,
  employeeList,
  tenantList,
  domesticList,
  login,  
  loginsession
} = require('../controllers/characterController');

const authMiddleware = require("../auth/authMiddleware");

const router = express.Router();

router.get('/mindate', getMinDate);
router.get('/maxdate', getMaxDate);
router.get('/dashboard', authMiddleware,Dashboard);
router.get('/combinedDashbaord', authMiddleware, combinedDashbaord);
router.post('/dashboard', authMiddleware,getDashboardByDate);
router.get('/pending', authMiddleware, getPending);
router.get('/characterList', authMiddleware, characterList);
router.get('/employeeList', authMiddleware, employeeList);
router.get('/tenantList', authMiddleware, tenantList);
router.get('/domesticList', authMiddleware, domesticList);
router.get('/details', getDetails);
router.get('/remain', getRemain);
router.post('/upload', upload.single('excel_file'), uploadFile);
router.post('/login',login);
router.get('/login',loginsession);

module.exports = router;
