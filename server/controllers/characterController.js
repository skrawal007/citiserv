const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
const { processExcelBuffer } = require('../utils/excelParser');
const {
  PS_STATUSES,
  LIU_STATUSES,
  DCRB_STATUSES,
  DCP_STATUSES,
  makePlaceholders,
} = require('../constants/statusConstants');



const LIST_TABLES = new Set(['characters', 'employees', 'tenants', 'domestic']);

/**
 * Returns records for one verification module.  The table name is supplied only
 * by a route-created handler, never from a request parameter.
 */
const verificationList = async (req, res, next, table) => {
  try {
    const { loc } = req.query;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }
    if (!LIST_TABLES.has(table)) {
      return res.status(500).json({ error: 'Invalid verification list configuration' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP', 'DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED')",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };

    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }

    // Character records retain the existing district access restriction.  The
    // other upload tables contain district codes (rather than district IDs), so
    // they are queried through their own module endpoints without that join.
    const characterUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS';
    const query = table === 'characters'
      ? `SELECT c.* FROM \`characters\` c
           JOIN user_district ud ON ud.district_id = c.${characterUsesPermanentDistrict ? 'per_district_id' : 'pre_district_id'}
           WHERE ${condition} AND ud.user_id = ?
           ORDER BY c.pre_station, c.request_date`
      : `SELECT * FROM \`${table}\` WHERE ${condition} ORDER BY pre_station, request_date`;
    const params = table === 'characters' ? [req.user.userid] : [];
    const [rows] = await pool.execute(query, params);
    return res.json(rows);
  } catch (err) {
    console.error(`Error fetching ${table} list:`, err);
    return next(err);
  }
};

const createVerificationListHandler = (table) => (req, res, next) =>
  verificationList(req, res, next, table);

const characterList = createVerificationListHandler('characters');
const employeeList = createVerificationListHandler('employees');
const tenantList = createVerificationListHandler('tenants');
const domesticList = createVerificationListHandler('domestic');




const Dashboard = async (req, res, next) => {
  console.log('Dashboard request received with query:', req.query);
  console.log("TOKEN USER DATA:", req.user);
  try {
    const { type, sdate, edate } = req.query;
    const { userid, username, usertype } = req.user;
    
    const [stationRows] = await pool.execute(`
SELECT
    p.pre_station,
    p.pre_station_code,
    p.request_count,
    p.approved_count,
    p.rejected_count,
    p.pending_count,
    p.pending_ps_count,
    p.pending_dcrb_count,
    p.pending_liu_count,
    p.pending_dcp_count,
    p.own_to_other,
    COALESCE(o.other_to_own, 0) AS other_to_own
FROM
(
    SELECT
        c.pre_station,
        c.pre_station_code,
        COUNT(*) AS request_count,

        SUM(c.pre_Current_Status LIKE '%APPROVED%') AS approved_count,
        SUM(c.pre_Current_Status LIKE '%REJECTED%') AS rejected_count,

        COUNT(*)
        - SUM(c.pre_Current_Status LIKE '%APPROVED%')
        - SUM(c.pre_Current_Status LIKE '%REJECTED%') AS pending_count,

        SUM(c.pre_Current_Status LIKE '%PS%')   AS pending_ps_count,
        SUM(c.pre_Current_Status LIKE '%DCRB%') AS pending_dcrb_count,
        SUM(c.pre_Current_Status LIKE '%LIU%')  AS pending_liu_count,
        SUM(c.pre_Current_Status LIKE '%DCP%')  AS pending_dcp_count,

SUM(
    CASE
        WHEN c.per_Current_Status IS NOT NULL
         AND c.per_Current_Status NOT IN ('APPROVED', 'REJECTED')
        THEN 1
        ELSE 0
    END
) AS own_to_other
    FROM characters c
    JOIN user_district ud
        ON ud.district_id = c.pre_district_id
    WHERE ud.user_id = ?
    GROUP BY
        c.pre_station,
        c.pre_station_code
) p
LEFT JOIN
(
    SELECT
        c.per_station_code,
        COUNT(*) AS other_to_own
    FROM characters c
    JOIN user_district ud
        ON ud.district_id = c.per_district_id
    WHERE ud.user_id = ?
        AND c.per_Current_Status NOT IN ('APPROVED', 'REJECTED')
      AND c.pre_station_code <> c.per_station_code
    GROUP BY
        c.per_station_code
) o
ON p.pre_station_code = o.per_station_code
ORDER BY
    p.pre_station;`,[userid,userid]);

    const agingSummary = await fetchAgingSummary(sdate, edate);

    res.json({
      stationRows: stationRows || [],
      agingSummary: agingSummary || [],
    });
  } catch (err) {
    next(err);
  }
};


// login ps name and  ps code
let login = async (req, res) => {
  console.log("Your are in login.............................");
  // console.log(req.body);

  const { username, pass } = req.body;
  let connection;
  let usertype = "";
  try {
    connection = await pool.getConnection();

    // Use promise-based query without callback
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    let user = rows[0];

    // Use bcrypt.compare with promise or wrap callback into Promise
    const isMatch = await bcrypt.compare(pass, user.hashpass);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Wrong username/password combination!",
      });
    }

    console.log("user.usertype ", user.usertype);

    // Password matched: set session if available, generate token
    if (req.session) {
      req.session.user = user;
    }
    // console.log(req.session?.user);

    const jwtSecret = process.env.JWT_SECRET || "super_secret_cctns_agra_jwt_key_2026_verif";

    let token = jwt.sign(
      {
        userid: user.userid,
        username: user.username,
        usertype: user.usertype,
      },
      jwtSecret,
      { expiresIn: "10m" },
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.userid, // ensure this matches your DB column name
        username: user.username,
        usertype: user.usertype,
        district_code: user.district_code || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again later.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// login session
const loginsession = async (req, res) => {
  console.log("You are in session login ......................");

  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null; // Extract token

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  let connection;
  try {
    const trimmedToken = token.trim();
    const jwtSecret = process.env.JWT_SECRET || "super_secret_cctns_agra_jwt_key_2026_verif";

    // Verify token synchronously; throws on invalid token
    const decoded = jwt.verify(trimmedToken, jwtSecret);
    console.log("Decoded token:", decoded);

    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT userid, users.username as username, users.name as name, usertype FROM users  
  WHERE userid = ? `,
      [decoded.userid],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = rows[0];
    //  console.log('user.usertype ',user.usertype)
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user details:", error);

    // Handle specific JWT errors if desired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to retrieve user details" });
  } finally {
    if (connection) await connection.release();
  }
};















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

const STANDARD_APP_TYPES = [
  'कर्मचारी सत्यापन',
  'घरेलू सहायता सत्यापन',
  'चरित्र सत्यापन',
  'पोस्टमार्टम रिपोर्ट अनुरोध',
  'शिकायत',
];

const fetchAgingSummary = async (sdate, edate) => {
  let where = `WHERE 1=1`;
  const params = [];
  if (sdate && edate) {
    where += ` AND (अनुरोध_दिनांक BETWEEN ? AND ? OR request_date BETWEEN ? AND ?)`;
    params.push(sdate, edate, sdate, edate);
  }

  try {
    const [maxRows] = await pool.execute('SELECT MAX(COALESCE(अनुरोध_दिनांक, request_date)) as maxDate FROM characters');
    const refDateSql = maxRows[0]?.maxDate ? `'${new Date(maxRows[0].maxDate).toISOString().slice(0,10)}'` : 'CURDATE()';

    const sql = `
      SELECT 
        COALESCE(NULLIF(service, ''), 'चरित्र सत्यापन') AS app_type,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) <= 15 THEN 1 ELSE 0 END) AS d15,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) BETWEEN 16 AND 30 THEN 1 ELSE 0 END) AS d30,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) BETWEEN 31 AND 90 THEN 1 ELSE 0 END) AS d90,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) BETWEEN 91 AND 180 THEN 1 ELSE 0 END) AS d180,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) BETWEEN 181 AND 365 THEN 1 ELSE 0 END) AS d365,
        SUM(CASE WHEN DATEDIFF(${refDateSql}, COALESCE(अनुरोध_दिनांक, request_date)) > 365 THEN 1 ELSE 0 END) AS dAbove1,
        COUNT(*) as total_count
      FROM characters
      ${where}
      GROUP BY app_type
    `;
    const [rows] = await pool.execute(sql, params);
    
    // Merge with standard 5 types to match exact image layout
    const resultMap = new Map();
    rows.forEach(r => resultMap.set(r.app_type, r));

    return STANDARD_APP_TYPES.map((type, idx) => {
      const found = resultMap.get(type) || {};
      return {
        sno: idx + 1,
        app_type: type,
        d15: Number(found.d15 || 0),
        d30: Number(found.d30 || 0),
        d90: Number(found.d90 || 0),
        d180: Number(found.d180 || 0),
        d365: Number(found.d365 || 0),
        dAbove1: Number(found.dAbove1 || 0),
        total_count: Number(found.total_count || 0),
      };
    });
  } catch (err) {
    console.error('Aging summary query error:', err.message);
    return STANDARD_APP_TYPES.map((type, idx) => ({
      sno: idx + 1,
      app_type: type,
      d15: 0, d30: 0, d90: 0, d180: 0, d365: 0, dAbove1: 0, total_count: 0
    }));
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
  characterList,
  employeeList,
  tenantList,
  domesticList,
  login,
  loginsession,
};
