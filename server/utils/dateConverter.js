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
module.exports = { parseExcelDate };