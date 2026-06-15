import * as XLSX from "xlsx";

const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjAAosaSk5NszFc4fq0m25Qni_eWD32A9umQmrmze7PmMkF13hJvXzgy64F7FHQfxIHqyT7WNeUEI_/pub?output=xlsx";

async function inspect() {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    const buffer = await res.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: "array",
      cellDates: true,
    });

    const sheetNames = workbook.SheetNames;
    console.log("Sheet names in workbook:", sheetNames);
    const sheetName = sheetNames[0];
    console.log(`Dumping non-empty cells for sheet: "${sheetName}"`);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const parseCreditRows = (rows) => {
      if (!rows || rows.length === 0) return [];
      const credits = [];
      let inCreditSection = false;
      
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r] || [];
        const col8 = row[8];
        const col9 = row[9];
        
        if (typeof col8 === 'string') {
          const val = col8.trim().toLowerCase();
          if (val === 'credit') {
            inCreditSection = true;
            continue;
          }
          if (val === 'total' && inCreditSection) {
            break;
          }
        }
        
        if (inCreditSection) {
          if (col8 && typeof col9 === 'number' && col9 > 0) {
            credits.push({
              name: col8.toString().trim(),
              amount: col9
            });
          }
        }
      }
      return credits;
    };

    const parsedCredits = parseCreditRows(rows);
    console.log("Parsed Credits:", parsedCredits);
  } catch (err) {
    console.error("Error inspecting sheet:", err);
  }
}

inspect();
