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
  let districtName = "";

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

  // Continue processing...
  if (isEnglishFormat) {
    console.log("English format detected.");

    for (let i = 0; i < headerRowIdx; i++) {
      const titleStr = (rows[i] || [])
        .map((c) => String(c || "").trim())
        .join(" ");
      if (
        titleStr.includes("जनपद") ||
        titleStr.toLowerCase().includes("district")
      ) {
        titleDistrict = titleStr;
        break;
      }
    }
    console.log("Detected titleDistrict: ", titleDistrict);
    districtName = titleDistrict.replace(/^जनपद-\s*/, "").trim();

  }

  if (isHindiFormat) {
    console.log("Hindi format detected.");
  }

  if (isHindiFormat2) {
    console.log("Hindi format 2 detected.");
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

console.log("Detected district name: ", districtName);



  const [stationDistrictList] = await pool.execute(`SELECT 
            district_.code AS district_code,
            district_.name AS district_name,
            district_.hindi_name as district_hindi_name,
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
        district_code: row.district_code,
        district_name: row.district_name,
        district_hindi_name: row.district_hindi_name,
        stations: new Map(),
      });
    }

    districtMap.get(districtKey).stations.set(
      row.station_hindi_name.trim(),
      {
        station_code: row.station_code,
        station_name: row.station_name, // English
        station_hindi_name: row.station_hindi_name,
      },
    );
  }

  // console.log("districtMap size: ", districtMap);

  let [districts] = await pool.execute(
    "select * from district_ WHERE hindi_name IS NOT NULL AND r_id IS NOT NULL AND hindi_name = ? ",
    [districtName],
  );

  if (districts.length === 0) {
    // Fallback search by wildcard or default to Agra district
    const [fallbackDistricts] = await pool.execute(
      "select * from district_ WHERE hindi_name IS NOT NULL AND r_id IS NOT NULL LIMIT 1"
    );
    if (fallbackDistricts.length > 0) {
      districts = fallbackDistricts;
    } else {
      throw new Error(`District not found: ${districtName}`);
    }
  }

  console.log(districts[0]);
  console.log("district code ", districts[0].code);
  let district_code = districts[0].code;
  let district_name = districts[0].name;
  const [getStationList] = await pool.execute(
    "SELECT * FROM station_ WHERE district_code = ?",
    [district_code],
  );
  // console.log(getStationList);

  const stationMap = new Map(
    getStationList.map((station) => [
      station.hindi_name.trim(),
      {
        code: station.code,
        name: station.name,
      },
    ]),
  );

  // const headers = rows[headerRowIdx];
  // const dataRows = rows.slice(headerRowIdx + 1);

  const jsonResult = [];
  const differentAddressesPre = [];
  const differentAddressesPer = [];

  let addressCounts = 0;
  let differentAddressCountPRE = 0;
  let differentAddressCountPER = 0;

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
    let DIST = getCell("जनपद", "district") || districtName;
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
    let Current_Status = getCell("Current Status",'अनुरोध की स्थिति');
     Current_Status = getStatusCode(Current_Status);

    if (!ACK && !PS && !NAME) continue;

    const rawDateIdx = headers.findIndex((h) => {
      const key = String(h || "")
        .trim()
        .toLowerCase();
      return key.includes("date") || key.includes("अनुरोध दिनांक");
    });

    const rawDateVal = rawDateIdx >= 0 ? row[rawDateIdx] : ACKDAT;
    let ACKDATE = null;
    // console.log("rawDateVal: ", rawDateVal, "ACKDAT: ", ACKDAT);
    let stationCode = null;
    let stationName = null;
    if(hindiHeaders){
     ACKDATE = parseExcelDate(rawDateVal) || ACKDAT;
      // console.log("inside hindiHeaders : ",getDistrictStationDetails(districtMap, DIST, PS ));
     let districtStationDetails = getDistrictStationDetails(districtMap, DIST, PS );  
     stationCode = districtStationDetails.station_code;
     stationName = districtStationDetails.station_name;  
     district_name = districtStationDetails.district_name;
     district_code = districtStationDetails.district_code; 
    } else if(englishHeaders){
      ACKDATE = convertDate(rawDateVal) || ACKDAT;
         stationCode = stationMap.get(PS)?.code;
         stationName = stationMap.get(PS)?.name;
    }
    // const preAddParse = parseAddress(PRE_ADD, districtName);
    const preAddParse = findAddressDetails(PRE_ADD, districtMap);
    // console.log(" PER_ADD ", PER_ADD);
    const perAddParse = findAddressDetails(PER_ADD, districtMap);

    // console.log(findAddressDetails(PER_ADD,districtMap) );
  

    jsonResult.push({
      station_hindi_name: PS,
      station_Name: stationName,
      station_Code: stationCode,
      district_name: district_name,
      district_code: district_code,

      service: SERV,
      request_number: ACK,
      request_date: ACKDATE,
      applicant_name: NAME,
      Current_Status: Current_Status,

      present_address: PRE_ADD,
      pre_add: preAddParse.address,
      pre_station: preAddParse.station_name,
      pre_station_code: preAddParse.station_code,
      pre_district: preAddParse.district_name,
      pre_district_code: preAddParse.district_code,

      permanent_address: PER_ADD,
      per_add: perAddParse.address,
      per_station: perAddParse.station_name,
      per_station_code: perAddParse.station_code,
      per_district_name: perAddParse.district_name,
      per_district_code: perAddParse.district_code,
    });

    if (PER_ADD.includes(districtName) && PRE_ADD.includes(districtName)) {
      addressCounts++;
    } else if (
      !PER_ADD.includes(districtName) &&
      PRE_ADD.includes(districtName)
    ) {
      differentAddressCountPER++;
    } else if (
      PER_ADD.includes(districtName) &&
      !PRE_ADD.includes(districtName)
    ) {
      differentAddressCountPRE++;
    }
  }

  const differentAddressCount = differentAddressCountPRE + differentAddressCountPER;

  console.log(jsonResult);
  console.log("jsonResult.length ", jsonResult.length);
  console.log("differentAddressCountPRE ", differentAddressCountPRE);
  console.log("differentAddressCountPER ", differentAddressCountPER);
  console.log("addressCounts ", addressCounts);
  console.log("differentAddressCount ", differentAddressCount);


  await saveCharacters(jsonResult);

  return {
    headerRowIdx,
    headers,
    totalRecords: jsonResult.length,
    differentAddressCount,
    addressCounts,
    differentAddressCountPRE,
    differentAddressCountPER,
    jsonResult,
  };

};

const saveCharacters = async (data) => {

  if (!data.length) return;

  const sql = `
        INSERT INTO characters (
            station_hindi_name,
            station_name,
            station_code,
            district_name,
            district_code,
            request_number,
            request_date,
            applicant_name,
            current_status,
            present_address,
            pre_add,
            pre_station,
            pre_station_code,
            pre_district,
            pre_district_code,
            permanent_address,
            per_add,
            per_station,
            per_station_code,
            per_district_name,
            per_district_code
        )
        VALUES ?
        ON DUPLICATE KEY UPDATE
            current_status = VALUES(current_status),
            updated_at = CURRENT_TIMESTAMP
    `;

  const values = data.map(item => [
    item.station_hindi_name,
    item.station_Name,
    item.station_Code,
    item.district_name,
    item.district_code,
    item.request_number,
    item.request_date,
    item.applicant_name,
    item.Current_Status,
    item.present_address,
    item.pre_add,
    item.pre_station,
    item.pre_station_code,
    item.pre_district,
    item.pre_district_code,
    item.permanent_address,
    item.per_add,
    item.per_station,
    item.per_station_code,
    item.per_district_name,
    item.per_district_code
  ]);

  await pool.query(sql, [values]);
}


function getStatusCode(statusText) {
  const pending = [];

  // Police Station
  if (
    statusText.includes('पूछताछ अधिकारी समनुदेशन के लिए लंबित') ||
    statusText.includes('पूछताछ अधिकारी निरुपित')
  ) {
    pending.push('PS');
  }

  // DCRB
  if (
    statusText.includes('अस्वीकृत डी सी आर बी') ||
    statusText.includes('जमा करने के लिए लंबित डी सी आर बी')
  ) {
    pending.push('DCRB');
  }

  // LIU
  if (
    statusText.includes('अस्वीकृत एल आई यू') ||
    statusText.includes('जमा करने के लिए लंबित एल आई यू')
  ) {
    pending.push('LIU');
  }

  // SP/SSP (DCP)
  if (statusText.includes('एस.पी. / एस.एस.पी.से लंबित कार्यवाही')) {
    pending.push('DCP');
  }
  // Approved / Rejected
  if (statusText === 'स्वीकृत') {
    pending.push('APPROVED');
  }
  if (statusText === 'अस्वीकृत') {
    pending.push('REJECTED');
  }

  return pending.join('/');
}

module.exports = { parseExcelDate, processExcelBuffer, saveCharacters };
