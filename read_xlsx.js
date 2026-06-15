import * as XLSX from "xlsx";
import * as fs from "fs";

function dumpFile(path) {
  console.log(`\n=================== DUMPING ${path} ===================`);
  if (!fs.existsSync(path)) {
    console.log(`File ${path} does not exist`);
    return;
  }
  const fileBuffer = fs.readFileSync(path);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  console.log("Sheets in workbook:", workbook.SheetNames);
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    console.log(csv.substring(0, 1500)); // Print first 1500 chars
  });
}

try {
  dumpFile("../Finance.xlsx");
  dumpFile("../Final-April-2026-Sal-Structure-Minimum-Wage (1).xlsx");
} catch (err) {
  console.error("Error running dump script:", err);
}
