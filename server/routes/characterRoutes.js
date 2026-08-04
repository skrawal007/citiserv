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
} = require('../controllers/characterController');

const router = express.Router();

router.get('/mindate', getMinDate);
router.get('/maxdate', getMaxDate);
router.get('/dashboard', Dashboard);
router.post('/dashboard', getDashboardByDate);
router.get('/pending', getPending);
router.get('/characterList', characterList);
router.get('/details', getDetails);
router.get('/remain', getRemain);
router.post('/upload', upload.single('excel_file'), uploadFile);

module.exports = router;
