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


const conditions = {
      totaldcp: "pre_Current_Status ='DCP'",
      totalliu: "pre_Current_Status LIKE '%LIU%'",
      totalps: "pre_Current_Status LIKE '%PS%'",
      totaldcrb: "pre_Current_Status LIKE '%DCRB%'",
      totalremain: ` ((pre_Current_Status NOT IN ('APPROVED', 'REJECTED') AND per_Current_Status IS NULL)
      OR( pre_Current_Status NOT IN ('APPROVED', 'REJECTED')  AND per_Current_Status NOT IN ('APPROVED', 'REJECTED')))`,
      totaldiff: `pre_station_code <> per_station_code AND pre_Current_Status NOT IN ('APPROVED', 'REJECTED')`,
      OTHER_TO_OWN_PS: "per_Current_Status NOT IN ('APPROVED', 'REJECTED') AND pre_station_code <> per_station_code",
    };

const characterList = async (req, res, next) => {
  try {
    console.log("Charcter list req.query ", req.query);
    const { loc,sdate,edate } = req.query;
    const {userid} =req.user;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }

    
    const condition = conditions[loc];
    if (!condition) {
      return res.status(400).json({ error: 'Invalid list location' });
    }

    const characterUsesPermanentDistrict = loc === 'OTHER_TO_OWN_PS'; 
    const stationColumn = characterUsesPermanentDistrict ? 'per_station_code' : 'pre_station_code';

    const query =` SELECT characters.* FROM characters 
      JOIN station_ ON station_.code = characters.${stationColumn}
    -- JOIN user_station ON user_station.station_id = station_.id
      JOIN district_ ON district_.code = station_.district_code
      JOIN user_district ON user_district.district_id= district_.id
      WHERE  ${condition} 
      AND user_district.user_id = ? AND request_date BETWEEN ? AND ? 
      ORDER BY pre_station_name, request_date;`;

    console.log(mysql.format(query,[req.user.userid,sdate,edate]));

      const [rows] = await pool.execute(query, [userid, sdate,edate]);

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
        
  //  console.log(mysql.format(query));

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
        
  //  console.log(mysql.format(query));

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
        
 //  console.log(mysql.format(query));

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
      totaldcp: "pre_Current_Status ='DCP'",
      totalremain: `pre_Current_Status  NOT IN ('FINISHED', 'REJECTED')`,
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
        
   console.log(mysql.format(query,[userid]));

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
      totaldcp: "pre_Current_Status ='DCP'",
      totalremain: `pre_Current_Status  NOT IN ('APPROVED', 'REJECTED')`,
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
        
  //  console.log(mysql.format(query, [userid]));

    const [rows] = await pool.execute(query,[userid]);

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching domestic list:', err);
    return next(err);
  }
};


const Dashboard = async (req, res, next) => {
  console.log('Dashboard request received with query:', req.query);

  try {
    const { type, sdate, edate } = req.query;
    const { userid } = req.user;

    // ---------------------------------------------------------
    // 1. Validate / select table
    // ---------------------------------------------------------
    const tableMap = {
      employee: 'employees',
      character: 'characters',
      tenant: 'tenants',
      domestic: 'domestic'
    };

    const tableType = tableMap[type];

    if (!tableType) {
      return res.json({
        stationRows: []
      });
    }

    // ---------------------------------------------------------
    // 2. Date condition
    // ---------------------------------------------------------
    //
    // If request_date is DATETIME:
    //
    // >= sdate
    // < edate + 1 day
    //
    // This includes the complete end date.
    //
    let dateCondition = '';
    let dateParams = [];

    if (sdate && edate) {
      dateCondition = `
        AND t.request_date >= ?
        AND t.request_date < DATE_ADD(?, INTERVAL 1 DAY)
      `;

      dateParams = [sdate, edate];
    }

    // ---------------------------------------------------------
    // 3. Main SQL
    // ---------------------------------------------------------
    //
    // user_stations = MASTER station list
    //
    // This is the important part.
    //
    // We start from ALL stations belonging to the user's
    // district and LEFT JOIN the transaction counts.
    //
    // Therefore:
    //
    // Station with records     -> counts
    // Station without records  -> 0
    //
    const query = `
      WITH user_stations AS (

        SELECT DISTINCT
          s.name AS pre_station_name,
          s.code AS pre_station_code

        FROM station_ s

        INNER JOIN district_ d
          ON d.code = s.district_code

        INNER JOIN user_district ud
          ON ud.district_id = d.id

        WHERE ud.user_id = ?

      ),

      outgoing AS (

        SELECT
          t.pre_station_code,

          COUNT(*) AS request_count,

          /* APPROVED */
          SUM(
            CASE
              WHEN t.pre_Current_Status LIKE '%APPROVED%'
              THEN 1
              ELSE 0
            END
          ) AS approved_count,

          /* REJECTED */
          SUM(
            CASE
              WHEN t.pre_Current_Status LIKE '%REJECTED%'
              THEN 1
              ELSE 0
            END
          ) AS rejected_count,

          /* PENDING */
          SUM(
            CASE
              WHEN t.pre_Current_Status IS NULL
                OR (
                  t.pre_Current_Status NOT LIKE '%APPROVED%'
                  AND t.pre_Current_Status NOT LIKE '%REJECTED%'
                )
              THEN 1
              ELSE 0
            END
          ) AS pending_count,

          /* PENDING PS */
          SUM(
            CASE
              WHEN t.pre_Current_Status LIKE '%PS%'
              THEN 1
              ELSE 0
            END
          ) AS pending_ps_count,

          /* PENDING DCRB */
          SUM(
            CASE
              WHEN t.pre_Current_Status LIKE '%DCRB%'
              THEN 1
              ELSE 0
            END
          ) AS pending_dcrb_count,

          /* PENDING LIU */
          SUM(
            CASE
              WHEN t.pre_Current_Status LIKE '%LIU%'
              THEN 1
              ELSE 0
            END
          ) AS pending_liu_count,

          /* PENDING DCP */
          SUM(
            CASE
              WHEN t.pre_Current_Status = 'DCP'
              THEN 1
              ELSE 0
            END
          ) AS pending_dcp_count,

          /*
           * OWN -> OTHER
           *
           * Request originated at this station
           * and moved to another station.
           */
          SUM(
            CASE
              WHEN t.per_Current_Status IS NOT NULL
                AND t.per_Current_Status NOT IN (
                  'APPROVED',
                  'REJECTED'
                )
                AND t.pre_station_code IS NOT NULL
                AND t.per_station_code IS NOT NULL
                AND t.pre_station_code <> t.per_station_code
              THEN 1
              ELSE 0
            END
          ) AS own_to_other

        FROM ${tableType} t

        WHERE 1 = 1

        ${dateCondition}

        GROUP BY
          t.pre_station_code

      ),

      incoming AS (

        SELECT
          t.per_station_code,

          /*
           * OTHER -> OWN
           *
           * Request came from another station
           * and is currently pending at this station.
           */
          COUNT(*) AS other_to_own

        FROM ${tableType} t

        WHERE t.per_Current_Status IS NOT NULL

          AND t.per_Current_Status NOT IN (
            'APPROVED',
            'REJECTED'
          )

          AND t.pre_station_code IS NOT NULL

          AND t.per_station_code IS NOT NULL

          AND t.pre_station_code <> t.per_station_code

          ${dateCondition}

        GROUP BY
          t.per_station_code

      )

      SELECT

        /* Station information */
        us.pre_station_name,
        us.pre_station_code,

        /* Outgoing */
        COALESCE(o.request_count, 0) AS request_count,

        COALESCE(o.approved_count, 0) AS approved_count,

        COALESCE(o.rejected_count, 0) AS rejected_count,

        COALESCE(o.pending_count, 0) AS pending_count,

        COALESCE(o.pending_ps_count, 0) AS pending_ps_count,

        COALESCE(o.pending_dcrb_count, 0) AS pending_dcrb_count,

        COALESCE(o.pending_liu_count, 0) AS pending_liu_count,

        COALESCE(o.pending_dcp_count, 0) AS pending_dcp_count,

        COALESCE(o.own_to_other, 0) AS own_to_other,

        /* Incoming */
        COALESCE(i.other_to_own, 0) AS other_to_own

      FROM user_stations us

      LEFT JOIN outgoing o
        ON o.pre_station_code = us.pre_station_code

      LEFT JOIN incoming i
        ON i.per_station_code = us.pre_station_code

      ORDER BY
        us.pre_station_name
    `;

    // ---------------------------------------------------------
    // 4. Query parameters
    // ---------------------------------------------------------
    //
    // user_stations:
    //     1 parameter
    //
    // outgoing:
    //     sdate
    //     edate
    //
    // incoming:
    //     sdate
    //     edate
    //
    const params = [
      userid,
      ...dateParams,
      ...dateParams
    ];

    // console.log(
    //   'Dashboard SQL:',
    //   mysql.format(query, params)
    // );

    // ---------------------------------------------------------
    // 5. Execute query
    // ---------------------------------------------------------
    const [stationRows] = await pool.execute(
      query,
      params
    );

    // ---------------------------------------------------------
    // 6. Create TOTAL row
    // ---------------------------------------------------------
    const totalRow = {
      pre_station_name: 'TOTAL',
      isTotal: true,
      pre_station_code: null,

      request_count: 0,
      approved_count: 0,
      rejected_count: 0,
      pending_count: 0,

      pending_ps_count: 0,
      pending_dcrb_count: 0,
      pending_liu_count: 0,
      pending_dcp_count: 0,

      own_to_other: 0,
      other_to_own: 0
    };

    // ---------------------------------------------------------
    // 7. Calculate totals
    // ---------------------------------------------------------
    stationRows.forEach((row) => {

      totalRow.request_count += Number(
        row.request_count || 0
      );

      totalRow.approved_count += Number(
        row.approved_count || 0
      );

      totalRow.rejected_count += Number(
        row.rejected_count || 0
      );

      totalRow.pending_count += Number(
        row.pending_count || 0
      );

      totalRow.pending_ps_count += Number(
        row.pending_ps_count || 0
      );

      totalRow.pending_dcrb_count += Number(
        row.pending_dcrb_count || 0
      );

      totalRow.pending_liu_count += Number(
        row.pending_liu_count || 0
      );

      totalRow.pending_dcp_count += Number(
        row.pending_dcp_count || 0
      );

      totalRow.own_to_other += Number(
        row.own_to_other || 0
      );

      totalRow.other_to_own += Number(
        row.other_to_own || 0
      );
    });

    // ---------------------------------------------------------
    // 8. Add TOTAL at bottom
    // ---------------------------------------------------------
    stationRows.push(totalRow);

    // ---------------------------------------------------------
    // 9. Response
    // ---------------------------------------------------------
    return res.json({
      stationRows
    });

  } catch (err) {
    console.error(
      'Dashboard Error:',
      err
    );

    next(err);
  }
};

const combinedDashbaord = async (req, res, next) => {
  console.log('Combined Dashboard request received with query:', req.query);
  // console.log("TOKEN USER DATA:", req.user);
  try{

    const { type, sdate, edate } = req.query;
    const { userid } = req.user;
    
let query =`WITH verification_types AS (
    SELECT 'Tenants' AS verification_type
    UNION ALL
    SELECT 'Employee'
    UNION ALL
    SELECT 'Character'
    UNION ALL
    SELECT 'Domestic'
),

verification_records AS (
    SELECT
        'Tenants' AS verification_type,
        request_date,
        pre_district_code,
        per_district_code,
        pre_Current_Status,
        per_Current_Status
    FROM tenants

    UNION ALL

    SELECT
        'Employee' AS verification_type,
        request_date,
        pre_district_code,
        per_district_code,
        pre_Current_Status,
        per_Current_Status
    FROM employees

    UNION ALL

    SELECT
        'Character' AS verification_type,
        request_date,
        pre_district_code,
        per_district_code,
        pre_Current_Status,
        per_Current_Status
    FROM characters

    UNION ALL

    SELECT
        'Domestic' AS verification_type,
        request_date,
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

        SUM(
            CASE
                WHEN vr.pre_Current_Status LIKE '%APPROVED%'
                THEN 1 ELSE 0
            END
        ) AS approved_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status LIKE '%REJECTED%'
                THEN 1 ELSE 0
            END
        ) AS rejected_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status IS NULL
                  OR (
                    vr.pre_Current_Status NOT LIKE '%APPROVED%'
                    AND vr.pre_Current_Status NOT LIKE '%REJECTED%'
                  )
                THEN 1 ELSE 0
            END
        ) AS pending_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status LIKE '%PS%'
                THEN 1 ELSE 0
            END
        ) AS pending_ps_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status LIKE '%DCRB%'
                THEN 1 ELSE 0
            END
        ) AS pending_dcrb_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status LIKE '%LIU%'
                THEN 1 ELSE 0
            END
        ) AS pending_liu_count,

        SUM(
            CASE
                WHEN vr.pre_Current_Status = 'DCP'
                THEN 1 ELSE 0
            END
        ) AS pending_dcp_count,

        SUM(
            CASE
                WHEN vr.per_Current_Status IS NOT NULL
                 AND vr.per_Current_Status NOT IN ('APPROVED', 'REJECTED')
                 AND vr.pre_district_code <> vr.per_district_code
                THEN 1 ELSE 0
            END
        ) AS own_to_other

    FROM verification_records vr

    JOIN district_ d
        ON d.code = vr.pre_district_code

    JOIN user_district ud
        ON ud.district_id = d.id

    WHERE ud.user_id = ?
      AND vr.request_date >= ?
      AND vr.request_date < ?

    GROUP BY vr.verification_type
),

incoming AS (
    SELECT
        vr.verification_type,

        COUNT(*) AS other_to_own

    FROM verification_records vr

    JOIN district_ d
        ON d.code = vr.per_district_code

    JOIN user_district ud
        ON ud.district_id = d.id

    WHERE ud.user_id = ?

      AND vr.request_date >= ?
      AND vr.request_date < ?

      AND vr.per_Current_Status IS NOT NULL

      AND vr.per_Current_Status NOT IN (
          'APPROVED',
          'REJECTED'
      )

      AND vr.pre_district_code <> vr.per_district_code

    GROUP BY vr.verification_type
)

SELECT
    vt.verification_type,

    COALESCE(o.request_count, 0) AS request_count,
    COALESCE(o.approved_count, 0) AS approved_count,
    COALESCE(o.rejected_count, 0) AS rejected_count,
    COALESCE(o.pending_count, 0) AS pending_count,
    COALESCE(o.pending_ps_count, 0) AS pending_ps_count,
    COALESCE(o.pending_dcrb_count, 0) AS pending_dcrb_count,
    COALESCE(o.pending_liu_count, 0) AS pending_liu_count,
    COALESCE(o.pending_dcp_count, 0) AS pending_dcp_count,
    COALESCE(o.own_to_other, 0) AS own_to_other,
    COALESCE(i.other_to_own, 0) AS other_to_own

FROM verification_types vt

LEFT JOIN outgoing o
    ON o.verification_type = vt.verification_type

LEFT JOIN incoming i
    ON i.verification_type = vt.verification_type

ORDER BY
    vt.verification_type`;

// console.log(mysql.format(query, [ userid,
//   sdate,
//   edate,
//   userid,
//   sdate,
//   edate]));    

const [result] = await pool.execute(query, [  
  userid,
  sdate,
  edate,
  userid,
  sdate,
  edate]);
    



// Calculate total row
const totalRow = {
  verification_type : "TOTAL",
  isTotal: true,
  pre_station_code: null,
  request_count: 0,
  approved_count: 0,
  rejected_count: 0,
  pending_count: 0,
  pending_ps_count: 0,
  pending_dcrb_count: 0,
  pending_liu_count: 0,
  pending_dcp_count: 0,
  own_to_other: 0,
  other_to_own: 0,
};

// Sum every numeric column
result.forEach((row) => {
  totalRow.request_count += Number(row.request_count || 0);
  totalRow.approved_count += Number(row.approved_count || 0);
  totalRow.rejected_count += Number(row.rejected_count || 0);
  totalRow.pending_count += Number(row.pending_count || 0);
  totalRow.pending_ps_count += Number(row.pending_ps_count || 0);
  totalRow.pending_dcrb_count += Number(row.pending_dcrb_count || 0);
  totalRow.pending_liu_count += Number(row.pending_liu_count || 0);
  totalRow.pending_dcp_count += Number(row.pending_dcp_count || 0);
  totalRow.own_to_other += Number(row.own_to_other || 0);
  totalRow.other_to_own += Number(row.other_to_own || 0);
});

// Add total row at the end
result.push(totalRow);


    res.json({
        DashboardResult : result
      })

  }
   catch (err) {
    next(err);
  }

}
const PendingDurationSummary= async(req,res,next)=>{
console.log(" you called PendingDurationSummary .........");
   
try{
   const { userid } = req.user;
   console.log("userid ", userid);
  
   const query = `SELECT
    ROW_NUMBER() OVER (ORDER BY ApplicationType) AS SNo,
    ApplicationType,

    COUNT(request_number) AS Total,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) BETWEEN 0 AND 15
        THEN 1 ELSE 0
    END) AS Within15Days,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) BETWEEN 16 AND 30
        THEN 1 ELSE 0
    END) AS Between16To30Days,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) BETWEEN 31 AND 90
        THEN 1 ELSE 0
    END) AS Between31To90Days,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) BETWEEN 91 AND 180
        THEN 1 ELSE 0
    END) AS Between91To180Days,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) BETWEEN 181 AND 365
        THEN 1 ELSE 0
    END) AS Between181To365Days,

    SUM(CASE
        WHEN DATEDIFF(CURDATE(), request_date) > 365
        THEN 1 ELSE 0
    END) AS Above01Year

FROM (

    SELECT
        request_number,
        request_date,
        pre_Current_Status,
        per_Current_Status,
        pre_station_code,
        'Character' AS ApplicationType
    FROM characters

    UNION ALL

    SELECT
        request_number,
        request_date,
        pre_Current_Status,
        per_Current_Status,
        pre_station_code,
        'Employee' AS ApplicationType
    FROM employees

    UNION ALL

    SELECT
        request_number,
        request_date,
        pre_Current_Status,
        per_Current_Status,
        pre_station_code,
        'Tenant' AS ApplicationType
    FROM tenants

    UNION ALL

    SELECT
        request_number,
        request_date,
        pre_Current_Status,
        per_Current_Status,
        pre_station_code,
        'Domestic' AS ApplicationType
    FROM domestic

) AS applications

JOIN station_
    ON station_.code = applications.pre_station_code

JOIN district_
    ON district_.code = station_.district_code

JOIN user_district ud
    ON ud.district_id = district_.id

WHERE ud.user_id = 10074

  AND (
      applications.pre_Current_Status IS NULL
      OR UPPER(TRIM(applications.pre_Current_Status))
         NOT IN ('APPROVED', 'REJECTED')
  )

  AND (
      applications.per_Current_Status IS NULL
      OR UPPER(TRIM(applications.per_Current_Status))
         NOT IN ('APPROVED', 'REJECTED')
  )

GROUP BY ApplicationType

ORDER BY ApplicationType`;

const [result] = await pool.execute(query);

// Calculate total row
const totalRow = {
  ApplicationType : "TOTAL",
  isTotal: true,
  Total: 0,
  Within15Days: 0,
  Between16To30Days: 0,
  Between31To90Days: 0,
  Between91To180Days: 0,
  Between181To365Days: 0,
  Above01Year: 0,
};

// Sum every numeric column
result.forEach((row) => {
  totalRow.Total += Number(row.Total || 0);
  totalRow.Within15Days += Number(row.Within15Days || 0);
  totalRow.Between16To30Days += Number(row.Between16To30Days || 0);
  totalRow.Between31To90Days += Number(row.Between31To90Days || 0);
  totalRow.Between91To180Days += Number(row.Between91To180Days || 0);
  totalRow.Between181To365Days += Number(row.Between181To365Days || 0);
  totalRow.Above01Year += Number(row.Above01Year || 0);
});

// Add total row at the end
result.push(totalRow);




return res.json({
      result: result
    });

  } catch (err) {
    console.error(
      'Dashboard Error:',
      err
    );

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
  PendingDurationSummary,
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
