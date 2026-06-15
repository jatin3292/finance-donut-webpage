import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function DuesAccountsCard({ duesData, formatCurrency, onEditDuesItem, onAddDuesItem, onEditShortfall, editable }) {
  const [activeTab, setActiveTab] = useState('get'); // 'get' | 'give' | 'credit'
  const getCanvasRef = useRef(null);
  const giveCanvasRef = useRef(null);
  const creditCanvasRef = useRef(null);
  const chartInstancesRef = useRef({});




  const {
    lended = { total: 0, items: [] },
    dishank = { shouldBe: 0, currentlyThere: 0, difference: 0 },
    dues = { lalumamaTotal: 0, lalumamaInstallments: [], lalumamaRemains: 0, othersTotal: 0, others: [], othersRemains: 0 },
    credit = []
  } = duesData || {};

  // Construct items for Money to Get
  const getItems = (lended.items || []).filter(item => item.amount > 0);
  const totalToGet = lended.total;

  // Construct items for Money to Give (combining Lalumama, Others, and Dishank shortfall)
  const giveItems = [
    { name: 'Lalumama (Installments)', amount: dues.lalumamaRemains },
    ...(dues.others || []).map(o => ({ name: `${o.name} (Other Payable)`, amount: o.amount })),
    { name: 'Dishank (Account Shortfall)', amount: dishank.difference }
  ].filter(item => item.amount > 0);
  
  const totalToGive = giveItems.reduce((sum, item) => sum + item.amount, 0);

  // Construct items for Credit
  const creditItems = credit.filter(item => item.amount > 0);
  const totalCredit = creditItems.reduce((sum, item) => sum + item.amount, 0);

  const clearCharts = () => {
    Object.keys(chartInstancesRef.current).forEach(key => {
      if (chartInstancesRef.current[key]) {
        chartInstancesRef.current[key].destroy();
        chartInstancesRef.current[key] = null;
      }
    });
  };

  useEffect(() => {
    clearCharts();

    // Chart for "Money to Get" (Breakdown of getItems)
    if (activeTab === 'get' && getCanvasRef.current && getItems.length > 0) {
      const ctx = getCanvasRef.current.getContext('2d');
      const labels = getItems.map(item => item.name);
      const data = getItems.map(item => item.amount);
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#f97316', '#ec4899'];

      chartInstancesRef.current.get = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Chart for "Money to Give" (Breakdown of giveItems)
    if (activeTab === 'give' && giveCanvasRef.current && giveItems.length > 0) {
      const ctx = giveCanvasRef.current.getContext('2d');
      const labels = giveItems.map(item => item.name.replace(' (Other Payable)', '').replace(' (Installments)', '').replace(' (Account Shortfall)', ''));
      const data = giveItems.map(item => item.amount);
      const colors = ['#ec4899', '#6366f1', '#10b981', '#f97316', '#f59e0b'];

      chartInstancesRef.current.give = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Chart for "Credit" (Breakdown of creditItems)
    if (activeTab === 'credit' && creditCanvasRef.current && creditItems.length > 0) {
      const ctx = creditCanvasRef.current.getContext('2d');
      const labels = creditItems.map(item => item.name);
      const data = creditItems.map(item => item.amount);
      const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#f97316'];

      chartInstancesRef.current.credit = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    return () => clearCharts();
  }, [activeTab, duesData]);

  if (!duesData) {
    return (
      <div className="text-center text-brand-muted py-10 text-sm">
        No accounts/dues data available.
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-brand-border pb-2.5 mb-3.5 flex-wrap gap-4">
        <div>
          <h3 className="m-0 text-lg font-bold text-brand-text flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dues & Accounts
          </h3>
          <span className="text-xs text-brand-muted">Lent receivables and outstanding payables</span>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-lg border border-brand-border bg-brand-bg/30 p-1 gap-1 flex-wrap">
          {[
            { id: 'get', label: 'Money to Get' },
            { id: 'give', label: 'Money to Give' },
            { id: 'credit', label: 'Credit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
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

      {/* 1. Money to Get Tab */}
      {activeTab === 'get' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Stats & Table */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center relative">
              <span className="text-xs font-medium text-brand-muted block">Total Money to Get</span>
              <span className="text-xl font-extrabold text-brand-text">
                {formatCurrency(totalToGet)}
              </span>
              {editable && (
                <button 
                  onClick={() => onAddDuesItem('receivable')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  + Add Item
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="border border-brand-border rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted font-semibold sticky top-0">
                    <th className="px-3 py-2">Name / Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getItems.map((item, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => editable && onEditDuesItem('receivable', item)}
                      className={`border-b border-brand-border/50 transition-colors last:border-b-0 hover:bg-brand-bg/25 ${editable ? "cursor-pointer" : ""} ${idx % 2 === 1 ? 'bg-brand-bg/10' : ''}`}
                    >
                      <td className="px-3 py-2 font-medium text-brand-text">{item.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-brand-text">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  {getItems.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-3 py-6 text-center text-brand-muted">No lent items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Chart visual */}
          <div className="lg:col-span-5 flex flex-col items-center p-3.5 bg-brand-card border border-brand-border rounded-xl">
            <h4 className="text-xs font-bold text-brand-text mb-3 text-center">Receivables Breakdown</h4>
            <div style={{ position: 'relative', width: '185px', height: '185px' }} className="mx-auto mb-2">
              <canvas ref={getCanvasRef} aria-label="Money to get chart" role="img" />
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px] w-full">
              {getItems.map((item, idx) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#f97316', '#ec4899'];
                return (
                  <span 
                    key={idx} 
                    onClick={() => editable && onEditDuesItem('receivable', item)}
                    className={`flex items-center gap-1.5 text-brand-text p-1.5 rounded-md transition-all duration-150 ${editable ? "hover:bg-brand-bg/50 cursor-pointer" : ""}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="truncate">{item.name}: {formatCurrency(item.amount)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Money to Give Tab */}
      {activeTab === 'give' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Stats & Table */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center relative flex justify-center items-center">
              <div className="text-center">
                <span className="text-xs font-medium text-brand-muted block">Total Money to Give</span>
                <span className="text-xl font-extrabold text-rose-600">
                  {formatCurrency(totalToGive)}
                </span>
              </div>
              {editable && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <button 
                    onClick={() => onAddDuesItem('payable')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    + Payable
                  </button>
                  <button 
                    onClick={() => onAddDuesItem('installment')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    + Installment
                  </button>
                </div>
              )}
            </div>

            {/* List Table */}
            <div className="border border-brand-border rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted font-semibold sticky top-0">
                    <th className="px-3 py-2">Name / Description</th>
                    <th className="px-3 py-2 text-right">Outstanding Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {giveItems.map((item, idx) => {
                    const isDishank = item.name.includes('Dishank');
                    const isLalumama = item.name.includes('Lalumama');
                    let clickHandler = null;
                    if (editable) {
                      if (isDishank) {
                        clickHandler = () => onEditShortfall(dishank);
                      } else if (!isLalumama) {
                        // Find the original other payable item
                        const originalItem = (dues.others || []).find(o => item.name.startsWith(o.name));
                        if (originalItem) {
                          clickHandler = () => onEditDuesItem('payable', originalItem);
                        }
                      }
                    }
                    return (
                      <tr 
                        key={idx}
                        onClick={clickHandler}
                        className={`border-b border-brand-border/50 transition-colors last:border-b-0 ${clickHandler ? "hover:bg-brand-bg/25 cursor-pointer" : ""} ${idx % 2 === 1 ? 'bg-brand-bg/10' : ''}`}
                      >
                        <td className="px-3 py-2 font-medium text-brand-text">{item.name}</td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-600">{formatCurrency(item.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


          </div>

          {/* Right Column: Chart visual */}
          <div className="lg:col-span-5 flex flex-col items-center p-3.5 bg-brand-card border border-brand-border rounded-xl">
            <h4 className="text-xs font-bold text-brand-text mb-2.5 text-center">Payables Breakdown</h4>
            <div style={{ position: 'relative', width: '185px', height: '185px' }} className="mx-auto mb-2">
              <canvas ref={giveCanvasRef} aria-label="Money to give chart" role="img" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-[11px] w-full">
              {giveItems.map((item, idx) => {
                const colors = ['#ec4899', '#6366f1', '#10b981', '#f97316', '#f59e0b'];
                return (
                  <span 
                    key={idx} 
                    className="flex items-center gap-1.5 text-brand-text p-1.5 rounded-md transition-all duration-150"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="truncate">
                      {item.name.replace(' (Other Payable)', '').replace(' (Installments)', '').replace(' (Account Shortfall)', '')}: {formatCurrency(item.amount)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Credit Tab */}
      {activeTab === 'credit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Stats & Table */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-brand-bg/60 border border-brand-border/60 p-3 rounded-xl text-center relative">
              <span className="text-xs font-medium text-brand-muted block">Total Credit</span>
              <span className="text-xl font-extrabold text-amber-500">
                {formatCurrency(totalCredit)}
              </span>
              {editable && (
                <button 
                  onClick={() => onAddDuesItem('credit')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold rounded bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  + Add Credit
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="border border-brand-border rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted font-semibold sticky top-0">
                    <th className="px-3 py-2">Name / Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {creditItems.map((item, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => editable && onEditDuesItem('credit', item)}
                      className={`border-b border-brand-border/50 transition-colors last:border-b-0 hover:bg-brand-bg/25 ${editable ? "cursor-pointer" : ""} ${idx % 2 === 1 ? 'bg-brand-bg/10' : ''}`}
                    >
                      <td className="px-3 py-2 font-medium text-brand-text">{item.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-brand-text">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  {creditItems.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-3 py-8 text-center text-brand-muted">
                        No credit items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Chart visual */}
          <div className="lg:col-span-5 flex flex-col items-center p-3.5 bg-brand-card border border-brand-border rounded-xl">
            <h4 className="text-xs font-bold text-brand-text mb-3 text-center">Credit Breakdown</h4>
            <div style={{ position: 'relative', width: '185px', height: '185px' }} className="mx-auto mb-2">
              <canvas ref={creditCanvasRef} aria-label="Credit chart" role="img" />
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px] w-full">
              {creditItems.map((item, idx) => {
                const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#f97316'];
                return (
                  <span 
                    key={idx} 
                    onClick={() => editable && onEditDuesItem('credit', item)}
                    className={`flex items-center gap-1.5 text-brand-text p-1.5 rounded-md transition-all duration-150 ${editable ? "hover:bg-brand-bg/50 cursor-pointer" : ""}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="truncate">{item.name}: {formatCurrency(item.amount)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
