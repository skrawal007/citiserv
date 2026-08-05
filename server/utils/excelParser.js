const XLSX = require("xlsx");
const { parseAddress, findAddressDetails,getDistrictStationDetails } = require("./addressParser");
const { parseExcelDate,convertDate } = require("./dateConverter");
const { pool } = require("../database/db");

/**
 * Process Excel file buffer and return JSON result
 */
const processExcelBuffer = async (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  raw: true,
  defval: ""
});
  // Detect district title
  let titleDistrict = "";

  // Detect header row
  let headerRowIdx = 1;
  const headers = rows[headerRowIdx];
  const dataRows = rows.slice(headerRowIdx + 1);
  

  const headerRow = (rows[1] || []).map(h => String(h || "").trim());

  const englishHeaders = [
    "SNo.",
    "PS",
    "Application No",
    "Service Type",
    "Date",
    "Year",
    "Applicant Name",
    "Present Address",
    "Permanent Address",
    "Pending Days",
    "Current Status"
  ];

  const hindiHeaders = [
    "क्र0 सं0",
    "ज़ोन",
    "परिक्षेत्र",
    "जनपद",
    "थाना",
    "अनुरोध संख्या",
    "अनुरोध दिनांक",
    "अनुरोध की स्थिति",
    "आवेदक का नाम",
    "वर्तमान पता",
    "स्थायी पता"
  ];


    const hindiHeaders2 = [
    "क्रम संख्या",
    "ज़ोन",
    "परिक्षेत्र",
    "जनपद",
    "थाना",
    "अनुरोध संख्या",
    "अनुरोध दिनांक",
    "अनुरोध की स्थिति",
    "आवेदक का नाम",
    "वर्तमान पता",
    "स्थायी पता"
  ];
  const isEnglishFormat = englishHeaders.every(h => headerRow.includes(h));
  const isHindiFormat = hindiHeaders.every(h => headerRow.includes(h));
  const isHindiFormat2 = hindiHeaders2.every(h => headerRow.includes(h));


  if (!isEnglishFormat && ! isHindiFormat && !isHindiFormat2) {
    throw new Error("Invalid Excel format.");
  }

  if (rows.length < 2) {
    throw new Error("File is empty or has no data rows");
  }

  const knownHeaders = [
    "police station",
    "ps",
    "थाना",
    "service no",
    "application no",
    "अनुरोध",
    "district",
    "status",
    "sno",
    "s.no.",
    "date",
    "applicant name",
    "present address",
  ];

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = (rows[i] || [])
      .map((c) => String(c || "").toLowerCase())
      .join(" ");
    if (knownHeaders.some((k) => rowStr.includes(k))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) headerRowIdx = 1;

  const [stationDistrictList] = await pool.execute(`
          SELECT 
            district_.id AS district_id,
            district_.code AS district_code,
            district_.name AS district_name,
            district_.hindi_name as district_hindi_name,
            station_.id AS station_id,
            station_.code AS station_code,
            station_.name AS station_name,
            station_.hindi_name AS station_hindi_name
          FROM district_ 
            LEFT JOIN station_ ON station_.district_code = district_.code`);

  const districtMap = new Map();

  for (const row of stationDistrictList) {
    const districtKey = row.district_hindi_name.trim();

    if (!districtMap.has(districtKey)) {
      districtMap.set(districtKey, {
        district_id: row.district_id,
        district_code: row.district_code,
        district_name: row.district_name,
        district_hindi_name: row.district_hindi_name,
        stations: new Map(),
      });
    }

    districtMap.get(districtKey).stations.set(
      row.station_hindi_name.trim(),
      {
        station_id: row.station_id,
        station_code: row.station_code,
        station_name: row.station_name, // English
        station_hindi_name: row.station_hindi_name,
      },
    );
  }


  const jsonResult = [];

  let addressCounts = 0;
  let differentAddressCount = 0;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    // console.log("Processing row: ", row);

    const getCell = (...keys) => {
      for (const key of keys) {
        const idx = headers.findIndex((h) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u0900-\u097F]/g, "")
            .includes(key.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "")),
        );
        if (
          idx >= 0 &&
          row[idx] !== undefined &&
          row[idx] !== null &&
          String(row[idx]).trim() !== ""
        ) {
          return String(row[idx]).trim();
        }
      }
      return "";
    };

    let SNO = getCell("sno", "s.no", "क्र0सं0", "क्रम संख्या");
    let DIST = getCell("जनपद", "district");
    let PS = getCell("ps", "थाना", "police station");
    let ACK = getCell(
      "application no",
      "service no",
      "अनुरोध संख्या",
      "applicationno",
      "serviceno",
      
    );
    let SERV = getCell("service type", "service", "सेवा", "servicetype");
    let ACKDAT = getCell("date", "अनुरोध दिनांक");
    let NAME = getCell(
      "applicant name",
      "आवेदक का नाम",
      "applicantname",
      "name",
    );
    let PRE_ADD = getCell(
      "present address",
      "वर्तमान पता",
      "presentaddress",
      "current address",
    );
    let PER_ADD = getCell(
      "permanent address",
      "स्थायी पता",
      "permanentaddress",
    );
    // let DAYS = getCell("pending days", "लम्बित दिन", "pendingdays");
    let Current_Status = getCell("Current Status",'अनुरोध की स्थिति').replace(/\s+/g, '').trim();
    let pre_Current_Status = null;
    let per_Current_Status = null;
    
    if (!Current_Status.includes("स्थायीपता")) {
      pre_Current_Status = getStatusCode(Current_Status);
    } else {

      // console.log("Current_Status includes स्थायी पता :-", Current_Status);

      let { presentAddress, permanentAddress } = getSepareteStatus(Current_Status);

      pre_Current_Status = getStatusCode(presentAddress);
      per_Current_Status = getStatusCode(permanentAddress);

      // console.log("ACK ", ACK);
      // console.log("Current_Status includes", Current_Status);
      // console.log("presentAddress:", presentAddress);
      // console.log("pre_Current_Status:", pre_Current_Status);
      // console.log("permanentAddress:", permanentAddress);
      // console.log("per_Current_Status:", per_Current_Status);
    }

    if (!ACK && !PS && !NAME) continue;

    const rawDateIdx = headers.findIndex((h) => {
      const key = String(h || "")
        .trim()
        .toLowerCase();
      return key.includes("date") || key.includes("अनुरोध दिनांक");
    });

    const rawDateVal = rawDateIdx >= 0 ? row[rawDateIdx] : ACKDAT;
    let ACKDATE = null;
    
    if(hindiHeaders){
     ACKDATE = parseExcelDate(rawDateVal) || ACKDAT;
      } else if(englishHeaders){
      ACKDATE = convertDate(rawDateVal) || ACKDAT;
    }
    const preAddParse = findAddressDetails(PRE_ADD, districtMap);    
    const perAddParse = findAddressDetails(PER_ADD, districtMap);

    jsonResult.push({

      service: SERV,
      request_number: ACK,
      request_date: ACKDATE,
      applicant_name: NAME,
      
      Current_Status: Current_Status,
      pre_Current_Status: pre_Current_Status,
      per_Current_Status: per_Current_Status,
      
      present_address: PRE_ADD,
      pre_add: preAddParse.address,
      pre_station_id: preAddParse.station_id,
      pre_station_code: preAddParse.station_code,
      pre_station_name: preAddParse.station_name,
      pre_district_id: preAddParse.district_id,
      pre_district_code: preAddParse.district_code,
      pre_district_name: preAddParse.district_name,

      permanent_address: PER_ADD,
      per_add: perAddParse.address,
      per_station_id: perAddParse.station_id,
      per_station_code: perAddParse.station_code,
      per_station_name: perAddParse.station_name,
      per_district_id: perAddParse.district_id,
      per_district_code: perAddParse.district_code,
      per_district_name: perAddParse.district_name,
    
    });

    if (perAddParse.station_code === preAddParse.station_code) {
      addressCounts++;
    } else if (perAddParse.station_code !== preAddParse.station_code) {
      differentAddressCount++;
    } 
  }

  console.log(jsonResult);
  console.log("jsonResult.length ", jsonResult.length);
  console.log("addressCounts ", addressCounts);
  console.log("differentAddressCount ", differentAddressCount);


  await saveCharacters(jsonResult);

  return {
    headerRowIdx,
    headers,
    totalRecords: jsonResult.length,
    addressCounts,
    differentAddressCount,
    jsonResult,
  };

};

const saveCharacters = async (data) => {

  if (!data.length) return;



  const sql = `
        INSERT INTO characters (
            service,
            request_number,
            request_date,
            applicant_name,
            
            present_address,
            pre_add,
            pre_station_id, 
            pre_station_code,
            pre_station,
            pre_district_id,
            pre_district_code,
            pre_district,
        
            permanent_address, 
            per_add,
            per_station_id,
            per_station_code,
            per_station,
            per_district_id,
            per_district_code,
            per_district_name,
            pre_Current_Status,
            per_Current_Status
         
        
            )
        VALUES ?
        ON DUPLICATE KEY UPDATE
            pre_Current_Status = VALUES(pre_Current_Status),
            per_Current_Status = VALUES(per_Current_Status),
            updated_at = CURRENT_TIMESTAMP
    `;

const values = data.map(item => [
  item.service,
  item.request_number,
  item.request_date,
  item.applicant_name,

  item.present_address,
  item.pre_add,
  item.pre_station_id,
  item.pre_station_code,
  item.pre_station_name,
  item.pre_district_id,
  item.pre_district_code,
  item.pre_district_name,

  item.permanent_address,
  item.per_add,
  item.per_station_id,
  item.per_station_code,
  item.per_station_name,
  item.per_district_id,
  item.per_district_code,
  item.per_district_name,

  item.pre_Current_Status,
  item.per_Current_Status
]);

  await pool.query(sql, [values]);
}

function getStatusCode(statusText) {
  let cleanedStatus = statusText.replace(/\s+/g, '').trim()
    if (
    statusText.includes('वर्तमानपता:-') ||
    statusText.includes('स्थायीपता:-')
  ) {
    cleanedStatus = statusText
      .replace(/वर्तमानपता\s*:-/g, '')
      .replace(/स्थायीपता\s*:-/g, '')
      .trim();
  }
    if (!cleanedStatus) {
    return '';
  }
  const STATUS_MAP = {
    
'(पूछताछअधिकारीनिरुपित/स्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCP',

'(पूछताछअधिकारीनिरुपित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCRB/LIU/DCP',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/जमाकरनेकेलिएलंबितएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCRB/LIU/DCP',

'(पूछताछअधिकारीनिरुपित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/जमाकरनेकेलिएलंबितएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCRB/LIU/DCP',

'(पुलिसस्टेशनद्वारासत्यापनपूर्णकियागया/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'DCRB/DCP',

'(पुलिसस्टेशनद्वारासत्यापनपूर्णकियागया/स्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'DCP',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCRB/DCP',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/स्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCP',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/अस्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही': 'PS/DCP',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)': 'PS/DCRB',

'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/जमाकरनेकेलिएलंबितएलआईयूद्वारा)': 'PS/DCRB/LIU',
'(पुलिसस्टेशनद्वारासत्यापनपूर्णकियागया/जमाकरनेकेलिएलंबितडीसीआरबीद्वारा/जमाकरनेकेलिएलंबितएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही':'DCRB/LIU/DCP',
'(पुलिसस्टेशनद्वारासत्यापनपूर्णकियागया/अस्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)-औरएस.पी./एस.एस.पी.सेलंबितकार्यवाही':'DCP',
'(पूछताछअधिकारीसमनुदेशनकेलिएलंबित/स्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)':"PS",
'(पुलिसस्टेशनद्वारासत्यापनपूर्णकियागया/स्वीकृतडीसीआरबीद्वारा/स्वीकृतएलआईयूद्वारा)':'APPROVED',
'स्वीकृत': 'APPROVED',
'अस्वीकृत': 'REJECTED',
};
  return STATUS_MAP[cleanedStatus] || 'ok';
}

function getSepareteStatus(text) {
    const parts = text.split("-");
console.log("parts length  ", parts.length);
// console.log("part[1]", parts[1]);
// console.log("part[2]", parts[2]);
// console.log("part[3]", parts[3]);
// console.log("part[4]", parts[4]);
// console.log("part[5]", parts[5]);
    if (parts.length < 4) {
        return {
            presentAddress: "",
            permanentAddress: ""
        };
    }

    const presentAddress = `${parts[1]}-${parts[4]}`;

    const permanentAddress = `${parts[3]}`;

    return {
        presentAddress,
        permanentAddress
    };
}
module.exports = { parseExcelDate, processExcelBuffer, saveCharacters };
