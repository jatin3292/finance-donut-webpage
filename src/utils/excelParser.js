export function convertGoogleSheetsUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.includes("/spreadsheets/d/e/")) {
    const pubIndex = trimmed.indexOf("/pub");
    if (pubIndex !== -1) {
      const baseUrl = trimmed.substring(0, pubIndex);
      return `${baseUrl}/pub?output=xlsx`;
    }
    const match = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return `https://docs.google.com/spreadsheets/d/e/${match[1]}/pub?output=xlsx`;
    }
  }

  if (trimmed.includes("/spreadsheets/d/")) {
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    }
  }

  return trimmed;
}

export function parseSalaryRows(rows) {
  if (!rows || rows.length < 2) return [];
  const parsed = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const year = row[0];
    const salary = row[1];
    if (typeof year === 'number' && typeof salary === 'number') {
      parsed.push({ year, salary });
    }
  }
  return parsed;
}

export function parseUdaipurSheet(rows) {
  if (!rows || rows.length < 2) return null;
  
  let title = "Udaipur Trip March 2025";
  for (let r = 0; r < Math.min(rows.length, 3); r++) {
    const row = rows[r] || [];
    const foundString = row.find(c => typeof c === 'string' && c.trim().toLowerCase().includes('udaipur'));
    if (foundString) {
      title = foundString.trim();
      break;
    }
  }

  const myExpenses = [];
  const combinedExpenses = [];
  const viratExpenses = [];

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] || [];
    
    const myVal = row[0];
    const myLabel = row[1];
    if (typeof myVal === 'number' && myVal > 0 && typeof myLabel === 'string' && myLabel.trim() !== '') {
      myExpenses.push({ amount: myVal, label: myLabel.trim() });
    }

    const combVal = row[2];
    const combLabel = row[3];
    if (typeof combVal === 'number' && combVal > 0 && typeof combLabel === 'string' && combLabel.trim() !== '') {
      combinedExpenses.push({ amount: combVal, label: combLabel.trim() });
    }

    const viratVal = row[4];
    const viratLabel = row[5];
    if (typeof viratVal === 'number' && viratVal > 0 && typeof viratLabel === 'string' && viratLabel.trim() !== '') {
      if (viratLabel.trim().toLowerCase() !== 'total') {
        viratExpenses.push({ amount: viratVal, label: viratLabel.trim() });
      }
    }
  }

  const myTotal = myExpenses.reduce((sum, item) => sum + item.amount, 0);
  const combinedTotal = combinedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const viratTotal = viratExpenses.reduce((sum, item) => sum + item.amount, 0);
  const splitAmount = combinedTotal / 2;
  const grandTotal = myTotal + combinedTotal + viratTotal;

  return {
    title,
    myExpenses,
    combinedExpenses,
    viratExpenses,
    myTotal,
    combinedTotal,
    viratTotal,
    splitAmount,
    grandTotal
  };
}

export function parseDuesSheet(rows) {
  if (!rows || rows.length < 3) return null;

  const lendedItems = [];
  let lendedTotal = 0;

  for (let r = 3; r <= 8; r++) {
    const row = rows[r] || [];
    const name = row[8];
    const amount = row[9];

    if (typeof name === 'string' && name.trim() !== '' && typeof amount === 'number' && amount > 0) {
      lendedItems.push({ name: name.trim(), amount });
      lendedTotal += amount;
    }
  }

  let dishankShouldBe = 0;
  let dishankCurrentlyThere = 0;
  let dishankDifference = 0;

  if (rows[2] && typeof rows[2][7] === 'number') {
    dishankShouldBe = rows[2][7];
  }
  if (rows[3] && typeof rows[3][7] === 'number') {
    dishankCurrentlyThere = rows[3][7];
  }
  if (rows[6] && typeof rows[6][7] === 'number') {
    dishankDifference = rows[6][7];
  } else {
    dishankDifference = Math.max(0, dishankShouldBe - dishankCurrentlyThere);
  }

  const lalumamaInstallments = [];
  let lalumamaTotal = 0;
  const others = [];
  let othersTotal = 0;

  for (let r = 14; r <= 18; r++) {
    const row = rows[r] || [];
    const dateVal = row[8];
    const amtVal = row[9];

    if (dateVal && typeof amtVal === 'number' && amtVal > 0) {
      let dateStr = "";
      if (dateVal instanceof Date) {
        dateStr = dateVal.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } else {
        dateStr = dateVal.toString();
      }
      lalumamaInstallments.push({ date: dateStr, amount: amtVal });
      lalumamaTotal += amtVal;
    }
  }

  for (let r = 14; r <= 16; r++) {
    const row = rows[r] || [];
    const nameVal = row[10];
    const amtVal = row[11];

    if (typeof nameVal === 'string' && nameVal.trim() !== '' && typeof amtVal === 'number' && amtVal > 0) {
      others.push({ name: nameVal.trim(), amount: amtVal });
      othersTotal += amtVal;
    }
  }

  let lalumamaRemains = 0;
  if (rows[14] && typeof rows[14][7] === 'number') {
    lalumamaRemains = rows[14][7];
  }

  let othersRemains = 0;
  if (rows[12] && typeof rows[12][10] === 'number') {
    othersRemains = rows[12][10];
  }

  return {
    title: "Dues & Accounts Summary",
    lended: {
      total: lendedTotal,
      items: lendedItems
    },
    dishank: {
      shouldBe: dishankShouldBe,
      currentlyThere: dishankCurrentlyThere,
      difference: dishankDifference
    },
    dues: {
      lalumamaTotal,
      lalumamaInstallments,
      lalumamaRemains,
      othersTotal,
      others,
    }
  };
}

export function parseCreditRows(rows) {
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
}

export function parseSheetRows(rows) {
  if (!rows || rows.length < 2) return [];

  const parsed = [];
  let currentYear = null;
  let current = null;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const A = row[0];
    const B = row[1];
    const C = row[2];
    const D = row[3];
    const E = row[4];

    if (A instanceof Date) {
      if (A.getMonth() === 11) {
        currentYear = A.getFullYear() + 1;
      } else {
        currentYear = A.getFullYear();
      }
      
      const hasDateSavings = typeof row[8] === "number";
      const hasDateVirat = typeof row[9] === "number";
      const hasDateMe = typeof row[10] === "number";

      if (hasDateSavings || (hasDateVirat && !current) || (hasDateMe && !current)) {
        if (current) {
          parsed.push(current);
          current = null;
        }
        const label = A.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        parsed.push({
          label,
          income: 0,
          savings: hasDateSavings ? row[8] : 0,
          virat: hasDateVirat ? row[9] : 0,
          me: hasDateMe ? row[10] : 0,
          categories: {},
          totalExpense: 0,
        });
      } else if (current) {
        if (hasDateVirat) current.virat += row[9];
        if (hasDateMe) current.me += row[10];
      }
      continue;
    }

    const isMonthStart =
      typeof A === "string" &&
      A.trim() !== "" &&
      A.trim().toLowerCase() !== "total" &&
      A.trim().toLowerCase() !== "grand total" &&
      !A.trim().toLowerCase().startsWith("total") &&
      typeof B === "number";

    if (isMonthStart) {
      if (current) {
        parsed.push(current);
      }
      const yearLabel = currentYear ? ` ${currentYear}` : "";
      current = {
        label: `${A.trim()}${yearLabel}`,
        income: B,
        savings: typeof E === "number" ? E : 0,
        virat: typeof row[9] === "number" ? row[9] : 0,
        me: typeof row[10] === "number" ? row[10] : 0,
        categories: {},
        totalExpense: 0,
      };
      
      if (currentYear && A.trim().toLowerCase() === "december") {
        currentYear += 1;
      }
    }

    if (!current) continue;

    const label = typeof C === "string" ? C.trim() : "";
    if (label.toLowerCase() === "total" || label.toLowerCase().startsWith("total")) {
      continue;
    }

    if (typeof D === "number" && label !== "") {
      current.categories[label] = (current.categories[label] || 0) + D;
    }

    if (!isMonthStart) {
      if (typeof row[9] === "number") current.virat += row[9];
      if (typeof row[10] === "number") current.me += row[10];
    }
  }
  
  if (current) {
    parsed.push(current);
  }

  parsed.forEach(m => {
    m.totalExpense = Object.values(m.categories).reduce((a, b) => a + b, 0);
  });

  return parsed.filter(
    (m) => Object.keys(m.categories).length > 0 || m.income > 0 || m.savings > 0 || m.virat > 0 || m.me > 0
  );
}
