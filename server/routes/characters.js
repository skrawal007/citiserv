const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../db');

const upload = multer({ storage: multer.memoryStorage() });

// ─── Status mapping (replaces JS status() function) ───────────────────────────
const STATUS_MAP = {
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/LIU/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCRB/DCP',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'DCP',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही': 'PS/DCRB/DCP',
};

// PS station status values used in SQL
const PS_STATUSES = [
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आईयू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
];
const LIU_STATUSES = [
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
];
const DCRB_STATUSES = [
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी निरुपित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पूछताछ अधिकारी समनुदेशन के लिए लंबित / जमा करने के लिए लंबित डी सी आर बी द्वारा / जमा करने के लिए लंबित एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / जमा करने के लिए लंबित डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
];
const DCP_STATUSES = [
  'वर्तमान पता :- (पुलिस स्टेशन द्वारा सत्यापन पूर्ण किया गया / स्वीकृत डी सी आर बी द्वारा / स्वीकृत एल आई यू द्वारा ) - और एस.पी. / एस.एस.पी.से लंबित कार्यवाही',
];

const makePlaceholders = (arr) => arr.map(() => '?').join(',');

// ─── Helper: convert Excel serial date or string date ─────────────────────────

function parseExcelDate(input) {
    if (!input) return null;

    const [date] = input.split(" ");
    const [day, month, year] = date.split("/");

    return `${year}-${month}-${day}`;
}



// ─── POST /api/characters/upload ─────────────────────────────────────────────
// Receives multipart Excel file, parses into JSON format, and logs to backend console
router.post('/upload', upload.single('excel_file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) return res.status(400).json({ error: 'File is empty or has no data rows' });

    // Detect header row: search for known header names anywhere in row
    let headerRowIdx = -1;
    const knownHeaders = ['police station', 'ps', 'थाना', 'service no', 'application no', 'अनुरोध', 'district', 'status', 'sno', 's.no.', 'date', 'applicant name', 'present address'];

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
      if (knownHeaders.some(k => rowStr.includes(k))) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 1;

    // Check if title row (before headers) contains district name e.g. "जनपद- पश्चिमी (कमिश्नरेट आगरा)"
    let titleDistrict = '';
    for (let i = 0; i < headerRowIdx; i++) {
      const titleStr = (rows[i] || []).map(c => String(c || '').trim()).join(' ');
      if (titleStr.includes('जनपद') || titleStr.toLowerCase().includes('district')) {
        titleDistrict = titleStr;
        break;
      }
    }

    const districtName=titleDistrict.split("-")[1]?.trim()

    const headers = rows[headerRowIdx];
    const dataRows = rows.slice(headerRowIdx + 1);

    const jsonResult = [];

    let differentAddressCount = 0;
   const differentAddresses = [];

   let per_state;
   let per_district;
   let per_station;
   let per_add;

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

  
      const getCell = (...keys) => {
        for (const key of keys) {
          const idx = headers.findIndex(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '').includes(key.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '')));
          if (idx >= 0 && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
            return String(row[idx]).trim();
          }
        }
        return '';
      };

      let SNO       = getCell('sno', 's.no', 'क्र0सं0');
      let DIST      = getCell('जनपद', 'district') || districtName;
      let PS        = getCell('ps', 'थाना', 'police station');
      let ACK       = getCell('application no', 'service no', 'अनुरोध संख्या', 'applicationno', 'serviceno');
      let SERV      = getCell('service type', 'service', 'सेवा', 'servicetype');
      let ACKDAT    = getCell('date', 'अनुरोध दिनांक');
      let YEAR      = getCell('year');
      let NAME      = getCell('applicant name', 'आवेदक का नाम', 'applicantname', 'name');
      let PRE_ADD   = getCell('present address', 'वर्तमान पता', 'presentaddress', 'current address');
      let PER_ADD   = getCell('permanent address', 'स्थायी पता', 'permanentaddress');
      let DAYS      = getCell('pending days', 'लम्बित दिन', 'pendingdays');
      let STATUS    = getCell('current status', 'अनुरोध की स्थिति', 'currentstatus', 'status');

      if (!ACK && !PS && !NAME) continue;

      const rawDateIdx = headers.findIndex(h => {
        const key = String(h || '').trim().toLowerCase();
        return key.includes('date') || key.includes('अनुरोध दिनांक');
      });

      const rawDateVal = rawDateIdx >= 0 ? row[rawDateIdx] : ACKDAT;
      const ACKDATE = parseExcelDate(rawDateVal) || ACKDAT;


      // Count only when both addresses exist and are different
  // if (PADD && PPADD && PADD !== PPADD) {

 
  // }

  // console.log("districtName ", districtName);

  // console.log(" DIST ", DIST);

  // thsi permanent address filter based on district 
  if(PER_ADD.includes(districtName) && PRE_ADD.includes(districtName) ){

  // console.log("address parsing ", parseAddress(PER_ADD,districtName));
  // const {address,station_name,district,state}
  const perAddParse =parseAddress(PER_ADD,districtName);
  const preAddParse =parseAddress(PRE_ADD,districtName);

     jsonResult.push({
        SNo: SNO,
        // जनपद: DIST,
        station : PS,
        सेवा: SERV,
        अनुरोध_संख्या: ACK,
        अनुरोध_दिनांक: ACKDATE,
        आवेदक_का_नाम: NAME,
        // वर्तमान_पता: PRE_ADD,
        pre_add: preAddParse.address,
        pre_station: preAddParse.station_name,
        pre_district: preAddParse.district,
        pre_state: preAddParse.state,
        // स्थायी_पता: PER_ADD,
        per_add: perAddParse.address,
        per_station: perAddParse.station_name,
        per_district: perAddParse.district,
        per_state: perAddParse.state,
        लम्बित_दिन: DAYS,
        // अनुरोध_की_स्थिति: STATUS
      });

  }
  

  else if(!PER_ADD.includes(districtName) && PRE_ADD.includes(districtName) ){
  differentAddressCount++;
  const preAddParse =parseAddress(PRE_ADD,districtName);

   differentAddresses.push({
        district : DIST,
        station: PS,
        सेवा: SERV,
       आवेदन_संख्या: ACK,
       अनुरोध_दिनांक: ACKDATE,
       आवेदक: NAME,
      //  वर्तमान_पता: PRE_ADD,

        pre_add: preAddParse.address,
        pre_station: preAddParse.station_name,
        pre_district: preAddParse.district,
        pre_state: preAddParse.state,
       स्थायी_पता: PER_ADD
      
    
    });

  }

   else if(PER_ADD.includes(districtName) && !PRE_ADD.includes(districtName) ){
  differentAddressCount++;
  const perAddParse =parseAddress(PER_ADD,districtName);

   differentAddresses.push({
        district : DIST,
        station : PS,
        सेवा: SERV,
       आवेदन_संख्या: ACK,
       अनुरोध_दिनांक: ACKDATE,
       आवेदक: NAME,
       वर्तमान_पता: PRE_ADD,

      //  स्थायी_पता: PER_ADD

        per_add: perAddParse.address,
        per_station: perAddParse.station_name,
        per_district: perAddParse.district,
        per_state: perAddParse.state,
    });

  }

else {
    // Neither address belongs to this district
}
     
    }

    console.log('\n=================== CONVERTED EXCEL JSON DATA ===================');
    console.log('Headers detected at row index', headerRowIdx, ':', headers);
    //  console.log(JSON.stringify(jsonResult, null, 2));

    console.log(differentAddresses);
    console.log("Different address count:", differentAddressCount);
    console.log(`Total Records Converted: ${jsonResult.length}`);
    console.log('=================================================================\n');

    res.json({
      message: `${jsonResult.length} records converted to JSON and logged to backend console`,
      totalRecords: jsonResult.length,
      data: jsonResult
    });
  } catch (err) {
    console.error('Upload conversion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper for dashboard queries (handles case if `ps` table is missing in MySQL)
const getPsSource = async () => {
  try {
    await pool.execute('SELECT 1 FROM `ps` LIMIT 1');
    return 'ps';
  } catch (e) {
    return '(SELECT DISTINCT `थाना`, NULL as CUG FROM `characters` WHERE `थाना` IS NOT NULL AND `थाना` <> \'\') ps';
  }
};

// ─── GET /api/characters/dashboard ───────────────────────────────────────────
// Replaces ajax/ajax_dashboard.php — default view (all dates)
router.get('/dashboard', async (req, res) => {
  try {
    const psSource = await getPsSource();
    const query = `
      SELECT ps.CUG, ps.थाना, c_total, c_station, c_liu, c_dcrb, c_dcp, c_remain, mn, mx
      FROM ${psSource}
      LEFT JOIN (
        SELECT थाना, COUNT(थाना) c_total, MIN(अनुरोध_दिनांक) mn, MAX(अनुरोध_दिनांक) mx
        FROM characters GROUP BY थाना
      ) t ON t.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_station, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})
        GROUP BY थाना
      ) s ON s.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_liu, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})
        GROUP BY थाना
      ) liu ON liu.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcrb, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})
        GROUP BY थाना
      ) dcrb ON dcrb.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcp, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})
        GROUP BY थाना
      ) dcp ON dcp.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_remain, थाना FROM characters
        WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')
        GROUP BY थाना
      ) rmain ON rmain.थाना = ps.थाना
      ORDER BY ps.थाना
    `;
    const params = [...PS_STATUSES, ...LIU_STATUSES, ...DCRB_STATUSES, ...DCP_STATUSES];
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/characters/dashboard ──────────────────────────────────────────
// Replaces ajax/ajax_dashboardUpdate.php — filtered by date range
router.post('/dashboard', async (req, res) => {
  try {
    const { sdate, edate } = req.body;
    if (!sdate || !edate) return res.status(400).json({ error: 'sdate and edate required' });

    const psSource = await getPsSource();
    const query = `
      SELECT ps.CUG, ps.थाना, c_total, c_station, c_liu, c_dcrb, c_dcp, c_remain
      FROM ${psSource}
      LEFT JOIN (
        SELECT थाना, COUNT(थाना) c_total FROM characters
        WHERE अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) t ON t.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_station, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) s ON s.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_liu, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) liu ON liu.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcrb, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) dcrb ON dcrb.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcp, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) dcp ON dcp.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_remain, थाना FROM characters
        WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) remain ON remain.थाना = ps.थाना
      ORDER BY ps.थाना
    `;
    const params = [
      sdate, edate,
      ...PS_STATUSES, sdate, edate,
      ...LIU_STATUSES, sdate, edate,
      ...DCRB_STATUSES, sdate, edate,
      ...DCP_STATUSES, sdate, edate,
      sdate, edate,
    ];
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Dashboard update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/characters/pending?loc= ────────────────────────────────────────
// Replaces ajax/ajax_pendingChar.php — characters list page
router.get('/pending', async (req, res) => {
  try {
    const { loc } = req.query;
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
    console.error('Pending char error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/characters/details?loc=&ps=&sdate=&edate=&cug= ─────────────────
// Replaces ajax/ajax_pendingDetails.php — detail page
router.get('/details', async (req, res) => {
  try {
    const { loc, ps, sdate, edate } = req.query;
    let query = '';
    let params = [];

    const psFilter   = ps ? ' AND थाना = ?' : '';
    const dateFilter = sdate && edate ? ' AND अनुरोध_दिनांक BETWEEN ? AND ?' : '';
    const psParam    = ps ? [ps] : [];
    const dateParam  = sdate && edate ? [sdate, edate] : [];

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
    console.error('Details error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/characters/remain?ps=&sdate=&edate= ────────────────────────────
// Replaces ajax/ajax_remain.php
router.get('/remain', async (req, res) => {
  try {
    const { ps, sdate, edate } = req.query;
    if (!ps || !sdate || !edate) return res.status(400).json({ error: 'ps, sdate, edate required' });

    const [rows] = await pool.execute(
      `SELECT * FROM characters WHERE थाना = ? AND अनुरोध_दिनांक BETWEEN ? AND ? AND अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`,
      [ps, sdate, edate]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.STATUS_MAP = STATUS_MAP;


function parseAddress(fullAddress, district) {
    let str = fullAddress.trim();

    // Remove state
    str = str.replace(/\s*उत्तर प्रदेश\s*$/, "").trim();

    // Remove district
    str = str.replace(district, "").trim();

    // Station is the last Hindi words
    const match = str.match(/([\u0900-\u097F\s]+)$/);

    let station_name = "";
    let address = str;

    if (match) {
        station_name = match[1].trim();
        address = str.slice(0, match.index).trim();
    }

    return {
        address,
        station_name,
        district,
        state: "उत्तर प्रदेश"
    };
}
