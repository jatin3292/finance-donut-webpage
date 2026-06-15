import React from 'react';

export default function SavingsInsights({
  selectedMonth,
  formatCurrency,
  onClose,
  cumulativeSavings,
  cumulativeVirat,
  cumulativeMe
}) {
  if (!selectedMonth) return null;

  // Selected month calculations
  const income = selectedMonth.income || 0;
  const totalExpense = selectedMonth.totalExpense || 0;
  const net = income - totalExpense;
  const savings = selectedMonth.savings !== undefined ? selectedMonth.savings : net;
  
  const isSavingsNegative = savings < 0;
  
  // Savings Rate
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const isSavingsRateNegative = savingsRate < 0;

  const cumulativeInHand = cumulativeSavings - cumulativeVirat - cumulativeMe;

  // Message generation
  let msg = '';
  if (net < 0) {
    msg = `⚠️ <strong>Alert:</strong> Your expenses exceeded your income this month by <strong>${formatCurrency(Math.abs(net))}</strong>. Try reviewing high-cost categories to trim your budget.`;
  } else {
    if (savingsRate >= 30) {
      msg = `🎉 <strong>Fantastic saving!</strong> You saved <strong>${savingsRate.toFixed(1)}%</strong> of your income this month. You're building wealth rapidly!`;
    } else if (savingsRate >= 15) {
      msg = `👍 <strong>Healthy savings!</strong> You saved <strong>${savingsRate.toFixed(1)}%</strong> of your income. Keeping a 15-30% saving rate is an excellent financial habit.`;
    } else {
      msg = `💡 <strong>Room to grow:</strong> You saved <strong>${savingsRate.toFixed(1)}%</strong> of your income. Check the breakdown above to see where you can optimize expenses.`;
    }
  }

  return (
    <div id="savingsPanel" className="bg-brand-bg border border-brand-border rounded-xl p-5 mt-4 transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-base font-semibold text-brand-text">Savings Insights</h3>
        <button
          className="bg-transparent border-none text-xl cursor-pointer text-brand-muted px-1.5 hover:text-brand-text leading-none"
          onClick={onClose}
          aria-label="Close panel"
        >
          &times;
        </button>
      </div>
      
      {/* Primary Savings Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-4">
        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">Monthly Savings</span>
          <span className={`text-[18px] font-semibold ${isSavingsNegative ? 'text-brand-danger' : 'text-brand-text'}`}>
            {formatCurrency(savings)}
          </span>
        </div>
        
        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">Savings Rate</span>
          <span className={`text-[18px] font-semibold ${isSavingsRateNegative ? 'text-brand-danger' : 'text-brand-text'}`}>
            {savingsRate.toFixed(1)}%
          </span>
          <div className="w-full h-1.5 bg-brand-border rounded-[3px] mt-2 overflow-hidden">
            <div
              className={`h-full rounded-[3px] transition-all duration-500 ease-in-out ${isSavingsRateNegative ? 'bg-brand-danger' : 'bg-[#10b981]'}`}
              style={{ width: `${isSavingsRateNegative ? 0 : Math.min(100, savingsRate)}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">Total Cumulative Savings</span>
          <span className={`text-[18px] font-semibold ${cumulativeSavings < 0 ? 'text-brand-danger' : 'text-brand-text'}`}>
            {formatCurrency(cumulativeSavings)}
          </span>
        </div>
      </div>

      {/* Secondary Custom Breakdown Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-4">
        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">Virat (Cumulative)</span>
          <span className="text-[18px] font-semibold text-brand-text">
            {formatCurrency(cumulativeVirat)}
          </span>
          {selectedMonth.virat !== undefined && (
            <span className="text-[11px] text-brand-muted mt-0.5">
              {formatCurrency(selectedMonth.virat)} this month
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">Me (Cumulative)</span>
          <span className="text-[18px] font-semibold text-brand-text">
            {formatCurrency(cumulativeMe)}
          </span>
          {selectedMonth.me !== undefined && (
            <span className="text-[11px] text-brand-muted mt-0.5">
              {formatCurrency(selectedMonth.me)} this month
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 bg-brand-card p-3 rounded-lg border border-brand-border">
          <span className="text-xs text-brand-muted">In Hand (Cumulative)</span>
          <span className={`text-[18px] font-semibold ${cumulativeInHand < 0 ? 'text-brand-danger' : 'text-brand-text'}`}>
            {formatCurrency(cumulativeInHand)}
          </span>
          {selectedMonth.savings !== undefined && selectedMonth.virat !== undefined && selectedMonth.me !== undefined && (
            <span className="text-[11px] text-brand-muted mt-0.5">
              {formatCurrency(selectedMonth.savings - selectedMonth.virat - selectedMonth.me)} this month
            </span>
          )}
        </div>
      </div>
      
      <div
        className="text-[13px] text-brand-muted leading-relaxed pt-3 border-t border-brand-border"
        dangerouslySetInnerHTML={{ __html: msg }}
      />
    </div>
  );
}
