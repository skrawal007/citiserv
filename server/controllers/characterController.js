const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
const { processExcelBuffer } = require('../utils/excelParser');
const mysql =require('mysql2/promise');

const {
  PS_STATUSES,
  LIU_STATUSES,
  DCRB_STATUSES,
  DCP_STATUSES,
  makePlaceholders,
} = require('../constants/statusConstants');

const characterList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }

    const characterUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 
    const stationColumn = characterUsesPermanentDistrict ? 'per_station_code' : 'pre_station_code';

    const query =` SELECT characters.* FROM characters 
      JOIN station_ ON station_.code = characters.${stationColumn}
      JOIN user_station ON user_station.station_id = station_.id
      JOIN district_ ON district_.code = station_.district_code
      JOIN user_district ON user_district.district_id= district_.id
      WHERE  ${condition} 
      AND user_district.user_id = ?
      ORDER BY pre_station_name, request_date;`;

    console.log(mysql.format(query,[req.user.userid]));

      const [rows] = await pool.execute(query, [userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching character list:', err);
    return next(err);
  }
};

const employeeList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;

    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }
  
    const employeeUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 

    const stationColumn = employeeUsesPermanentDistrict ? 'per_station_code' : 'pre_station_code';


    // const query = `SELECT * FROM employees WHERE ${condition} ORDER BY pre_station_name, request_date`;

    const query =` 
      SELECT employees.* FROM employees 
      JOIN station_ ON station_.code = ${stationColumn}
      JOIN district_ ON district_.code = station_.district_code
      JOIN user_district ON user_district.district_id= district_.id
      WHERE  ${condition} 
	      AND user_district.user_id = 10074
      ORDER BY pre_station_name, request_date;`;
        
   console.log(mysql.format(query));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching employee list:', err);
    return next(err);
  }
};

const tenantList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;

    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }
  
    const tenantsUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 

    const stationColumn = tenantsUsesPermanentDistrict ? 'per_station_code' : 'pre_station_code';


   
    const query =` 
      SELECT tenants.* FROM tenants 
      JOIN station_ ON station_.code = ${stationColumn}
      JOIN district_ ON district_.code = station_.district_code
      JOIN user_district ON user_district.district_id= district_.id
      WHERE  ${condition} 
	      AND user_district.user_id = ?
      ORDER BY pre_station_name, request_date;`;
        
   console.log(mysql.format(query));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching tenant list:', err);
    return next(err);
  }
};

const domesticList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP', 'DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }
  
    const domesticUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 

    const stationColumn = domesticUsesPermanentDistrict ? 'per_station_code' : 'pre_station_code';


    const query =` 
      SELECT domestic.* FROM domestic 
      JOIN station_ ON station_.code = ${stationColumn}
      JOIN district_ ON district_.code = station_.district_code
      JOIN user_district ON user_district.district_id= district_.id
      WHERE  ${condition} 
	      AND user_district.user_id = ?
      ORDER BY pre_station_name, request_date;`;
        
   console.log(mysql.format(query));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching domestic list:', err);
    return next(err);
  }
};

// complaintList

const complaintList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP', 'DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }
  
    const domesticUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 



    const query =`
        SELECT 

        complaints.district_code AS pre_district_code,
        complaints.district_name AS pre_district_name,
        complaints.station_code AS pre_station_code,
        complaints.station_name AS pre_station_name,

        complaints.*
        FROM complaints 
          JOIN station_ ON station_.code = station_code
          JOIN district_ ON district_.code = station_.district_code
          JOIN user_district ON user_district.district_id= district_.id
          WHERE ${condition} AND user_district.user_id = ?
          ORDER BY  request_date;`;
        
   console.log(mysql.format(query));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching domestic list:', err);
    return next(err);
  }
};

// postmortemList


const postmortemList = async (req, res, next) => {
  try {
    const { loc } = req.query;
    const {userid} =req.user;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    const conditions = {
      totaldcp: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP', 'DCP')",
      totalliu: "pre_Current_Status IN ('PS/DCRB/LIU/DCP')",
      totalps: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCP', 'PS/DCRB/LIU/DCP')",
      totaldcrb: "pre_Current_Status IN ('PS/DCRB/DCP', 'PS/DCRB/LIU/DCP')",
      totalremain: "pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND  pre_Current_Status <> ''",
      totaldiff: 'pre_station_code <> per_station_code',
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }
  
    const domesticUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 



    const query =`
        SELECT 

        postmortem.district_code AS pre_district_code,
        postmortem.district_name AS pre_district_name,
        postmortem.station_code AS pre_station_code,
        postmortem.station_name AS pre_station_name,

        postmortem.*
        FROM postmortem 
          JOIN station_ ON station_.code = station_code
          JOIN district_ ON district_.code = station_.district_code
          JOIN user_district ON user_district.district_id= district_.id
          WHERE ${condition} AND user_district.user_id = ?
          ORDER BY  request_date;`;
        
   console.log(mysql.format(query));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching domestic list:', err);
    return next(err);
  }
};

const Dashboard = async (req, res, next) => {
  console.log('Dashboard request received with query:', req.query);
  console.log("TOKEN USER DATA:", req.user);
  try {
    const { type, sdate, edate } = req.query;
    const { userid, username, usertype } = req.user;
    let tableType ;
    if(type ==='employee'){
      tableType ='employees'
    }else if(type ==='character'){
      tableType = 'characters'
    } else if( type === 'tenant'){
      tableType = 'tenants';
    } else if (type === 'domestic'){
      tableType ='domestic'
    } else {
          res.json({
      stationRows:   [],
      agingSummary: [],
    });
    return;
    }
    
   let query =`SELECT
    p.pre_station_name,
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
        pre_station_name,
        pre_station_code,
        COUNT(*) AS request_count,

        SUM(pre_Current_Status LIKE '%APPROVED%') AS approved_count,
        SUM(pre_Current_Status LIKE '%REJECTED%') AS rejected_count,

        COUNT(*)
        - SUM(pre_Current_Status LIKE '%APPROVED%')
        - SUM(pre_Current_Status LIKE '%REJECTED%') AS pending_count,

        SUM(pre_Current_Status LIKE '%PS%')   AS pending_ps_count,
        SUM(pre_Current_Status LIKE '%DCRB%') AS pending_dcrb_count,
        SUM(pre_Current_Status LIKE '%LIU%')  AS pending_liu_count,
        SUM(pre_Current_Status LIKE '%DCP%')  AS pending_dcp_count,

SUM(
    CASE
        WHEN per_Current_Status IS NOT NULL
         AND per_Current_Status NOT IN ('APPROVED', 'REJECTED')
        THEN 1
        ELSE 0
    END
) AS own_to_other
    FROM ${tableType} 
    JOIN station_ ON station_.code = ${tableType}.pre_station_code
    JOIN district_ ON district_.code = station_.district_code
    JOIN user_district ud ON ud.district_id = district_.id
    WHERE ud.user_id = ?
    GROUP BY pre_station_name,pre_station_code
) p
LEFT JOIN
(
    SELECT
        per_station_code,
        COUNT(*) AS other_to_own
    FROM ${tableType} 
	JOIN station_ ON station_.code = ${tableType}.pre_station_code
    JOIN district_ ON district_.code = station_.district_code
    JOIN user_district ud ON ud.district_id = district_.id
    WHERE ud.user_id = ? AND per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code
    GROUP BY per_station_code
) o ON p.pre_station_code = o.per_station_code
ORDER BY p.pre_station_name`;

    const [stationRows] = await pool.execute(query,[userid,userid]);

    const agingSummary = await fetchAgingSummary(sdate, edate);

    res.json({
      stationRows: stationRows || [],
      agingSummary: agingSummary || [],
    });
  } catch (err) {
    next(err);
  }
};

const combinedDashbaord = async (req, res, next) => {
  console.log('Dashboard request received with query:', req.query);
  console.log("TOKEN USER DATA:", req.user);
  try{

    // const { type, sdate, edate } = req.query;
    const { userid } = req.user;

    // const { userid, username, usertype } = req.user;

    console.log( typeof userid);
   let  query=`WITH verification_records AS (
    SELECT 'Tenants' AS verification_type,
           pre_district_code,
           per_district_code,
           pre_Current_Status,
           per_Current_Status
    FROM tenants

    UNION ALL

    SELECT 'Employee' AS verification_type,
           pre_district_code,
           per_district_code,
           pre_Current_Status,
           per_Current_Status
    FROM employees

    UNION ALL

    SELECT 'Character' AS verification_type,
           pre_district_code,
           per_district_code,
           pre_Current_Status,
           per_Current_Status
    FROM characters

    UNION ALL

    SELECT 'Domestic' AS verification_type,
           pre_district_code,
           per_district_code,
           pre_Current_Status,
           per_Current_Status
    FROM domestic
),
outgoing AS (
    SELECT
        vr.verification_type,
        COUNT(*) AS request_count,

        SUM(CASE WHEN vr.pre_Current_Status LIKE '%APPROVED%' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN vr.pre_Current_Status LIKE '%REJECTED%' THEN 1 ELSE 0 END) AS rejected_count,

        SUM(CASE
            WHEN vr.pre_Current_Status IS NULL
              OR (
                vr.pre_Current_Status NOT LIKE '%APPROVED%'
                AND vr.pre_Current_Status NOT LIKE '%REJECTED%'
              )
            THEN 1 ELSE 0
        END) AS pending_count,

        SUM(CASE WHEN vr.pre_Current_Status LIKE '%PS%' THEN 1 ELSE 0 END) AS pending_ps_count,
        SUM(CASE WHEN vr.pre_Current_Status LIKE '%DCRB%' THEN 1 ELSE 0 END) AS pending_dcrb_count,
        SUM(CASE WHEN vr.pre_Current_Status LIKE '%LIU%' THEN 1 ELSE 0 END) AS pending_liu_count,
        SUM(CASE WHEN vr.pre_Current_Status LIKE '%DCP%' THEN 1 ELSE 0 END) AS pending_dcp_count,

        SUM(CASE
            WHEN vr.per_Current_Status IS NOT NULL
             AND vr.per_Current_Status NOT IN ('APPROVED', 'REJECTED')
             AND vr.pre_district_code <> vr.per_district_code
            THEN 1 ELSE 0
        END) AS own_to_other
    FROM verification_records vr
    JOIN district_ d ON d.code = vr.pre_district_code
    JOIN user_district ud ON ud.district_id = d.id
    WHERE ud.user_id = ?
    GROUP BY vr.verification_type
),
incoming AS (
    SELECT
        vr.verification_type,
        COUNT(*) AS other_to_own
    FROM verification_records vr
    JOIN district_ d ON d.code = vr.per_district_code
    JOIN user_district ud ON ud.district_id = d.id
    WHERE ud.user_id = ?
      AND vr.per_Current_Status IS NOT NULL
      AND vr.per_Current_Status NOT IN ('APPROVED', 'REJECTED')
      AND vr.pre_district_code <> vr.per_district_code
    GROUP BY vr.verification_type
)
SELECT
    o.verification_type,
    o.request_count,
    o.approved_count,
    o.rejected_count,
    o.pending_count,
    o.pending_ps_count,
    o.pending_dcrb_count,
    o.pending_liu_count,
    o.pending_dcp_count,
    o.own_to_other,
    COALESCE(i.other_to_own, 0) AS other_to_own
FROM outgoing o
LEFT JOIN incoming i
    ON i.verification_type = o.verification_type
ORDER BY o.verification_type;`;

    const [result] = await pool.execute(query, [userid, userid]);
    console.log('Combined dashboard result length:', result.length);

    res.json({
        DashboardResult : result
      })

  }
   catch (err) {
    next(err);
  }

}

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
  // const [rows] = await pool.execute('SELECT MIN(अनुरोध_दिनांक) as minDate FROM characters');
  return rows[0]?.minDate || null;
};

const fetchMaxDate = async () => {
  // const [rows] = await pool.execute('SELECT MAX(अनुरोध_दिनांक) as maxDate FROM characters');
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
  postmortemList,
  login,
  loginsession,
  complaintList
};
