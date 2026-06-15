import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

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

export default function DonutChart({ categories, formatCurrency, onEditCategory, editable }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Parse categories into sorted arrays
  const sortedEntries = Object.entries(categories || {})
    .filter(([_, val]) => typeof val === "number" && val > 0)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedEntries.map((e) => e[0]);
  const values = sortedEntries.map((e) => e[1]);
  const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);
  const sumExpense = values.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const ctx = canvasRef.current.getContext("2d");

    // Destroy previous chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Using custom React legend below
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                const percentage = ((value / sumExpense) * 100).toFixed(1);
                return ` ${label}: ${formatCurrency(value)} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "62%",
      },
    });

    // Cleanup on unmount/re-render
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, sumExpense]);

  if (labels.length === 0) {
    return (
      <div className="text-center text-brand-muted py-10 text-sm">
        No expense data recorded for this month.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-4">
      <div
        style={{ position: "relative", width: "220px", height: "220px" }}
        className="mx-auto"
      >
        <canvas ref={canvasRef} aria-label="Expenses donut chart" role="img" />
      </div>
      <div className="text-[13px] w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 border-t border-brand-border pt-4">
        {labels.map((label, i) => {
          const pct = ((values[i] / sumExpense) * 100).toFixed(1);
          return (
            <div
              className={`flex items-center justify-between text-brand-text py-1.5 px-2 rounded-md transition-all duration-150 border-b border-brand-border/30 ${editable ? 'cursor-pointer hover:bg-brand-bg/50' : ''}`}
              key={label}
              onClick={() => editable && onEditCategory && onEditCategory(label)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-[3px] shrink-0"
                  style={{ backgroundColor: colors[i] }}
                />
                <span className="break-words font-medium" title={label}>
                  {label}
                </span>
              </span>
              <span className="font-semibold shrink-0 ml-2">
                {formatCurrency(values[i])} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
