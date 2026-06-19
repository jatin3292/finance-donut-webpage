import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import StatsGrid from './components/StatsGrid';
import DonutChart from './components/DonutChart';
import SalaryHistoryCard from './components/SalaryHistoryCard';
import UdaipurTripCard from './components/UdaipurTripCard';
import DuesAccountsCard from './components/DuesAccountsCard';
import FinancialOverviewBar from './components/FinancialOverviewBar';
// Import parsing utilities from extracted parser file
import {
  convertGoogleSheetsUrl,
  parseSalaryRows,
  parseUdaipurSheet,
  parseDuesSheet,
  parseCreditRows,
  parseSheetRows
} from './utils/excelParser';
// Comment out dropzone / URL loader imports to hide spreadsheet inputs
// import Dropzone from './components/Dropzone';
// import UrlLoader from './components/UrlLoader';

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
  const [status, setStatus] = useState({ type: 'info', text: 'Loading data...' });
  const [cumulativeSavings, setCumulativeSavings] = useState(0);
  const [cumulativeVirat, setCumulativeVirat] = useState(0);
  const [cumulativeMe, setCumulativeMe] = useState(0);
  const [salaryData, setSalaryData] = useState([]);
  const [udaipurData, setUdaipurData] = useState(null);
  const [duesData, setDuesData] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0); // 0 = Monthly, 1 = Salaries, 2 = Udaipur Trip, 3 = Dues & Accounts

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

  const handleFileLoaded = (file) => {
    setStatus({ type: 'info', text: 'Reading file...' });
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: null,
        });
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
          setStatus({ type: 'error', text: 'Could not find any monthly data in this file.' });
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
          setStatus({ type: 'success', text: `Loaded "${file.name}" — ${parsed.length} months found.` });
        }
      } catch (err) {
        setStatus({ type: 'error', text: 'Error reading file: ' + err.message });
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleLoadFromUrl = async (url) => {
    localStorage.setItem('google_sheet_url', url);
    setSheetUrl(url);
    const exportUrl = convertGoogleSheetsUrl(url);
    if (!exportUrl) {
      setStatus({ type: 'error', text: 'Please enter a valid Google Sheets URL.' });
      return;
    }

    setStatus({ type: 'info', text: 'Fetching Google Sheet...' });
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sheetUrl) {
      handleLoadFromUrl(sheetUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMonthChange = (e) => {
    setSelectedMonthIndex(parseInt(e.target.value, 10));
  };

  const selectedMonth = monthsData[selectedMonthIndex];

  return (
    <div 
      className="w-full md:max-w-[80%] px-2 sm:px-4 mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="mb-4 flex items-center justify-between py-3 border-b border-brand-border">
        <h1 className="text-[26px] font-extrabold m-0 text-brand-text tracking-tight flex-1 text-center">
          Finance Donut Chart
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0"
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
      </header>

      {/* Spreadsheet Upload & Load Card - Commented out for personal use only */}
      {/* 
      <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-5 shadow-xs">
        <Dropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
        <div className="flex items-center text-center my-4 text-xs font-semibold text-brand-muted uppercase tracking-wider before:content-[''] before:flex-1 before:border-b before:border-brand-border before:mr-3 after:content-[''] after:flex-1 after:border-b after:border-brand-border after:ml-3">
          OR
        </div>
        <UrlLoader url={sheetUrl} onUrlChange={setSheetUrl} onLoad={handleLoadFromUrl} isLoading={isLoading} />
      </section>
      */}

      {/* Status Notification - Show when loading or in error state */}
      {status && status.type !== 'success' && (
        <div 
          className={`text-sm py-3 px-4 rounded-[10px] mb-5 border ${
            status.type === 'error' 
              ? 'text-brand-danger bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30' 
              : 'text-brand-muted bg-brand-bg border-brand-border'
          }`}
        >
          {status.type === 'error' ? (
            <div>
              <strong>Error Loading Data:</strong> {status.text}
            </div>
          ) : (
            status.text
          )}
        </div>
      )}

      {/* Financial Overview Bar */}
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
            <span className="text-sm text-brand-muted">Loading spreadsheet data...</span>
          </div>
        )}

        {/* Dashboard Carousel View */}
        {!isLoading && selectedMonth && (
          <div>
            <div className="relative w-full">


              <div className="w-full">
                {carouselIndex === 0 ? (
                  /* Card 1: Monthly Expenses Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-3" id="resultCard">
                    <div className="flex gap-2.5 items-center mb-4">
                      <button 
                        onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
                        disabled={selectedMonthIndex <= 0}
                        className="p-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 flex items-center justify-center"
                        aria-label="Previous Month"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <select 
                        id="monthSelect" 
                        value={selectedMonthIndex} 
                        onChange={handleMonthChange}
                        aria-label="Select month"
                        className="flex-1 p-2.5 text-sm rounded-lg border border-brand-border bg-brand-card text-brand-text outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                      >
                        {monthsData.map((m, i) => (
                          <option key={i} value={i}>
                            {m.label}
                          </option>
                        ))}
                      </select>

                      <button 
                        onClick={() => setSelectedMonthIndex(prev => Math.min(monthsData.length - 1, prev + 1))}
                        disabled={selectedMonthIndex >= monthsData.length - 1}
                        className="p-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg hover:text-brand-accent disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 flex items-center justify-center"
                        aria-label="Next Month"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <StatsGrid 
                      income={selectedMonth.income} 
                      totalExpense={selectedMonth.totalExpense} 
                      net={selectedMonth.income - selectedMonth.totalExpense} 
                      formatCurrency={formatCurrency}
                    />

                    <div className="mt-4">
                      <DonutChart 
                        categories={selectedMonth.categories} 
                        formatCurrency={formatCurrency} 
                        editable={false}
                      />
                    </div>
                  </section>
                ) : carouselIndex === 1 ? (
                  /* Card 2: Salary History Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-3" id="salaryCard">
                    <SalaryHistoryCard 
                      salaryData={salaryData} 
                      formatCurrency={formatCurrency} 
                      editable={false}
                    />
                  </section>
                ) : carouselIndex === 2 ? (
                  /* Card 3: Udaipur Trip Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-3" id="udaipurCard">
                    <UdaipurTripCard 
                      udaipurData={udaipurData}
                      formatCurrency={formatCurrency} 
                      editable={false}
                    />
                  </section>
                ) : (
                  /* Card 4: Dues & Accounts Details */
                  <section className="bg-brand-card border border-brand-border rounded-[14px] p-5 mb-3" id="duesCard">
                    <DuesAccountsCard 
                      duesData={duesData}
                      formatCurrency={formatCurrency} 
                      editable={false}
                    />
                  </section>
                )}
              </div>


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
    </div>
  );
}
