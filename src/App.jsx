import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import StatsGrid from './components/StatsGrid';
import DonutChart from './components/DonutChart';
import SalaryHistoryCard from './components/SalaryHistoryCard';
import UdaipurTripCard from './components/UdaipurTripCard';
import DuesAccountsCard from './components/DuesAccountsCard';
import FinancialOverviewBar from './components/FinancialOverviewBar';

// Supabase services and client configuration
import { getSupabaseCredentials, isSupabaseConfigured } from './lib/supabaseClient';
import {
  fetchFullDashboardData,
  saveMonth,
  deleteMonth,
  saveSalary,
  deleteSalary,
  saveUdaipurItem,
  deleteUdaipurItem,
  saveLendedItem,
  deleteLendedItem,
  saveDishankShortfall,
  saveLalumamaInstallment,
  deleteLalumamaInstallment,
  saveOthersPayable,
  deleteOthersPayable,
  saveCredit,
  deleteCredit
} from './services/db';
import { migrateSheetsToSupabase } from './services/migration';

// CRUD Edit Modals
import { MonthModal, SalaryModal, UdaipurModal, DuesModal, SimpleCategoryModal } from './components/CrudModals';
import LockScreen from './components/LockScreen';

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjAAosaSk5NszFc4fq0m25Qni_eWD32A9umQmrmze7PmMkF13hJvXzgy64F7FHQfxIHqyT7WNeUEI_/pub?output=xlsx";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [monthsData, setMonthsData] = useState([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(-1);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('google_sheet_url') || DEFAULT_SHEET_URL);
  const [isLoading, setIsLoading] = useState(false);
  
  // Status can be: { type: 'info' | 'error' | 'success', text: string } or null
  const [status, setStatus] = useState({ type: 'info', text: 'Initializing...' });
  const [cumulativeSavings, setCumulativeSavings] = useState(0);
  const [cumulativeVirat, setCumulativeVirat] = useState(0);
  const [cumulativeMe, setCumulativeMe] = useState(0);
  const [salaryData, setSalaryData] = useState([]);
  const [udaipurData, setUdaipurData] = useState(null);
  const [duesData, setDuesData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0); // 0 = Monthly, 1 = Salaries, 2 = Udaipur Trip, 3 = Dues & Accounts

  // Supabase full-stack configuration states
  const [dataSource, setDataSource] = useState(() => localStorage.getItem('data_source') || 'sheets');
  const [showSettings, setShowSettings] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('supabase_anon_key') || '');
  const [isMigrating, setIsMigrating] = useState(false);

  // PIN Authorization states
  const [editPin, setEditPin] = useState(() => localStorage.getItem('edit_pin') || '');
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(() => !localStorage.getItem('edit_pin'));
  const hasEditPin = editPin.trim().length > 0;

  // CRUD Modal Selection states
  const [activeMonthModal, setActiveMonthModal] = useState(null); // month row or null
  const [activeSalaryModal, setActiveSalaryModal] = useState(null); // salary row or null
  const [activeTripModal, setActiveTripModal] = useState(null); // trip item or null
  const [activeDuesModal, setActiveDuesModal] = useState(null); // { type, item } or null
  const [activeShortfallModal, setActiveShortfallModal] = useState(null); // shortfall row or null
  const [activeCategoryModal, setActiveCategoryModal] = useState(null); // { month, categoryName } or null

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setCarouselIndex(prev => prev === 0 ? 3 : prev - 1);
      } else if (e.key === 'ArrowRight') {
        setCarouselIndex(prev => prev === 3 ? 0 : prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndXRef.current = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 50;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        setCarouselIndex(prev => prev === 3 ? 0 : prev + 1);
      } else {
        setCarouselIndex(prev => prev === 0 ? 3 : prev - 1);
      }
    }
  };

  const formatCurrency = (n) => {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  };

  const convertGoogleSheetsUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Case 1: Published to web link
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

    // Case 2: Standard sharing link
    if (trimmed.includes("/spreadsheets/d/")) {
      const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      }
    }

    return trimmed;
  };

  const parseSalaryRows = (rows) => {
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
  };

  const parseUdaipurSheet = (rows) => {
    if (!rows || rows.length < 2) return null;
    
    // Find the title (usually row 0)
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

    // Parse items from row index 2 onwards
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r] || [];
      
      // My Expenses (Col 0 and Col 1)
      const myVal = row[0];
      const myLabel = row[1];
      if (typeof myVal === 'number' && myVal > 0 && typeof myLabel === 'string' && myLabel.trim() !== '') {
        myExpenses.push({ amount: myVal, label: myLabel.trim() });
      }

      // Combined Shared Expenses (Col 2 and Col 3)
      const combVal = row[2];
      const combLabel = row[3];
      if (typeof combVal === 'number' && combVal > 0 && typeof combLabel === 'string' && combLabel.trim() !== '') {
        combinedExpenses.push({ amount: combVal, label: combLabel.trim() });
      }

      // Virat Expenses (Col 4 and Col 5)
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
  };

  const parseDuesSheet = (rows) => {
    if (!rows || rows.length < 3) return null;

    const lendedItems = [];
    let lendedTotal = 0;

    // Parse column 8 & 9 (Total Money Given) for rows 3 to 8 (stopping before row 9 which contains 'Total')
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
  };

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

  const parseSheetRows = (rows) => {
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
      const E = row[4]; // Savings

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

      // Parse expenses inside month
      const label = typeof C === "string" ? C.trim() : "";
      if (label.toLowerCase() === "total" || label.toLowerCase().startsWith("total")) {
        continue;
      }

      if (typeof D === "number" && label !== "") {
        current.categories[label] = (current.categories[label] || 0) + D;
      }

      // Sum up any Virat/Me values within the month block (except on month start which is already handled)
      if (!isMonthStart) {
        if (typeof row[9] === "number") current.virat += row[9];
        if (typeof row[10] === "number") current.me += row[10];
      }
    }
    
    if (current) {
      parsed.push(current);
    }

    // Now, let's calculate totalExpense for each parsed month
    parsed.forEach(m => {
      m.totalExpense = Object.values(m.categories).reduce((a, b) => a + b, 0);
    });

    return parsed.filter(
      (m) => Object.keys(m.categories).length > 0 || m.income > 0 || m.savings > 0 || m.virat > 0 || m.me > 0
    );
  };

  // const handleFileLoaded = (file) => {
  //   setStatus({ type: 'info', text: 'Reading file...' });
  //   setIsLoading(true);
  // 
  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     try {
  //       const data = new Uint8Array(e.target.result);
  //       const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  //       const sheet = workbook.Sheets[workbook.SheetNames[0]];
  //       const rows = XLSX.utils.sheet_to_json(sheet, {
  //         header: 1,
  //         defval: null,
  //       });
  //       const parsed = parseSheetRows(rows);
  // 
  //       if (parsed.length === 0) {
  //         setStatus({ type: 'error', text: 'Could not find any monthly data in this file.' });
  //         setMonthsData([]);
  //         setSelectedMonthIndex(-1);
  //         setCumulativeSavings(0);
  //         setCumulativeVirat(0);
  //         setCumulativeMe(0);
  //       } else {
  //         let totalSavings = 0;
  //         let totalVirat = 0;
  //         let totalMe = 0;
  // 
  //         parsed.forEach(m => {
  //           totalSavings += m.savings;
  //           totalVirat += m.virat;
  //           totalMe += m.me;
  //         });
  // 
  //         setMonthsData(parsed);
  //         setSelectedMonthIndex(parsed.length - 1);
  //         setCumulativeSavings(totalSavings);
  //         setCumulativeVirat(totalVirat);
  //         setCumulativeMe(totalMe);
  //         setStatus({ type: 'success', text: `Loaded "${file.name}" — ${parsed.length} months found.` });
  //       }
  //     } catch (err) {
  //       setStatus({ type: 'error', text: 'Error reading file: ' + err.message });
  //       console.error(err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  // 
  //   reader.readAsArrayBuffer(file);
  // };

  const loadData = async (source = dataSource, isBackground = false) => {
    if (source === 'mock') {
      const mockData = [
        {
          label: "January 2026",
          income: 50000,
          savings: 15000,
          virat: 5000,
          me: 4000,
          categories: {
            Rent: 15000,
            Food: 8000,
            Utilities: 3000,
            Travel: 5000
          },
          totalExpense: 31000
        },
        {
          label: "February 2026",
          income: 60000,
          savings: 18000,
          virat: 6000,
          me: 5000,
          categories: {
            Rent: 15000,
            Food: 9000,
            Utilities: 3000,
            Shopping: 9000
          },
          totalExpense: 36000
        }
      ];
      setMonthsData(mockData);
      setSelectedMonthIndex(mockData.length - 1);
      setCumulativeSavings(15000 + 18000);
      setCumulativeVirat(5000 + 6000);
      setCumulativeMe(4000 + 5000);
      const mockSalaryData = [
        { year: 2014, salary: 8000 },
        { year: 2015, salary: 19000 },
        { year: 2016, salary: 0 },
        { year: 2017, salary: 8000 },
        { year: 2018, salary: 0 },
        { year: 2019, salary: 18000 },
        { year: 2020, salary: 33000 },
        { year: 2021, salary: 22500 },
        { year: 2022, salary: 8000 },
        { year: 2023, salary: 30000 },
        { year: 2024, salary: 40000 },
        { year: 2025, salary: 50000 }
      ];
      setSalaryData(mockSalaryData);

      const mockUdaipurData = {
        title: "Udaipur Trip March 2025",
        myExpenses: [
          { amount: 100, label: "Rapido" },
          { amount: 50, label: "Toiletries" },
          { amount: 600, label: "Bags" },
          { amount: 1000, label: "Sweets" },
          { amount: 2150, label: "Gifts (Saree + Bangles)" },
          { amount: 500, label: "Gifts (Toys)" },
          { amount: 200, label: "Gift (Purse)" },
          { amount: 1800, label: "Clothes (For me)" }
        ],
        combinedExpenses: [
          { amount: 3750, label: "Hotel" },
          { amount: 1050, label: "Scooty" },
          { amount: 350, label: "Lunch 7/3" },
          { amount: 1000, label: "Booze" },
          { amount: 200, label: "Petrol 7/3" },
          { amount: 350, label: "Boat Ride 7/3" },
          { amount: 800, label: "Dinner 7/3" },
          { amount: 400, label: "Boat Ride 8/3" },
          { amount: 600, label: "Return Ticket" },
          { amount: 600, label: "Wax Museum" },
          { amount: 200, label: "Guide 8/3" },
          { amount: 300, label: "Folk dance" },
          { amount: 200, label: "Ropeway Karni Mata" },
          { amount: 200, label: "Snacks" },
          { amount: 850, label: "Dinner 8/3" },
          { amount: 250, label: "Breakfast 9/3" },
          { amount: 250, label: "Sahelio ki Badi + Guide" },
          { amount: 300, label: "Lunch 9/3" },
          { amount: 200, label: "Snacks" },
          { amount: 200, label: "Taxi" },
          { amount: 250, label: "Tickets" },
          { amount: 1300, label: "City Palace" }
        ],
        viratExpenses: [
          { amount: 1500, label: "Sadi" },
          { amount: 1500, label: "Misc" },
          { amount: 900, label: "Clothes" },
          { amount: 100, label: "Magnets" }
        ],
        myTotal: 6400,
        combinedTotal: 13600,
        viratTotal: 4000,
        splitAmount: 6800,
        grandTotal: 24000
      };
      setUdaipurData(mockUdaipurData);

      const mockDuesData = {
        title: "Dues & Accounts Summary",
        lended: {
          total: 17000,
          items: [
            { name: "Virat", amount: 17000 }
          ]
        },
        dishank: {
          shouldBe: 2171,
          currentlyThere: 171,
          difference: 2000
        },
        dues: {
          lalumamaTotal: 52000,
          lalumamaInstallments: [
            { date: "5/31/2025", amount: 10000 },
            { date: "6/30/2025", amount: 10000 },
            { date: "7/31/2025", amount: 10000 },
            { date: "8/31/2025", amount: 10000 },
            { date: "10/31/2025", amount: 12000 }
          ],
          lalumamaRemains: 13000,
          othersTotal: 38000,
          others: [
            { name: "Hakufai", amount: 8000 },
            { name: "Rammama", amount: 25000 },
            { name: "Sneh", amount: 5000 }
          ],
          othersRemains: 0
        },
        credit: [
          { name: "Recharge", amount: 2000 },
          { name: "Eating out", amount: 3000 },
          { name: "Movie", amount: 500 }
        ]
      };
      setDuesData(mockDuesData);
      setStatus({ type: 'success', text: 'Mock data loaded for testing.' });
      return;
    }

    if (source === 'sheets') {
      const exportUrl = convertGoogleSheetsUrl(sheetUrl);
      if (!exportUrl) {
        setStatus({ type: 'error', text: 'Please enter a valid Google Sheets URL.' });
        return;
      }

      if (!isBackground) {
        setStatus({ type: 'info', text: 'Fetching Google Sheet...' });
        setIsLoading(true);
      }

      const cacheBusterUrl = exportUrl + (exportUrl.includes("?") ? "&" : "?") + "_cb=" + Date.now();

      try {
        const response = await fetch(cacheBusterUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        const parsed = parseSheetRows(rows);

        let parsedSalaries = [];
        if (workbook.SheetNames.length > 3) {
          const salarySheet = workbook.Sheets[workbook.SheetNames[3]];
          const salaryRows = XLSX.utils.sheet_to_json(salarySheet, { header: 1, defval: null });
          parsedSalaries = parseSalaryRows(salaryRows);
        }

        let parsedUdaipur = null;
        if (workbook.SheetNames.length > 2) {
          const udaipurSheet = workbook.Sheets[workbook.SheetNames[2]];
          const udaipurRows = XLSX.utils.sheet_to_json(udaipurSheet, { header: 1, defval: null });
          parsedUdaipur = parseUdaipurSheet(udaipurRows);
        }

        let parsedDues = null;
        if (workbook.SheetNames.length > 1) {
          const duesSheet = workbook.Sheets[workbook.SheetNames[1]];
          const duesRows = XLSX.utils.sheet_to_json(duesSheet, { header: 1, defval: null });
          parsedDues = parseDuesSheet(duesRows);
          if (parsedDues) {
            parsedDues.credit = parseCreditRows(rows);
          }
        }

        if (parsed.length === 0) {
          setStatus({ type: 'error', text: 'Could not find any monthly data in this sheet.' });
          setMonthsData([]);
          setSelectedMonthIndex(-1);
          setCumulativeSavings(0);
          setCumulativeVirat(0);
          setCumulativeMe(0);
          setSalaryData([]);
          setUdaipurData(null);
          setDuesData(null);
        } else {
          let totalSavings = 0;
          let totalVirat = 0;
          let totalMe = 0;

          parsed.forEach(m => {
            totalSavings += m.savings;
            totalVirat += m.virat;
            totalMe += m.me;
          });

          setMonthsData(parsed);
          setSelectedMonthIndex(parsed.length - 1);
          setCumulativeSavings(totalSavings);
          setCumulativeVirat(totalVirat);
          setCumulativeMe(totalMe);
          setSalaryData(parsedSalaries);
          setUdaipurData(parsedUdaipur);
          setDuesData(parsedDues);
          setStatus({ type: 'success', text: `Loaded sheet from Google Sheets — ${parsed.length} months found.` });
        }
      } catch (err) {
        setStatus({ type: 'error', text: 'Error parsing spreadsheet: ' + err.message });
        console.error(err);
      } finally {
        if (!isBackground) {
          setIsLoading(false);
        }
      }
      return;
    }

    if (source === 'supabase') {
      if (!isSupabaseConfigured()) {
        setStatus({ type: 'info', text: 'Supabase credentials are not configured. Go to Settings to set them.' });
        return;
      }

      if (!isBackground) {
        setStatus({ type: 'info', text: 'Fetching data from Supabase...' });
        setIsLoading(true);
      }

      try {
        const dbData = await fetchFullDashboardData();
        setMonthsData(dbData.monthsData);
        if (dbData.monthsData.length > 0) {
          setSelectedMonthIndex(dbData.monthsData.length - 1);
        } else {
          setSelectedMonthIndex(-1);
        }

        let totalSavings = 0;
        let totalVirat = 0;
        let totalMe = 0;
        dbData.monthsData.forEach(m => {
          totalSavings += m.savings;
          totalVirat += m.virat;
          totalMe += m.me;
        });

        setCumulativeSavings(totalSavings);
        setCumulativeVirat(totalVirat);
        setCumulativeMe(totalMe);
        setSalaryData(dbData.salaryData);
        setUdaipurData(dbData.udaipurData);
        setDuesData(dbData.duesData);
        setStatus({ type: 'success', text: 'Successfully loaded data from Supabase!' });
      } catch (err) {
        setStatus({ type: 'error', text: 'Supabase Error: ' + err.message });
        console.error(err);
      } finally {
        if (!isBackground) {
          setIsLoading(false);
        }
      }
    }
  };

  // Setup initial load and background polling
  useEffect(() => {
    loadData(dataSource);
    
    // Auto-refresh interval (5 mins)
    const interval = setInterval(() => {
      loadData(dataSource, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, sheetUrl]);

  // Settings Save Handler
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseKey);
    localStorage.setItem('google_sheet_url', sheetUrl);
    localStorage.setItem('data_source', dataSource);
    localStorage.setItem('edit_pin', editPin);
    setShowSettings(false);
    
    // Automatically lock editing if a pin was newly set/exists
    if (editPin.trim()) {
      setIsEditingUnlocked(false);
    } else {
      setIsEditingUnlocked(true);
    }

    loadData(dataSource);
  };

  const handleLockToggle = () => {
    if (!editPin.trim()) {
      alert("To lock editing features, please set a security PIN in the Settings panel first.");
      setShowSettings(true);
      return;
    }
    setIsEditingUnlocked(false);
    setStatus({ type: 'info', text: 'Editing locked. Enter PIN to unlock.' });
  };

  // Google Sheets to Supabase Migration
  const handleMigrate = async () => {
    // Sync currently typed credentials to localStorage so the client can initialize
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseKey);
    localStorage.setItem('google_sheet_url', sheetUrl);
    localStorage.setItem('edit_pin', editPin);

    if (!isSupabaseConfigured()) {
      alert("Please configure your Supabase URL and Anon Key in Settings first!");
      return;
    }
    if (monthsData.length === 0) {
      alert("Please load Google Sheets data first to migrate it.");
      return;
    }
    if (!confirm("This will migrate the current sheets data to Supabase, replacing existing db records. Proceed?")) return;

    setIsMigrating(true);
    setStatus({ type: 'info', text: 'Migrating data to Supabase...' });
    try {
      await migrateSheetsToSupabase({
        monthsData,
        salaryData,
        udaipurData,
        duesData
      });
      alert("Data migrated successfully! You can switch the data source to Supabase now.");
      setStatus({ type: 'success', text: 'Migration complete!' });
    } catch (err) {
      alert("Migration failed: " + err.message);
      setStatus({ type: 'error', text: 'Migration failed: ' + err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  /* ==================== CRUD ACTION HANDLERS ==================== */
  
  // --- Months & Expenses CRUD ---
  const handleSaveMonth = async (month) => {
    try {
      await saveMonth(month);
      setActiveMonthModal(null);
      setActiveCategoryModal(null);
      await loadData();
    } catch (err) {
      alert("Error saving month data: " + err.message);
    }
  };

  const handleDeleteMonth = async (monthId) => {
    if (!confirm("Are you sure you want to delete this monthly record?")) return;
    try {
      await deleteMonth(monthId);
      setActiveMonthModal(null);
      await loadData();
    } catch (err) {
      alert("Error deleting month data: " + err.message);
    }
  };

  // --- Salaries CRUD ---
  const handleSaveSalary = async (salary) => {
    try {
      await saveSalary(salary);
      setActiveSalaryModal(null);
      await loadData();
    } catch (err) {
      alert("Error saving salary data: " + err.message);
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!confirm("Are you sure you want to delete this salary entry?")) return;
    try {
      await deleteSalary(salaryId);
      setActiveSalaryModal(null);
      await loadData();
    } catch (err) {
      alert("Error deleting salary data: " + err.message);
    }
  };

  // --- Udaipur Trip CRUD ---
  const handleSaveTripItem = async (item) => {
    try {
      await saveUdaipurItem(item);
      setActiveTripModal(null);
      await loadData();
    } catch (err) {
      alert("Error saving Udaipur trip item: " + err.message);
    }
  };

  const handleDeleteTripItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteUdaipurItem(itemId);
      setActiveTripModal(null);
      await loadData();
    } catch (err) {
      alert("Error deleting Udaipur trip item: " + err.message);
    }
  };

  // --- Dues & Accounts CRUD ---
  const handleSaveDuesItem = async (duesItem) => {
    try {
      const type = activeDuesModal.type;
      if (type === 'receivable') await saveLendedItem(duesItem);
      else if (type === 'payable') await saveOthersPayable(duesItem);
      else if (type === 'installment') await saveLalumamaInstallment(duesItem);
      else if (type === 'credit') await saveCredit(duesItem);

      setActiveDuesModal(null);
      await loadData();
    } catch (err) {
      alert("Error saving account item: " + err.message);
    }
  };

  const handleDeleteDuesItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const type = activeDuesModal.type;
      if (type === 'receivable') await deleteLendedItem(itemId);
      else if (type === 'payable') await deleteOthersPayable(itemId);
      else if (type === 'installment') await deleteLalumamaInstallment(itemId);
      else if (type === 'credit') await deleteCredit(itemId);

      setActiveDuesModal(null);
      await loadData();
    } catch (err) {
      alert("Error deleting account item: " + err.message);
    }
  };

  const handleSaveShortfall = async (shortfall) => {
    try {
      await saveDishankShortfall(shortfall);
      setActiveShortfallModal(null);
      await loadData();
    } catch (err) {
      alert("Error saving shortfall: " + err.message);
    }
  };



  const handleMonthChange = (e) => {
    setSelectedMonthIndex(parseInt(e.target.value, 10));
  };

  const selectedMonth = monthsData[selectedMonthIndex];

  if (hasEditPin && !isEditingUnlocked) {
    return (
      <LockScreen
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onUnlock={(pinValue) => {
          const storedPin = localStorage.getItem('edit_pin') || '';
          if (pinValue === storedPin) {
            setIsEditingUnlocked(true);
            setStatus({ type: 'success', text: 'Dashboard unlocked successfully!' });
            return true;
          }
          return false;
        }}
      />
    );
  }

  return (
    <div 
      className="w-full max-w-[80%] px-4 mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="mb-3 flex items-center justify-between relative py-2 gap-4">
        <div className="w-10 sm:block hidden"></div>
        <h1 className="text-[26px] font-extrabold m-0 text-brand-text tracking-tight text-center flex-1">
          Finance Donut Chart
        </h1>
        <div className="flex items-center gap-2">
          {dataSource === 'supabase' && (
            <button
              onClick={handleLockToggle}
              type="button"
              className={`p-2 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-bg cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0 ${!hasEditPin ? 'text-brand-muted opacity-50' : isEditingUnlocked ? 'text-emerald-500 hover:text-emerald-600' : 'text-rose-500 hover:text-rose-600'}`}
              aria-label={isEditingUnlocked ? "Lock Editing" : "Unlock Editing"}
              title={!hasEditPin ? "Set Edit PIN in Settings to lock editing" : isEditingUnlocked ? "Lock Editing" : "Unlock Editing"}
            >
              {isEditingUnlocked ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0"
            aria-label="Settings"
          >
            <svg className="w-5 h-5 text-brand-muted hover:text-brand-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0"
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Slide-down Collapsible Settings Panel */}
      {showSettings && (
        <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-5 shadow-md">
          <h2 className="text-sm font-extrabold text-brand-text mb-3 uppercase tracking-wider">Application Settings</h2>
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-muted mb-1">DATA SOURCE</label>
              <select 
                value={dataSource} 
                onChange={(e) => setDataSource(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-bg text-brand-text outline-none"
              >
                <option value="sheets">Google Sheets (Read-only)</option>
                <option value="supabase">Supabase Database (Full CRUD)</option>
                <option value="mock">Mock Sandbox Data (Offline)</option>
              </select>
            </div>

            {dataSource === 'sheets' && (
              <div>
                <label className="block text-xs font-bold text-brand-muted mb-1">GOOGLE SHEETS XLSX EXPORT URL</label>
                <input 
                  type="text" 
                  value={sheetUrl} 
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=xlsx"
                  className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-bg text-brand-text outline-none placeholder-brand-muted"
                />
              </div>
            )}

            {dataSource === 'supabase' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-muted mb-1">SUPABASE URL</label>
                  <input 
                    type="text" 
                    value={supabaseUrl} 
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-bg text-brand-text outline-none placeholder-brand-muted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted mb-1">SUPABASE ANON KEY</label>
                  <input 
                    type="password" 
                    value={supabaseKey} 
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-bg text-brand-text outline-none placeholder-brand-muted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted mb-1">SECURITY PIN FOR EDITING (OPTIONAL)</label>
                  <input 
                    type="password" 
                    value={editPin} 
                    onChange={(e) => setEditPin(e.target.value)}
                    placeholder="Enter 4-8 digit PIN to lock edit features"
                    maxLength={8}
                    className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-bg text-brand-text outline-none placeholder-brand-muted"
                  />
                </div>
              </div>
            )}

            {/* Migration wizard inside settings */}
            {dataSource === 'supabase' && (
              <div className="bg-brand-bg border border-brand-border p-3.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-left">
                  <span className="text-xs font-bold text-brand-text block">One-Click Database Migration</span>
                  <span className="text-[11px] text-brand-muted">Clone current loaded sheets data into your new Supabase database.</span>
                  {monthsData.length === 0 && (
                    <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                      ⚠️ Load Google Sheets data first to enable migration.
                    </span>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleMigrate}
                  disabled={isMigrating || monthsData.length === 0}
                  className="px-3.5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  {isMigrating ? "Migrating..." : "Migrate Sheets to DB"}
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-brand-border pt-3">
              <button 
                type="button" 
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer transition-all"
              >
                Close
              </button>
              <button 
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer transition-all shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </section>
      )}
        {/* <p className="text-brand-muted mt-0 mb-6 text-sm">
          Upload your Finance.xlsx or link a Google Sheet to see monthly
          expenses broken down by category.
        </p> */}
        
        {/* Status Feedback */}
        {status && (
          status.type === 'error' ? (
            <div 
              className="text-brand-danger mt-2.5 leading-normal text-left bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4 rounded-[14px] text-sm mb-5"
            >
              {dataSource === 'supabase' ? (
                <>
                  <strong className="text-red-700 dark:text-red-400">Supabase Connection Error:</strong>
                  <span className="text-red-600 dark:text-red-300 block mt-1">{status.text}</span>
                  <p className="text-xs text-brand-muted mt-2">
                    Please verify that your database tables have been set up correctly in the Supabase SQL editor and that your Project URL and Anon Key are correct.
                  </p>
                </>
              ) : (
                <>
                  <strong>Error Loading Google Sheet:</strong> {status.text || 'Access was blocked (CORS) or the link is private.'}
                  <br/><br/>
                  To fix this, you must <strong>Publish the sheet to the web</strong>:
                  <ol className="list-decimal ml-5 mt-1.5 p-0">
                    <li>Open your Google Sheet.</li>
                    <li>Click <strong>File &gt; Share &gt; Publish to web</strong>.</li>
                    <li>Choose <strong>Entire Document</strong> and <strong>Microsoft Excel (.xlsx)</strong>.</li>
                    <li>Click <strong>Publish</strong>.</li>
                    <li>Copy the generated link and paste it here!</li>
                  </ol>
                </>
              )}
            </div>
          ) : (
            status.type !== 'success' && (
              <div id="status" className="text-sm text-brand-muted mt-2">
                {status.text}
              </div>
            )
          )
        )}

      {/* Financial Overview Bar — always visible */}
      {selectedMonth && (() => {
        const moneyToGet = duesData?.lended?.total || 0;
        const giveItems = [
          { amount: duesData?.dues?.lalumamaRemains || 0 },
          ...((duesData?.dues?.others || []).map(o => ({ amount: o.amount }))),
          { amount: duesData?.dishank?.difference || 0 }
        ].filter(item => item.amount > 0);
        const moneyToGive = giveItems.reduce((s, i) => s + i.amount, 0);
        return (
          <FinancialOverviewBar
            cumulativeSavings={cumulativeSavings}
            moneyToGet={moneyToGet}
            moneyToGive={moneyToGive}
            formatCurrency={formatCurrency}
          />
        );
      })()}

      <main>
        {isLoading && (
          <div className="bg-brand-card border border-brand-border rounded-[14px] p-12 text-center text-brand-text mb-3 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-brand-muted">Fetching dashboard data...</span>
          </div>
        )}

        {!isLoading && !selectedMonth && (
          <div className="bg-brand-card border border-brand-border rounded-[14px] p-8 text-center text-brand-text mb-3 flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
            </svg>
            <div>
              <h3 className="text-lg font-bold">No Database Data Found</h3>
              <p className="text-sm text-brand-muted mt-1 max-w-md mx-auto">
                Your Supabase database does not have any records yet. Click below to open settings, check your Google Sheets URL, and migrate your data in one click.
              </p>
            </div>
            <div className="flex gap-3 mt-1.5 flex-wrap justify-center">
              <button 
                onClick={() => {
                  setDataSource('sheets');
                  loadData('sheets');
                }}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text cursor-pointer active:scale-95 transition-all"
              >
                Switch to Google Sheets
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                Open Settings & Migrate
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Cards (Carousel) */}
        {!isLoading && selectedMonth && (
          <div>
            <div className="relative w-full">
              {/* Left Carousel Arrow — overlaid */}
              <button 
                onClick={() => setCarouselIndex(prev => prev === 0 ? 3 : prev - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full border border-brand-border bg-brand-card/90 backdrop-blur-sm text-brand-text hover:bg-brand-bg hover:text-brand-accent cursor-pointer transition-all active:scale-95 shadow-md shrink-0"
                aria-label="Previous Card"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Active Card Content — full width */}
              <div className="w-full">
                {carouselIndex === 0 ? (
                  /* Card 1: Monthly Expenses Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-4 mb-3" id="resultCard" aria-labelledby="insights-section-title">
                    <h2 id="insights-section-title" className="hidden">
                      Insights and Charts
                    </h2>
                    
                    <div className="flex gap-3 items-center flex-wrap">
                      <select 
                        id="monthSelect" 
                        value={selectedMonthIndex} 
                        onChange={handleMonthChange}
                        aria-label="Select month"
                        className="flex-1 min-w-[160px] p-2.5 text-sm rounded-lg border border-brand-border bg-brand-card text-brand-text outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                      >
                        {monthsData.map((m, i) => (
                          <option key={i} value={i}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      {dataSource === 'supabase' && isEditingUnlocked && (
                        <>
                          <button 
                            onClick={() => setActiveCategoryModal({ month: selectedMonth, categoryName: null })}
                            className="px-3.5 py-2.5 text-sm font-semibold rounded-lg border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text cursor-pointer active:scale-95 transition-all shadow-xs"
                          >
                            Edit Month
                          </button>
                          <button 
                            onClick={() => setActiveMonthModal({})}
                            className="px-3.5 py-2.5 text-sm font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                          >
                            + Add Month
                          </button>
                        </>
                      )}
                    </div>

                    <StatsGrid 
                      income={selectedMonth.income} 
                      totalExpense={selectedMonth.totalExpense} 
                      net={selectedMonth.income - selectedMonth.totalExpense} 
                      formatCurrency={formatCurrency}
                    />

                    <div className="flex items-center gap-2 sm:gap-6 mt-6">
                      <button 
                        onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
                        disabled={selectedMonthIndex <= 0}
                        className="p-3 rounded-full border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                        aria-label="Previous Month"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <DonutChart 
                          categories={selectedMonth.categories} 
                          formatCurrency={formatCurrency} 
                          onEditCategory={(catName) => setActiveCategoryModal({ month: selectedMonth, categoryName: catName })}
                          editable={dataSource === 'supabase' && isEditingUnlocked}
                        />
                      </div>

                      <button 
                        onClick={() => setSelectedMonthIndex(prev => Math.min(monthsData.length - 1, prev + 1))}
                        disabled={selectedMonthIndex >= monthsData.length - 1}
                        className="p-3 rounded-full border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                        aria-label="Next Month"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </section>
                ) : carouselIndex === 1 ? (
                  /* Card 2: Salary History Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-4 mb-3" id="salaryCard" aria-labelledby="salary-section-title">
                    <h2 id="salary-section-title" className="hidden">
                      Salary History Details
                    </h2>
                    <SalaryHistoryCard 
                      salaryData={salaryData} 
                      formatCurrency={formatCurrency} 
                      onEditSalary={setActiveSalaryModal}
                      onAddSalary={() => setActiveSalaryModal({})}
                      editable={dataSource === 'supabase' && isEditingUnlocked}
                    />
                  </section>
                ) : carouselIndex === 2 ? (
                  /* Card 3: Udaipur Trip Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-4 mb-3" id="udaipurCard" aria-labelledby="udaipur-section-title">
                    <h2 id="udaipur-section-title" className="hidden">
                      Udaipur Trip Details
                    </h2>
                    <UdaipurTripCard 
                      udaipurData={udaipurData}
                      formatCurrency={formatCurrency} 
                      onEditTripItem={setActiveTripModal}
                      onAddTripItem={() => setActiveTripModal({})}
                      editable={dataSource === 'supabase' && isEditingUnlocked}
                    />
                  </section>
                ) : (
                  /* Card 4: Dues & Accounts Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-4 mb-3" id="duesCard" aria-labelledby="dues-section-title">
                    <h2 id="dues-section-title" className="hidden">
                      Dues & Accounts Details
                    </h2>
                    <DuesAccountsCard 
                      duesData={duesData}
                      formatCurrency={formatCurrency} 
                      onEditDuesItem={(type, item) => setActiveDuesModal({ type, item })}
                      onAddDuesItem={(type) => setActiveDuesModal({ type, item: null })}
                      onEditShortfall={setActiveShortfallModal}
                      editable={dataSource === 'supabase' && isEditingUnlocked}
                    />
                  </section>
                )}
              </div>

              {/* Right Carousel Arrow — overlaid */}
              <button 
                onClick={() => setCarouselIndex(prev => prev === 3 ? 0 : prev + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-2.5 rounded-full border border-brand-border bg-brand-card/90 backdrop-blur-sm text-brand-text hover:bg-brand-bg hover:text-brand-accent cursor-pointer transition-all active:scale-95 shadow-md shrink-0"
                aria-label="Next Card"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Carousel Dot Indicators */}
            <div className="flex justify-center gap-2 mt-2 mb-5">
              <button 
                onClick={() => setCarouselIndex(0)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${carouselIndex === 0 ? 'bg-brand-accent w-5' : 'bg-brand-border'}`}
                aria-label="Go to Monthly Expenses"
              />
              <button 
                onClick={() => setCarouselIndex(1)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${carouselIndex === 1 ? 'bg-brand-accent w-5' : 'bg-brand-border'}`}
                aria-label="Go to Salary History"
              />
              <button 
                onClick={() => setCarouselIndex(2)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${carouselIndex === 2 ? 'bg-brand-accent w-5' : 'bg-brand-border'}`}
                aria-label="Go to Udaipur Trip"
              />
              <button 
                onClick={() => setCarouselIndex(3)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${carouselIndex === 3 ? 'bg-brand-accent w-5' : 'bg-brand-border'}`}
                aria-label="Go to Dues & Accounts"
              />
            </div>

          </div>
        )}
      </main>

      {/* CRUD Modals */}
      {activeMonthModal && (
        <MonthModal 
          month={activeMonthModal.id ? activeMonthModal : null}
          onSave={handleSaveMonth}
          onDelete={handleDeleteMonth}
          onClose={() => setActiveMonthModal(null)}
        />
      )}
      {activeSalaryModal && (
        <SalaryModal 
          salary={activeSalaryModal.id ? activeSalaryModal : null}
          onSave={handleSaveSalary}
          onDelete={handleDeleteSalary}
          onClose={() => setActiveSalaryModal(null)}
        />
      )}
      {activeTripModal && (
        <UdaipurModal 
          item={activeTripModal.id ? activeTripModal : null}
          onSave={handleSaveTripItem}
          onDelete={handleDeleteTripItem}
          onClose={() => setActiveTripModal(null)}
        />
      )}
      {activeDuesModal && (
        <DuesModal 
          type={activeDuesModal.type}
          item={activeDuesModal.item}
          onSave={handleSaveDuesItem}
          onDelete={handleDeleteDuesItem}
          onClose={() => setActiveDuesModal(null)}
        />
      )}
      {activeShortfallModal && (
        <DuesModal 
          type="shortfall"
          shortfall={activeShortfallModal}
          onSave={handleSaveShortfall}
          onClose={() => setActiveShortfallModal(null)}
        />
      )}
      {activeCategoryModal && (
        <SimpleCategoryModal 
          month={activeCategoryModal.month}
          categoryName={activeCategoryModal.categoryName}
          onSave={handleSaveMonth}
          onClose={() => setActiveCategoryModal(null)}
        />
      )}

    </div>
  );
}
