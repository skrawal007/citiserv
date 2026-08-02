const { pool } = require('../database/db');
const { processExcelBuffer } = require('../utils/excelParser');
const {
  PS_STATUSES,
  LIU_STATUSES,
  DCRB_STATUSES,
  DCP_STATUSES,
  makePlaceholders,
} = require('../constants/statusConstants');

// Dynamic helper to resolve ps source
const getPsSource = async () => {
  try {
    await pool.execute('SELECT 1 FROM `ps` LIMIT 1');
    return 'ps';
  } catch (e) {
    return "(SELECT DISTINCT `थाना`, NULL as CUG FROM `characters` WHERE `थाना` IS NOT NULL AND `थाना` <> '') ps";
  }
};

// Database Query Helpers
const fetchMinDate = async () => {
  const [rows] = await pool.execute('SELECT MIN(अनुरोध_दिनांक) as minDate FROM characters');
  return rows[0]?.minDate || null;
};

const fetchMaxDate = async () => {
  const [rows] = await pool.execute('SELECT MAX(अनुरोध_दिनांक) as maxDate FROM characters');
  return rows[0]?.maxDate || null;
};

const queryDashboardByDateRange = async (sdate, edate) => {
  const psSource = await getPsSource();
  const hasDates = Boolean(sdate && edate);
  const dateClause = hasDates ? 'WHERE अनुरोध_दिनांक BETWEEN ? AND ?' : '';
  const dateParams = hasDates ? [sdate, edate] : [];

  const query = `
  `;
  const [rows] = await pool.execute(query);
  return rows;
};

// ── Controller Handlers ────────────────────────────────────────────────────────

const getMinDate = async (req, res, next) => {
  try {
    const minDate = await fetchMinDate();
    res.json({ minDate });
  } catch (err) {
    next(err);
  }
};

const getMaxDate = async (req, res, next) => {
  try {
    const maxDate = await fetchMaxDate();
    res.json({ maxDate });
  } catch (err) {
    next(err);
  }
};

const Dashboard = async (req, res, next) => {
  console.log('Dashboard request received with query:', req.query);
  try {
    const data = await pool.execute(`
                                SELECT
                                    station_name,
                                    station_code,
                                    COUNT(*) AS request_count,
                                    
                                    SUM(current_status LIKE '%APPROVED%') AS approved_count,
                                    SUM(current_status LIKE '%REJECTED%') AS rejected_count,

                                    (
                                        COUNT(*)
                                        - SUM(current_status LIKE '%APPROVED%')
                                        - SUM(current_status LIKE '%REJECTED%')
                                    ) AS pending_count,
                                  SUM(current_status LIKE '%PS%')    AS pending_ps_count,
                                    SUM(current_status LIKE '%DCRB%')  AS pending_dcrb_count,
                                    SUM(current_status LIKE '%LIU%')   AS pending_liu_count,
                                    SUM(current_status LIKE '%DCP%')   AS pending_dcp_count
                                FROM characters
                                GROUP BY station_name, station_code
                                ORDER BY station_name`);
    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

const getDashboardByDate = async (req, res, next) => {
  try {
    const { sdate, edate } = req.body;
    if (!sdate || !edate) {
      return res.status(400).json({ error: 'sdate and edate are required' });
    }
    const data = await queryDashboardByDateRange(sdate, edate);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getPending = async (req, res, next) => {
  try {
    const { loc } = req.query;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }
    let query = '';
    let params = [];

    if (loc === 'totaldcp') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = DCP_STATUSES;
    } else if (loc === 'totalliu') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = LIU_STATUSES;
    } else if (loc === 'totalps') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = PS_STATUSES;
    } else if (loc === 'totaldcrb') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = DCRB_STATUSES;
    } else if (loc === 'totalremain') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत') ORDER BY थाना, अनुरोध_दिनांक`;
    } else if (loc === 'totaldiff') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत') AND वर्तमान_पता <> स्थायी_पता`;
    } else {
      return res.status(400).json({ error: 'Invalid loc parameter' });
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const { loc, ps, sdate, edate } = req.query;
    let query = '';
    let params = [];

    const dateFilter = sdate && edate ? ' AND अनुरोध_दिनांक BETWEEN ? AND ?' : '';
    const psParam = ps ? [ps] : [];
    const dateParam = sdate && edate ? [sdate, edate] : [];

    if (loc === 'dcp') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})`;
      params = [...psParam, ...dateParam, ...DCP_STATUSES];
    } else if (loc === 'liu') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})`;
      params = [...psParam, ...dateParam, ...LIU_STATUSES];
    } else if (loc === 'ps') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = [...psParam, ...dateParam, ...PS_STATUSES];
    } else if (loc === 'dcrb') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})`;
      params = [...psParam, ...dateParam, ...DCRB_STATUSES];
    } else if (loc === 'remain') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`;
      params = [...psParam, ...dateParam];
    } else if (loc === 'all') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter}`;
      params = [...psParam, ...dateParam];
    } else if (loc === 'totaldcp') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})`;
      params = [...dateParam, ...DCP_STATUSES];
    } else if (loc === 'totalliu') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})`;
      params = [...dateParam, ...LIU_STATUSES];
    } else if (loc === 'totaldcrb') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})`;
      params = [...dateParam, ...DCRB_STATUSES];
    } else if (loc === 'totalps') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = [...dateParam, ...PS_STATUSES];
    } else if (loc === 'totalremain') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`;
      params = [...dateParam];
    } else {
      return res.status(400).json({ error: 'Invalid loc parameter' });
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getRemain = async (req, res, next) => {
  try {
    const { ps, sdate, edate } = req.query;
    if (!ps || !sdate || !edate) {
      return res.status(400).json({ error: 'ps, sdate, edate are required' });
    }
    const [rows] = await pool.execute(
      `SELECT * FROM characters WHERE थाना = ? AND अनुरोध_दिनांक BETWEEN ? AND ? AND अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`,
      [ps, sdate, edate]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = req.file.originalname
      ? req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toUpperCase()
      : '';

    const parsedResult = await processExcelBuffer(req.file.buffer);

    res.json({
      message: `${parsedResult.totalRecords} records uploaded and saved successfully`,
      fileName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      totalRecords: parsedResult.totalRecords,
      addressCounts: parsedResult.addressCounts,
      differentAddressCount: parsedResult.differentAddressCount,
      differentAddressCountPRE: parsedResult.differentAddressCountPRE,
      differentAddressCountPER: parsedResult.differentAddressCountPER,
      data: parsedResult.jsonResult,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMinDate,
  getMaxDate,
  Dashboard,
  getDashboardByDate,
  getPending,
  getDetails,
  getRemain,
  uploadFile,
};
