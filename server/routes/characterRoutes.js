const express = require('express');
const upload = require('../middlewares/uploadMiddleware');


const {
  getMinDate,
  getMaxDate,
  Dashboard,
  getDashboardByDate,
  getPending,
  getDetails,
  getRemain,
  uploadFile,
  characterList,
  login,  
  loginsession
} = require('../controllers/characterController');

const authMiddleware = require("../auth/authMiddleware");

const router = express.Router();

router.get('/mindate', getMinDate);
router.get('/maxdate', getMaxDate);
router.get('/dashboard', authMiddleware,Dashboard);
router.post('/dashboard', authMiddleware,getDashboardByDate);
router.get('/pending', authMiddleware, getPending);
router.get('/characterList', authMiddleware, characterList);
router.get('/details', getDetails);
router.get('/remain', getRemain);
router.post('/upload', upload.single('excel_file'), uploadFile);
router.post('/login',login);
router.get('/login',loginsession);

module.exports = router;
