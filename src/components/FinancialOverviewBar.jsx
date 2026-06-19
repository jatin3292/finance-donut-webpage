import React from 'react';

/**
 * FinancialOverviewBar
 * A persistent stats bar shown below the page header on every carousel card.
 * Displays: Net Balance (hero), Total Savings, Receivables, Payables.
 */
export default function FinancialOverviewBar({
  cumulativeSavings = 0,
  moneyToGet = 0,
  moneyToGive = 0,
  formatCurrency,
}) {
  const netBalance = cumulativeSavings + moneyToGet - moneyToGive;
  const isPositive = netBalance >= 0;

  const tiles = [
    {
      id: 'tile-savings',
      label: 'Total Savings',
      value: formatCurrency(cumulativeSavings),
      sub: 'Cumulative across all months',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-[#6366f1]',
      bg: 'bg-[#6366f1]/8',
      border: 'border-[#6366f1]/20',
      hoverBorder: 'hover:border-[#6366f1]/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)]',
    },
    {
      id: 'tile-receivables',
      label: 'Receivables',
      value: formatCurrency(moneyToGet),
      sub: 'Money to collect',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)]',
    },
    {
      id: 'tile-payables',
      label: 'Payables',
      value: formatCurrency(moneyToGive),
      sub: 'Dues & obligations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 8V4m0 0l4 4m-4-4l-4 4M7 16v4m0 0l-4-4m4 4l4-4" />
        </svg>
      ),
      color: 'text-amber-500',
      bg: 'bg-amber-500/8',
      border: 'border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)]',
    },
  ];

  return (
    <div
      id="financialOverviewBar"
      className="w-full mb-3"
      aria-label="Financial Overview"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Hero: Net Balance tile */}
        <div
          id="tile-net-balance"
          className={`
            relative rounded-xl border p-3.5 overflow-hidden
            bg-brand-card hover-swing
            ${isPositive
              ? 'border-emerald-500/40 shadow-[0_0_18px_0_rgba(16,185,129,0.12)] hover:border-emerald-500/80 hover:shadow-[0_8px_24px_rgba(16,185,129,0.25)]'
              : 'border-red-500/40 shadow-[0_0_18px_0_rgba(239,68,68,0.12)] hover:border-red-500/80 hover:shadow-[0_8px_24px_rgba(239,68,68,0.25)]'
            }
          `}
        >
          {/* Gradient glow spot */}
          <div
            className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`}
          />
          <div className="relative flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center ${isPositive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d={isPositive
                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    }
                  />
                </svg>
              </span>
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">Net Balance</span>
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '' : '−'}{formatCurrency(Math.abs(netBalance))}
            </span>
            <span className="text-[10px] text-brand-muted">
              Savings + Receivables − Payables
            </span>
          </div>
        </div>

        {/* Other 3 tiles */}
        {tiles.map((tile) => (
          <div
            key={tile.id}
            id={tile.id}
            className={`rounded-xl border ${tile.border} ${tile.bg} p-3.5 bg-brand-card relative overflow-hidden hover-swing ${tile.hoverBorder} ${tile.hoverShadow}`}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${tile.bg} ${tile.color}`}>
                  {tile.icon}
                </span>
                <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                  {tile.label}
                </span>
              </div>
              <span className={`text-xl font-extrabold tracking-tight ${tile.color}`}>
                {tile.value}
              </span>
              <span className="text-[10px] text-brand-muted">{tile.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
