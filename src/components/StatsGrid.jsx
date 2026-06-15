import React from 'react';

export default function StatsGrid({ income, totalExpense, net, formatCurrency }) {
  const isNegative = net < 0;

  return (
    <div className="flex gap-6 mt-4 flex-wrap justify-between">
      <div className="flex flex-col">
        <div className="text-xs text-brand-muted">Income</div>
        <div className="text-lg font-semibold text-brand-text">{formatCurrency(income)}</div>
      </div>
      <div className="flex flex-col">
        <div className="text-xs text-brand-muted">Total Expense</div>
        <div className="text-lg font-semibold text-brand-text">{formatCurrency(totalExpense)}</div>
      </div>
      <div className="flex flex-col">
        <div className="text-xs text-brand-muted">Net</div>
        <div className={`text-lg font-semibold ${isNegative ? 'text-brand-danger' : 'text-brand-text'}`}>
          {formatCurrency(net)}
        </div>
      </div>
    </div>
  );
}
