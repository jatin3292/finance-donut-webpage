import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const CHART_TYPES = [
  { key: "bar", label: "Bar" },
  { key: "line", label: "Line" },
  { key: "stepped", label: "Stepped" },
  { key: "waterfall", label: "Waterfall" },
  { key: "bubble", label: "Bubble" },
];

export default function SalaryHistoryCard({ salaryData, formatCurrency, onEditSalary, onAddSalary, editable }) {
  const [chartType, setChartType] = useState("bar");
  const [showTable, setShowTable] = useState(false);
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const peakSalary = salaryData.reduce(
    (max, d) => Math.max(max, d.salary || 0),
    0,
  );

  const labels = salaryData.map((d) => d.year.toString());
  const values = salaryData.map((d) => d.salary || 0);

  // CAGR Calculation
  const activeSalaries = salaryData.filter((d) => d.salary > 0);
  let cagr = null;
  if (activeSalaries.length >= 2) {
    const first = activeSalaries[0];
    const last = activeSalaries[activeSalaries.length - 1];
    const years = last.year - first.year;
    if (years > 0 && first.salary > 0) {
      cagr = ((last.salary / first.salary) ** (1 / years) - 1) * 100;
    }
  }

  // YoY Change (latest two active salary years)
  let yoy = null;
  if (activeSalaries.length >= 2) {
    const current = activeSalaries[activeSalaries.length - 1];
    const prev = activeSalaries[activeSalaries.length - 2];
    if (prev.salary > 0) {
      yoy = ((current.salary - prev.salary) / prev.salary) * 100;
    }
  }

  useEffect(() => {
    if (!canvasRef.current || salaryData.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    let chartConfig = null;

    // ── Common scale configs ──
    const commonYScale = {
      beginAtZero: true,
      grid: { color: "rgba(148,163,184,0.12)" },
      ticks: { font: { size: 11 }, callback: (val) => formatCurrency(val) },
    };
    const commonXScale = {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    };
    const noLegend = { legend: { display: false } };
    const salaryTooltip = {
      tooltip: {
        callbacks: {
          label: (context) => {
            const val =
              typeof context.raw === "object"
                ? context.raw.y || 0
                : context.raw || 0;
            return ` Salary: ${formatCurrency(val)}`;
          },
        },
      },
    };

    if (chartType === "bar") {
      chartConfig = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Salary",
              data: values,
              backgroundColor: "#4e79a7",
              borderRadius: 4,
              borderWidth: 0,
              hoverBackgroundColor: "#3b618a",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { ...noLegend, ...salaryTooltip },
          scales: { y: commonYScale, x: commonXScale },
        },
      };
    } else if (chartType === "line") {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(78, 121, 167, 0.4)");
      gradient.addColorStop(1, "rgba(78, 121, 167, 0.0)");

      chartConfig = {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Salary",
              data: values,
              borderColor: "#4e79a7",
              backgroundColor: gradient,
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: "#4e79a7",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { ...noLegend, ...salaryTooltip },
          scales: { y: commonYScale, x: commonXScale },
        },
      };
    } else if (chartType === "stepped") {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");

      chartConfig = {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Salary",
              data: values,
              borderColor: "#6366f1",
              backgroundColor: gradient,
              borderWidth: 2.5,
              fill: true,
              stepped: "middle",
              pointBackgroundColor: "#6366f1",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { ...noLegend, ...salaryTooltip },
          scales: { y: commonYScale, x: commonXScale },
        },
      };
    } else if (chartType === "waterfall") {
      // Each bar shows the change from previous year
      const waterfallData = values.map((val, i) => {
        if (i === 0) return [0, val];
        const prev = values[i - 1];
        return val >= prev ? [prev, val] : [val, prev];
      });
      const bgColors = values.map((val, i) => {
        if (i === 0) return "#4e79a7";
        const diff = val - values[i - 1];
        if (diff > 0) return "#10b981";
        if (diff < 0) return "#ef4444";
        return "#94a3b8";
      });

      chartConfig = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Change",
              data: waterfallData,
              backgroundColor: bgColors,
              borderRadius: 3,
              borderWidth: 0,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            ...noLegend,
            tooltip: {
              callbacks: {
                label: (context) => {
                  const idx = context.dataIndex;
                  const val = values[idx];
                  if (idx === 0) return ` Salary: ${formatCurrency(val)}`;
                  const prev = values[idx - 1];
                  const diff = val - prev;
                  const sign = diff >= 0 ? "+" : "";
                  return [
                    ` Salary: ${formatCurrency(val)}`,
                    ` Change: ${sign}${formatCurrency(diff)}`,
                  ];
                },
              },
            },
          },
          scales: { y: commonYScale, x: commonXScale },
        },
      };
    } else if (chartType === "bubble") {
      const maxSalary = Math.max(...values, 1);
      const bubbleData = salaryData.map((d, i) => ({
        x: d.year,
        y: d.salary || 0,
        r: Math.max(3, ((d.salary || 0) / maxSalary) * 22),
      }));

      chartConfig = {
        type: "bubble",
        data: {
          datasets: [
            {
              label: "Salary",
              data: bubbleData,
              backgroundColor: "rgba(78, 121, 167, 0.5)",
              borderColor: "#4e79a7",
              borderWidth: 2,
              hoverBackgroundColor: "rgba(78, 121, 167, 0.75)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            ...noLegend,
            tooltip: {
              callbacks: {
                label: (context) => {
                  const d = context.raw;
                  return ` ${d.x}: ${formatCurrency(d.y)}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148,163,184,0.12)" },
              ticks: {
                font: { size: 10 },
                callback: (val) => formatCurrency(val),
              },
            },
            x: {
              grid: { color: "rgba(148,163,184,0.06)" },
              ticks: { font: { size: 10 }, callback: (val) => val.toString() },
            },
          },
        },
      };
    }

    if (chartConfig) {
      chartInstanceRef.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [salaryData, chartType, formatCurrency, labels, values, peakSalary]);

  if (salaryData.length === 0) {
    return (
      <div className="text-center text-brand-muted py-10 text-sm">
        No salary history data found.
        {editable && (
          <button 
            onClick={onAddSalary}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover block mx-auto cursor-pointer"
          >
            + Add First Entry
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="m-0 text-lg font-bold text-brand-text">
              Salary History
            </h3>
            <span className="text-xs text-brand-muted">
              Earnings tracking through the years
            </span>
          </div>
          {editable && (
            <button 
              onClick={onAddSalary}
              className="px-2 py-1 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + Add
            </button>
          )}
        </div>

        {/* Chart type toggles — scrollable row */}
        <div className="flex rounded-lg border border-brand-border bg-brand-bg/50 p-1 gap-0.5 overflow-x-auto max-w-full">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setChartType(ct.key)}
              className={`px-2 py-1.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                chartType === ct.key
                  ? "bg-brand-accent text-white shadow-xs"
                  : "text-brand-muted hover:text-brand-text"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Tile Stats Row: Peak Salary, CAGR, YoY */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-3">
        {/* Peak Salary */}
        <div className="flex flex-col items-center gap-0.5 bg-brand-bg px-1.5 py-2 sm:px-3 sm:py-3.5 rounded-xl border border-brand-border/60 text-center">
          <span className="text-[8px] sm:text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            Peak Salary
          </span>
          <span className="text-xs sm:text-base md:text-lg font-extrabold text-[#10b981] leading-tight">
            {formatCurrency(peakSalary)}
          </span>
          <span className="text-[7.5px] sm:text-[9px] text-brand-muted leading-tight">
            Max historical rate
          </span>
        </div>

        {/* CAGR */}
        <div className="flex flex-col items-center gap-0.5 bg-brand-bg px-1.5 py-2 sm:px-3 sm:py-3.5 rounded-xl border border-[#6366f1]/25 text-center">
          <span className="text-[8px] sm:text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            CAGR
          </span>
          <span className="text-xs sm:text-base md:text-lg font-extrabold text-[#6366f1] leading-tight">
            {cagr !== null ? `${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}%` : "—"}
          </span>
          <span className="text-[7.5px] sm:text-[9px] text-brand-muted leading-tight">
            Compound annual growth
          </span>
        </div>

        {/* YoY Change */}
        <div className="flex flex-col items-center gap-0.5 bg-brand-bg px-1.5 py-2 sm:px-3 sm:py-3.5 rounded-xl border border-brand-border/60 text-center">
          <span className="text-[8px] sm:text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            YoY Change
          </span>
          <span
            className={`text-xs sm:text-base md:text-lg font-extrabold leading-tight inline-flex items-center gap-0.5 ${
              yoy === null
                ? "text-brand-muted"
                : yoy >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
            }`}
          >
            {yoy !== null ? (
              <>
                {yoy >= 0 ? "▲" : "▼"}
                {Math.abs(yoy).toFixed(1)}%
              </>
            ) : (
              "—"
            )}
          </span>
          <span className="text-[7.5px] sm:text-[9px] text-brand-muted leading-tight">
            Latest year-over-year
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-3">
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "240px",
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Salary history chart"
            role="img"
          />
        </div>
      </div>

      {/* Toggle Table Button */}
      <div className="flex justify-center mb-5">
        <button
          onClick={() => setShowTable(!showTable)}
          className="px-5 py-2.5 text-xs font-semibold rounded-lg border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg active:scale-[0.98] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
        >
          {showTable ? "Hide Table Details" : "Show Table Details"}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showTable ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Toggleable Detailed Yearly Data Table */}
      {showTable && (
        <div className="border border-brand-border rounded-xl overflow-hidden transition-all duration-300">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-brand-muted font-semibold">
                <th className="px-4 py-2.5">Year</th>
                <th className="px-4 py-2.5 text-right">Annual Salary</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((d, idx) => (
                <tr
                  key={d.year}
                  onClick={() => editable && onEditSalary(d)}
                  className={`border-b border-brand-border/50 hover:bg-brand-bg/50 transition-colors last:border-b-0 ${editable ? "cursor-pointer" : ""} ${idx % 2 === 1 ? "bg-brand-bg/20" : ""}`}
                >
                  <td className="px-4 py-2.5 font-medium text-brand-text">
                    {d.year}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-brand-text">
                    {d.salary > 0 ? formatCurrency(d.salary) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {d.salary > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Earned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-bg text-brand-muted border border-brand-border">
                        Unemployed/Gap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
