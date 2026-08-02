const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msexcel',
    'application/x-msexcel',
    'application/x-ms-excel',
    'application/x-excel',
    'application/x-dos_ms_excel',
    'application/xls',
    'application/x-xls',
    'application/octet-stream',
  ];

  const hasValidExt = Boolean(file.originalname && file.originalname.match(/\.(xlsx|xls)$/i));
  const hasValidMime = allowedMimeTypes.includes(file.mimetype);

  if (hasValidExt || hasValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel spreadsheets (.xlsx, .xls) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter,
});

module.exports = upload;

