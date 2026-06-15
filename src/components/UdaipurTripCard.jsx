import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function UdaipurTripCard({ udaipurData, formatCurrency, onEditTripItem, onAddTripItem, editable }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shared' | 'my' | 'virat'
  const [selectedUser, setSelectedUser] = useState('me'); // 'me' | 'virat'
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const {
    title = "Udaipur Trip March 2025",
    myExpenses = [],
    combinedExpenses = [],
    viratExpenses = [],
    myTotal = 0,
    combinedTotal = 0,
    viratTotal = 0,
    splitAmount = 0,
    grandTotal = 0,
  } = udaipurData || {};

  // Categorize shared expenses for visualization
  const getCategorizedShared = () => {
    let accommodation = 0;
    let transport = 0;
    let food = 0;
    let sightseeing = 0;

    combinedExpenses.forEach(item => {
      const desc = item.label.toLowerCase();
      const amt = item.amount;

      if (desc.includes('hotel') || desc.includes('stay') || desc.includes('room')) {
        accommodation += amt;
      } else if (
        desc.includes('scooty') ||
        desc.includes('petrol') ||
        desc.includes('ticket') && desc.includes('return') ||
        desc.includes('taxi') ||
        desc.includes('rapido')
      ) {
        transport += amt;
      } else if (
        desc.includes('lunch') ||
        desc.includes('booze') ||
        desc.includes('dinner') ||
        desc.includes('snack') ||
        desc.includes('breakfast') ||
        desc.includes('food') ||
        desc.includes('drink')
      ) {
        food += amt;
      } else {
        sightseeing += amt;
      }
    });

    return [
      { category: 'Accommodation', amount: accommodation, color: '#f59e0b' }, // Amber
      { category: 'Food & Drinks', amount: food, color: '#10b981' }, // Emerald
      { category: 'Sightseeing & Activities', amount: sightseeing, color: '#3b82f6' }, // Blue
      { category: 'Transport', amount: transport, color: '#ec4899' }, // Pink
    ].filter(c => c.amount > 0);
  };

  const sharedCategories = getCategorizedShared();

  useEffect(() => {
    if (!canvasRef.current || activeTab !== 'overview' || combinedExpenses.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Destroy previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = sharedCategories.map(c => c.category);
    const values = sharedCategories.map(c => c.amount);
    const colors = sharedCategories.map(c => c.color);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.parsed || 0;
                const pct = ((val / combinedTotal) * 100).toFixed(1);
                return ` ${label}: ${formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [activeTab, combinedExpenses, combinedTotal, formatCurrency, sharedCategories]);

  if (!udaipurData) {
    return (
      <div className="text-center text-brand-muted py-10 text-sm">
        No Udaipur trip data available.
        {editable && (
          <button 
            onClick={onAddTripItem}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover block mx-auto cursor-pointer"
          >
            + Add First Entry
          </button>
        )}
      </div>
    );
  }

  // Active list for tabs
  const getActiveList = () => {
    switch (activeTab) {
      case 'shared':
        return combinedExpenses;
      case 'my':
        return myExpenses;
      case 'virat':
        return viratExpenses;
      default:
        return [];
    }
  };

  const activeList = getActiveList();

  const userPersonalSpend = selectedUser === 'me' ? myTotal : viratTotal;
  const userGrandTotal = splitAmount + userPersonalSpend;

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-brand-border pb-2.5 mb-3.5 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="m-0 text-lg font-bold text-brand-text flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {title}
            </h3>
            <span className="text-xs text-brand-muted">Travel expense summary and split details</span>
          </div>
          {editable && (
            <button 
              onClick={onAddTripItem}
              className="px-2 py-1 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + Add
            </button>
          )}
        </div>

        {/* Custom selectors in top right */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* User selector tab */}
          <div className="flex rounded-lg border border-brand-border bg-brand-bg/50 p-1 gap-1">
            {[
              { id: 'me', label: 'Me' },
              { id: 'virat', label: 'Virat' }
            ].map((usr) => (
              <button
                key={usr.id}
                onClick={() => setSelectedUser(usr.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedUser === usr.id
                    ? 'bg-brand-accent text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {usr.label}
              </button>
            ))}
          </div>

          {/* Custom Tab Toggles */}
          <div className="flex rounded-lg border border-brand-border bg-brand-bg/50 p-1 gap-1 flex-wrap">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'shared', label: 'Shared' },
              { id: 'my', label: 'My Spend' },
              { id: 'virat', label: 'Virat\'s Spend' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-accent text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Statistics column */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2.5">
            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center flex flex-col justify-center gap-1 col-span-2">
              <span className="text-xs font-medium text-brand-muted">Grand Total for {selectedUser === 'me' ? 'Me' : 'Virat'}</span>
              <span className="text-2xl font-extrabold text-brand-accent">
                {formatCurrency(userGrandTotal)}
              </span>
              <span className="text-[10px] text-brand-muted">
                Per Person Share ({formatCurrency(splitAmount)}) + Personal Spend ({formatCurrency(userPersonalSpend)})
              </span>
            </div>

            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center flex flex-col justify-center gap-1">
              <span className="text-xs font-medium text-brand-muted">Shared Expense Total</span>
              <span className="text-xl font-bold text-brand-text">
                {formatCurrency(combinedTotal)}
              </span>
              <span className="text-[10px] text-brand-muted">Split 50-50 per person</span>
            </div>

            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center flex flex-col justify-center gap-1">
              <span className="text-xs font-medium text-brand-muted">Per Person Share</span>
              <span className="text-xl font-bold text-brand-text">
                {formatCurrency(splitAmount)}
              </span>
              <span className="text-[10px] text-brand-muted">Amount each person owes</span>
            </div>

            {selectedUser === 'me' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center flex flex-col justify-center gap-1 col-span-2">
                <span className="text-xs font-semibold text-amber-500">My Personal Spend</span>
                <span className="text-xl font-extrabold text-amber-500">
                  {formatCurrency(myTotal)}
                </span>
                <span className="text-[10px] text-amber-500/80">Spent solely by me</span>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center flex flex-col justify-center gap-1 col-span-2">
                <span className="text-xs font-semibold text-emerald-500">Virat's Personal Spend</span>
                <span className="text-xl font-extrabold text-emerald-500">
                  {formatCurrency(viratTotal)}
                </span>
                <span className="text-[10px] text-emerald-500/80">Spent solely by Virat</span>
              </div>
            )}

            <div className="bg-brand-bg/40 border border-brand-border/60 p-3 rounded-xl col-span-2 mt-1">
              <h4 className="text-xs font-bold text-brand-text mb-2 uppercase tracking-wide">Contribution Breakdown</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-brand-border/40">
                  <span className="text-brand-muted">Me (Personal + 50% Shared)</span>
                  <span className="font-semibold text-brand-text">{formatCurrency(myTotal + splitAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-brand-muted">Virat (Personal + 50% Shared)</span>
                  <span className="font-semibold text-brand-text">{formatCurrency(viratTotal + splitAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Chart column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-brand-card border border-brand-border rounded-xl">
            <h4 className="text-xs font-bold text-brand-text mb-3 text-center">Shared Expenses Breakdown</h4>
            <div style={{ position: 'relative', width: '180px', height: '180px' }} className="mx-auto">
              <canvas ref={canvasRef} aria-label="Shared expenses categories chart" role="img" />
            </div>
            
            <div className="text-xs w-full mt-4 space-y-1">
              {sharedCategories.map((c, idx) => {
                const pct = ((c.amount / combinedTotal) * 100).toFixed(1);
                return (
                  <div 
                    className="flex items-center justify-between text-brand-text py-1.5 px-2 rounded-md transition-all duration-150 border-b border-brand-border/30"
                    key={c.category}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.category}</span>
                    </span>
                    <span className="font-semibold text-brand-text">
                      {formatCurrency(c.amount)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List / Table Tab Content */}
      {activeTab !== 'overview' && (
        <div>
          {/* Card stats header */}
          <div className="flex justify-between items-center mb-4 bg-brand-bg/30 px-4 py-3 rounded-lg border border-brand-border/60">
            <span className="text-xs font-semibold text-brand-muted capitalize">{activeTab} Expenses</span>
            <span className="text-sm font-extrabold text-brand-text">
              Total: {formatCurrency(activeTab === 'shared' ? combinedTotal : activeTab === 'my' ? myTotal : viratTotal)}
            </span>
          </div>

          {/* Expenses Table */}
          <div className="border border-brand-border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted font-semibold sticky top-0">
                  <th className="px-4 py-2.5">Item Description</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeList.map((item, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => editable && onEditTripItem({ ...item, type: activeTab === 'shared' ? 'combined' : activeTab })}
                    className={`border-b border-brand-border/50 hover:bg-brand-bg/20 transition-colors last:border-b-0 ${editable ? "cursor-pointer" : ""} ${idx % 2 === 1 ? 'bg-brand-bg/10' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-brand-text">{item.label}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-brand-text">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {activeList.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-4 py-8 text-center text-brand-muted">
                      No items recorded in this list.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
