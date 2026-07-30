const XLSX = require('xlsx');
const { parseAddress } = require('./addressParser');
const {pool} =require("../database/db");

/**
 * Convert Excel date string (DD/MM/YYYY) to YYYY-MM-DD
 */
function parseExcelDate(input) {
  if (!input) return null;
  const [date] = String(input).trim().split(' ');
  const parts = date.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return input;
}

/**
 * Process Excel file buffer and return JSON result
 */
const processExcelBuffer= async (fileBuffer)=> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) {
    throw new Error('File is empty or has no data rows');
  }

  // Detect header row
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

  // Detect district title
  let titleDistrict = '';
  for (let i = 0; i < headerRowIdx; i++) {
    const titleStr = (rows[i] || []).map(c => String(c || '').trim()).join(' ');
    if (titleStr.includes('जनपद') || titleStr.toLowerCase().includes('district')) {
      titleDistrict = titleStr;
      break;
    }
  }

  const districtName = titleDistrict.split('-')[1]?.trim() || '';


    const connection = await pool.getConnection();
    const [districts]= await pool.execute("select * from district_ WHERE hindi_name IS NOT NULL AND r_id IS NOT NULL AND hindi_name = ? ",[districtName]);
    
  if (districts.length === 0) {
      throw new Error(`District not found: ${districtName}`);
  }

    console.log(districts[0]);
    console.log("district code ",districts[0].code);
    const district_code =districts[0].code;
    const district_name =districts[0].name;
    const [getStationList]= await pool.execute("SELECT * FROM station_ WHERE district_code = ?", [district_code]);
    console.log(getStationList);

//     const stationMap = new Map(
//     getStationList.map(station => [
//         station.hindi_name.trim(),
//         station.code,
//         station.name,
//     ])
// );

const stationMap = new Map(
    getStationList.map(station => [
        station.hindi_name.trim(),
        {
            code: station.code,
            name: station.name
        }
    ])
);


  const headers = rows[headerRowIdx];
  const dataRows = rows.slice(headerRowIdx + 1);

  const jsonResult = [];
  const differentAddresses = [];
  let differentAddressCount = 0;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const getCell = (...keys) => {
      for (const key of keys) {
        const idx = headers.findIndex(h =>
          String(h || '').trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '').includes(key.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, ''))
        );
        if (idx >= 0 && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
          return String(row[idx]).trim();
        }
      }
      return '';
    };

    let SNO = getCell('sno', 's.no', 'क्र0सं0');
    let DIST = getCell('जनपद', 'district') || districtName;
    let PS = getCell('ps', 'थाना', 'police station');
    let ACK = getCell('application no', 'service no', 'अनुरोध संख्या', 'applicationno', 'serviceno');
    let SERV = getCell('service type', 'service', 'सेवा', 'servicetype');
    let ACKDAT = getCell('date', 'अनुरोध दिनांक');
    let NAME = getCell('applicant name', 'आवेदक का नाम', 'applicantname', 'name');
    let PRE_ADD = getCell('present address', 'वर्तमान पता', 'presentaddress', 'current address');
    let PER_ADD = getCell('permanent address', 'स्थायी पता', 'permanentaddress');
    let DAYS = getCell('pending days', 'लम्बित दिन', 'pendingdays');
    let Current_Status = getCell('Current Status');
    if (!ACK && !PS && !NAME) continue;

    const rawDateIdx = headers.findIndex(h => {
      const key = String(h || '').trim().toLowerCase();
      return key.includes('date') || key.includes('अनुरोध दिनांक');
    });

    const rawDateVal = rawDateIdx >= 0 ? row[rawDateIdx] : ACKDAT;
    const ACKDATE = parseExcelDate(rawDateVal) || ACKDAT;

    if (PER_ADD.includes(districtName) && PRE_ADD.includes(districtName)) {
      const perAddParse = parseAddress(PER_ADD, districtName);
      const preAddParse = parseAddress(PRE_ADD, districtName);

      jsonResult.push({
        SNo: SNO,
        station: PS,
        service : SERV,
        request_number: ACK,
        request_date: ACKDATE,
        applicant_name : NAME,
        
        pre_add: preAddParse.address, 
        pre_station: preAddParse.station_name,
        per_add: perAddParse.address,
        per_station: perAddParse.station_name,

        pending_days: DAYS,
        district_code: district_code,
        district_name : district_name,
        Current_Status: Current_Status,
      });
    } else if (!PER_ADD.includes(districtName) && PRE_ADD.includes(districtName)) {
      differentAddressCount++;
      const preAddParse = parseAddress(PRE_ADD, districtName);

      differentAddresses.push({
        district: DIST,
        station: PS,
        सेवा: SERV,
        आवेदन_संख्या: ACK,
        अनुरोध_दिनांक: ACKDATE,
        आवेदक: NAME,
        pre_add: preAddParse.address,
        pre_station: preAddParse.station_name,
        pre_district: preAddParse.district,
        pre_state: preAddParse.state,
        स्थायी_पता: PER_ADD,
      });
    } else if (PER_ADD.includes(districtName) && !PRE_ADD.includes(districtName)) {
      differentAddressCount++;
      const perAddParse = parseAddress(PER_ADD, districtName);

      differentAddresses.push({
        district: DIST,
        station: PS,
        सेवा: SERV,
        आवेदन_संख्या: ACK,
        अनुरोध_दिनांक: ACKDATE,
        आवेदक: NAME,
        वर्तमान_पता: PRE_ADD,
        per_add: perAddParse.address,
        per_station: perAddParse.station_name,
        per_district: perAddParse.district,
        per_state: perAddParse.state,
      });
    }
  }

  // console.log(differentAddresses);
  console.log("differentAddresses length ", differentAddresses.length)
  // console.log(jsonResult);



const updatedData = jsonResult.map(item => {
    const {
        station,
        pre_station,
        per_station,
        ...rest
    } = item;

    return {
        ...rest,

        pre_station_code: stationMap.get(pre_station?.trim())?.code || null,
        pre_station_name: stationMap.get(pre_station?.trim())?.name || null,

        per_station_code: stationMap.get(per_station?.trim())?.code || null,
        per_station_name: stationMap.get(per_station?.trim())?.name || null,
    };
});


// console.log(updatedData);
  return {
    headerRowIdx,
    headers,
    totalRecords: jsonResult.length,
    differentAddressCount,
    differentAddresses,
    jsonResult,
  };
}

module.exports = { parseExcelDate, processExcelBuffer };
