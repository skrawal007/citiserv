const XLSX = require("xlsx");

// Create a dummy workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ["Date", "Request Number"],
  [new Date("2026-01-13"), 319573123456], // Date object and large number
  [45123, 319573123456] // Serial date and large number
]);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

// Read back
const workbook = XLSX.read(buf, { type: "buffer", cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log("With raw: false");
console.log(XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }));

console.log("\nWith raw: true");
console.log(XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, dateNF: "yyyy-mm-dd" }));
