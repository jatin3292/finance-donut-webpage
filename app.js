(() => {
  const DEFAULT_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjAAosaSk5NszFc4fq0m25Qni_eWD32A9umQmrmze7PmMkF13hJvXzgy64F7FHQfxIHqyT7WNeUEI_/pub?output=xlsx";
  let monthsData = [];
  let chartInstance = null;

  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  const status = document.getElementById("status");
  const resultCard = document.getElementById("resultCard");
  const monthSelect = document.getElementById("monthSelect");
  const incomeVal = document.getElementById("incomeVal");
  const expenseVal = document.getElementById("expenseVal");
  const netVal = document.getElementById("netVal");
  const legendEl = document.getElementById("legend");

  // Savings Insights DOM elements
  const savingsBtn = document.getElementById("savingsBtn");
  const savingsPanel = document.getElementById("savingsPanel");
  const closePanelBtn = document.getElementById("closePanelBtn");
  const monthlySavingsVal = document.getElementById("monthlySavingsVal");
  const savingsRateVal = document.getElementById("savingsRateVal");
  const savingsRateProgress = document.getElementById("savingsRateProgress");
  const cumulativeSavingsVal = document.getElementById("cumulativeSavingsVal");
  const savingsMessage = document.getElementById("savingsMessage");

  // Google Sheets URL Load DOM elements
  const sheetUrlInput = document.getElementById("sheetUrlInput");
  const loadUrlBtn = document.getElementById("loadUrlBtn");

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () =>
    dropzone.classList.remove("dragover"),
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  savingsBtn.addEventListener("click", () => {
    savingsPanel.classList.toggle("hidden");
  });
  closePanelBtn.addEventListener("click", () => {
    savingsPanel.classList.add("hidden");
  });

  loadUrlBtn.addEventListener("click", () => {
    const url = sheetUrlInput.value;
    loadFromGoogleSheet(url);
  });

  function convertGoogleSheetsUrl(url) {
    url = url.trim();
    if (!url) return null;

    // Case 1: Published to web link
    if (url.includes("/spreadsheets/d/e/")) {
      const pubIndex = url.indexOf("/pub");
      if (pubIndex !== -1) {
        const baseUrl = url.substring(0, pubIndex);
        return `${baseUrl}/pub?output=xlsx`;
      }
      const match = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://docs.google.com/spreadsheets/d/e/${match[1]}/pub?output=xlsx`;
      }
    }

    // Case 2: Standard sharing link
    if (url.includes("/spreadsheets/d/")) {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      }
    }

    return url;
  }

  function loadFromGoogleSheet(url) {
    const exportUrl = convertGoogleSheetsUrl(url);
    if (!exportUrl) {
      status.textContent = "Please enter a valid Google Sheets URL.";
      return;
    }

    status.textContent = "Fetching Google Sheet...";
    loadUrlBtn.disabled = true;
    sheetUrlInput.disabled = true;
    loadUrlBtn.textContent = "Loading...";

    // Append a unique timestamp to bypass both browser and Google CDN caching
    const cacheBusterUrl =
      exportUrl + (exportUrl.includes("?") ? "&" : "?") + "_cb=" + Date.now();

    fetch(cacheBusterUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => {
        try {
          const data = new Uint8Array(buffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null,
          });
          parseMonths(rows);
          if (monthsData.length === 0) {
            status.textContent =
              "Could not find any monthly data in this sheet.";
            resultCard.classList.add("hidden");
            return;
          }
          populateMonthSelect();
          status.innerHTML = `Loaded sheet from Google Sheets — ${monthsData.length} months found.`;
          resultCard.classList.remove("hidden");
        } catch (err) {
          status.textContent = "Error parsing spreadsheet: " + err.message;
          console.error(err);
        }
      })
      .catch((err) => {
        console.error(err);
        status.innerHTML = `
          <div style="color: var(--danger); margin-top: 10px; line-height: 1.5; text-align: left; background: #fee2e2; border: 1px solid #fca5a5; padding: 12px; border-radius: 8px;">
            <strong>Error Loading Google Sheet:</strong> Access was blocked (CORS) or the link is private.<br/><br/>
            To fix this, you must **Publish the sheet to the web**:
            <ol style="margin: 6px 0 0 20px; padding: 0;">
              <li>Open your Google Sheet.</li>
              <li>Click <strong>File > Share > Publish to web</strong>.</li>
              <li>Choose <strong>Entire Document</strong> and <strong>Microsoft Excel (.xlsx)</strong>.</li>
              <li>Click <strong>Publish</strong>.</li>
              <li>Copy the generated link and paste it here!</li>
            </ol>
          </div>
        `;
      })
      .finally(() => {
        loadUrlBtn.disabled = false;
        sheetUrlInput.disabled = false;
        loadUrlBtn.textContent = "Load Sheet";
      });
  }

  function handleFile(file) {
    status.textContent = "Reading file...";
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: null,
        });
        parseMonths(rows);
        if (monthsData.length === 0) {
          status.textContent = "Could not find any monthly data in this file.";
          resultCard.classList.add("hidden");
          return;
        }
        populateMonthSelect();
        status.textContent = `Loaded "${file.name}" — ${monthsData.length} months found.`;
        resultCard.classList.remove("hidden");
      } catch (err) {
        status.textContent = "Error reading file: " + err.message;
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseMonths(rows) {
    monthsData = [];
    let currentYear = null;
    let current = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const A = row[0];
      const B = row[1];
      const C = row[2];
      const D = row[3];

      if (A instanceof Date) {
        currentYear = A.getFullYear();
        continue;
      }

      const isMonthStart =
        typeof A === "string" &&
        A.trim() !== "" &&
        A.trim().toLowerCase() !== "total" &&
        typeof B === "number";

      if (isMonthStart) {
        if (current) monthsData.push(current);
        const yearLabel = currentYear ? ` ${currentYear}` : "";
        current = {
          label: `${A.trim()}${yearLabel}`,
          income: B,
          total: 0,
          categories: {},
        };
        if (currentYear && A.trim().toLowerCase() === "december") {
          currentYear += 1;
        }
      }

      if (!current) continue;

      const label = typeof C === "string" ? C.trim() : "";
      if (label.toLowerCase() === "total") {
        if (typeof D === "number") current.total = D;
        continue;
      }

      if (typeof D === "number" && label) {
        current.categories[label] = (current.categories[label] || 0) + D;
      }
    }
    if (current) monthsData.push(current);

    monthsData = monthsData.filter((m) => Object.keys(m.categories).length > 0);
  }

  function populateMonthSelect() {
    monthSelect.innerHTML = "";
    monthsData.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m.label;
      monthSelect.appendChild(opt);
    });
    monthSelect.value = monthsData.length - 1;
    renderChart(monthsData.length - 1);
  }

  monthSelect.addEventListener("change", (e) =>
    renderChart(parseInt(e.target.value, 10)),
  );

  const PALETTE = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ac",
    "#86bcb6",
    "#d37295",
    "#fabfd2",
    "#b6992d",
    "#499894",
  ];

  function inr(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function renderChart(index) {
    const month = monthsData[index];
    if (!month) return;

    const entries = Object.entries(month.categories).sort(
      (a, b) => b[1] - a[1],
    );
    const labels = entries.map((e) => e[0]);
    const values = entries.map((e) => e[1]);
    const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);
    const sumExpense = values.reduce((a, b) => a + b, 0);

    incomeVal.textContent = inr(month.income);
    expenseVal.textContent = inr(sumExpense);

    const net = month.income - sumExpense;
    netVal.textContent = inr(net);
    if (net < 0) {
      netVal.classList.add("negative");
    } else {
      netVal.classList.remove("negative");
    }

    // Update Savings Insights values
    monthlySavingsVal.textContent = inr(net);
    if (net < 0) {
      monthlySavingsVal.classList.add("negative");
    } else {
      monthlySavingsVal.classList.remove("negative");
    }

    const rate = month.income > 0 ? (net / month.income) * 100 : 0;
    savingsRateVal.textContent = `${rate.toFixed(1)}%`;

    if (rate < 0) {
      savingsRateVal.classList.add("negative");
      savingsRateProgress.classList.add("negative-bar");
      savingsRateProgress.style.width = "0%";
    } else {
      savingsRateVal.classList.remove("negative");
      savingsRateProgress.classList.remove("negative-bar");
      savingsRateProgress.style.width = `${Math.min(100, rate)}%`;
    }

    // Calculate Cumulative Savings
    let cumulativeSavings = 0;
    monthsData.forEach((m) => {
      const expenseSum = Object.values(m.categories).reduce((a, b) => a + b, 0);
      cumulativeSavings += m.income - expenseSum;
    });
    cumulativeSavingsVal.textContent = inr(cumulativeSavings);
    if (cumulativeSavings < 0) {
      cumulativeSavingsVal.classList.add("negative");
    } else {
      cumulativeSavingsVal.classList.remove("negative");
    }

    // Set insights message
    let msg = "";
    if (net < 0) {
      msg = `⚠️ <strong>Alert:</strong> Your expenses exceeded your income this month by <strong>${inr(Math.abs(net))}</strong>. Try reviewing high-cost categories to trim your budget.`;
    } else {
      if (rate >= 30) {
        msg = `🎉 <strong>Fantastic saving!</strong> You saved <strong>${rate.toFixed(1)}%</strong> of your income this month. You're building wealth rapidly!`;
      } else if (rate >= 15) {
        msg = `👍 <strong>Healthy savings!</strong> You saved <strong>${rate.toFixed(1)}%</strong> of your income. Keeping a 15-30% saving rate is an excellent financial habit.`;
      } else {
        msg = `💡 <strong>Room to grow:</strong> You saved <strong>${rate.toFixed(1)}%</strong> of your income. Check the breakdown above to see where you can optimize expenses.`;
      }
    }
    savingsMessage.innerHTML = msg;

    const ctx = document.getElementById("donut").getContext("2d");
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }],
      },
      options: { plugins: { legend: { display: false } }, cutout: "62%" },
    });

    legendEl.innerHTML = "";
    labels.forEach((label, i) => {
      const pct = ((values[i] / sumExpense) * 100).toFixed(1);
      const row = document.createElement("div");
      row.className = "row";

      const leftSpan = document.createElement("span");
      leftSpan.className = "left";

      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.backgroundColor = colors[i];

      leftSpan.appendChild(swatch);
      leftSpan.appendChild(document.createTextNode(label));

      const rightSpan = document.createElement("span");
      rightSpan.textContent = `${inr(values[i])} (${pct}%)`;

      row.appendChild(leftSpan);
      row.appendChild(rightSpan);
      legendEl.appendChild(row);
    });
  }

  // Initialization logic: load mock data or the default user sheet
  if (window.location.search.includes("mock=true")) {
    monthsData = [
      {
        label: "January 2026 (Negative Net)",
        income: 50000,
        categories: {
          Rent: 30000,
          Food: 15000,
          Utilities: 15000,
        },
      },
      {
        label: "February 2026 (Positive Net)",
        income: 60000,
        categories: {
          Rent: 30000,
          Food: 15000,
          Travel: 10000,
        },
      },
    ];
    setTimeout(() => {
      populateMonthSelect();
      resultCard.classList.remove("hidden");
      status.textContent = "Mock data loaded for testing.";
    }, 100);
  } else if (DEFAULT_SHEET_URL) {
    sheetUrlInput.value = DEFAULT_SHEET_URL;
    loadFromGoogleSheet(DEFAULT_SHEET_URL);

    // Auto-fetch fresh data every 5 minutes to keep the chart updated
    setInterval(
      () => {
        // Only auto-fetch if the user is still viewing the default sheet
        if (sheetUrlInput.value === DEFAULT_SHEET_URL) {
          loadFromGoogleSheet(DEFAULT_SHEET_URL);
        }
      },
      5 * 60 * 1000,
    );
  }
})();
