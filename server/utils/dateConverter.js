/**
 * Convert Excel date (string, JS Date, or Excel serial number) to YYYY-MM-DD format
 */
function parseExcelDate(input) {
  if (input === null || input === undefined || input === '') return null;

  // 1. If JS Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. If Excel serial number (e.g. 45123)
  if (typeof input === 'number' || (!isNaN(input) && !String(input).includes('/') && !String(input).includes('-') && !String(input).includes('.'))) {
    const num = Number(input);
    if (num > 10000 && num < 100000) {
      const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
        const year = jsDate.getUTCFullYear();
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  const str = String(input).trim();

  // 3. Check for DD MMM YYYY (e.g., "01 Jan 2026")
  const ddMmmYyyyMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]{3,})\s+(\d{4})/);
  if (ddMmmYyyyMatch) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const [, day, monthStr, year] = ddMmmYyyyMatch;
    const month = months[monthStr.toLowerCase().substring(0, 3)];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  const dateOnly = str.split(' ')[0].trim();

  // 4. Check for YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = dateOnly.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 5. Check for DD/MM/YYYY, MM/DD/YYYY, or YY variations (e.g. "1/13/26")
  const ddmmyyyy = dateOnly.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (ddmmyyyy) {
    let [, part1, part2, year] = ddmmyyyy;
    if (year.length === 2) {
      year = `20${year}`;
    }
    
    let day, month;
    if (Number(part2) > 12) {
      // Must be MM/DD/YYYY format
      month = part1;
      day = part2;
    } else if (Number(part1) > 12) {
      // Must be DD/MM/YYYY format
      day = part1;
      month = part2;
    } else {
      // Default to DD/MM/YYYY for Indian dates if ambiguous
      day = part1;
      month = part2;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 6. Fallback to JS Date parsing
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
}

function convertDate(dateStr) {
  if (!dateStr) return null;

  dateStr = String(dateStr).trim();

  // Format: 7/24/26 or 07/24/2026 (MM/DD/YY or MM/DD/YYYY)
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/");

    const fullYear =
      year.length === 2 ? `20${year}` : year;

    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Format: 24 Jul 2026 or 01 Jan 2026
  const months = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const [day, month, year] = dateStr.split(/\s+/);

  if (!day || !month || !year) return null;

  return `${year}-${months[month.toLowerCase()]}-${day.padStart(2, "0")}`;
}

module.exports = { parseExcelDate, convertDate };