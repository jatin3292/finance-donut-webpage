import React, { useState, useEffect } from 'react';

/**
 * Reusable base modal wrapper with transition overlays and glassmorphism.
 */
function ModalWrapper({ children, onClose, title }) {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in transition-all">
      <div 
        className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 text-brand-text relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border pb-3.5">
          <h3 className="m-0 text-base font-extrabold tracking-tight text-brand-text">{title}</h3>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="text-brand-muted hover:text-brand-text text-xl font-bold cursor-pointer hover:bg-brand-bg p-1 rounded-md transition-all line-none"
          >
            &times;
          </button>
        </div>
        
        {/* Body Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal to Add or Edit a Month's Financial Data and Expense Categories
 */
export function MonthModal({ month, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState('');
  const [income, setIncome] = useState(0);
  const [savings, setSavings] = useState(0);
  const [virat, setVirat] = useState(0);
  const [me, setMe] = useState(0);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmt, setNewCatAmt] = useState('');

  useEffect(() => {
    if (month) {
      setLabel(month.label || '');
      setIncome(month.income || 0);
      setSavings(month.savings || 0);
      setVirat(month.virat || 0);
      setMe(month.me || 0);
      setCategories(
        Object.entries(month.categories || {}).map(([name, amount]) => ({ name, amount }))
      );
    } else {
      setLabel('');
      setIncome(0);
      setSavings(0);
      setVirat(0);
      setMe(0);
      setCategories([]);
    }
  }, [month]);

  const handleAddCategory = () => {
    if (!newCatName.trim() || isNaN(newCatAmt) || Number(newCatAmt) <= 0) return;
    const name = newCatName.trim();
    const amount = Number(newCatAmt);
    
    // Check if category already exists
    const idx = categories.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
      const updated = [...categories];
      updated[idx].amount += amount;
      setCategories(updated);
    } else {
      setCategories([...categories, { name, amount }]);
    }
    
    setNewCatName('');
    setNewCatAmt('');
  };

  const handleRemoveCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    // Convert category array back to categories object
    const categoriesObj = {};
    categories.forEach(c => {
      categoriesObj[c.name] = c.amount;
    });

    onSave({
      id: month?.id,
      label: label.trim(),
      income: Number(income),
      savings: Number(savings),
      virat: Number(virat),
      me: Number(me),
      categories: categoriesObj
    });
  };

  return (
    <ModalWrapper title={month ? "Edit Monthly Record" : "Add Monthly Record"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Month Label</label>
          <input 
            type="text" 
            placeholder="e.g. June 2026" 
            value={label} 
            onChange={(e) => setLabel(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Income (₹)</label>
            <input 
              type="number" 
              value={income} 
              onChange={(e) => setIncome(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Savings (₹)</label>
            <input 
              type="number" 
              value={savings} 
              onChange={(e) => setSavings(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Savings Virat (₹)</label>
            <input 
              type="number" 
              value={virat} 
              onChange={(e) => setVirat(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Savings Me (₹)</label>
            <input 
              type="number" 
              value={me} 
              onChange={(e) => setMe(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
            />
          </div>
        </div>

        {/* Expenses Category Manager */}
        <div className="border-t border-brand-border mt-2 pt-3">
          <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-wider">Expense Categories</label>
          
          {/* Quick Add Expense Category */}
          <div className="flex gap-2 mb-3 items-center">
            <input 
              type="text" 
              placeholder="e.g. Rent" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-xs"
            />
            <input 
              type="number" 
              placeholder="Amount" 
              value={newCatAmt} 
              onChange={(e) => setNewCatAmt(e.target.value)}
              min="1"
              className="w-20 px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-xs"
            />
            <button 
              type="button" 
              onClick={handleAddCategory}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-bg hover:bg-brand-border text-brand-text border border-brand-border cursor-pointer active:scale-95 transition-all"
            >
              Add
            </button>
          </div>

          {/* Categories list */}
          <div className="border border-brand-border rounded-lg overflow-hidden max-h-[140px] overflow-y-auto mb-2 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[11px]">
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-10">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr key={idx} className="border-b border-brand-border/40 last:border-0 hover:bg-brand-bg/20">
                    <td className="px-3 py-1.5 font-medium">{c.name}</td>
                    <td className="px-3 py-1.5 text-right font-semibold">{c.amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-1.5 text-center">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCategory(idx)}
                        className="text-brand-danger hover:text-red-500 font-bold text-sm cursor-pointer p-0.5"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-brand-muted text-[11px]">No expense categories added.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2 border-t border-brand-border pt-3 mt-2">
          {month && (
            <button 
              type="button" 
              onClick={() => onDelete(month.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-danger hover:bg-red-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs mr-auto"
            >
              Delete Record
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Save Record
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/**
 * Modal to Add or Edit a Salary History entry
 */
export function SalaryModal({ salary, onSave, onDelete, onClose }) {
  const [year, setYear] = useState('');
  const [salaryVal, setSalaryVal] = useState('');

  useEffect(() => {
    if (salary) {
      setYear(salary.year || '');
      setSalaryVal(salary.salary || '');
    } else {
      setYear('');
      setSalaryVal('');
    }
  }, [salary]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!year || isNaN(year) || isNaN(salaryVal)) return;

    onSave({
      id: salary?.id,
      year: Number(year),
      salary: Number(salaryVal)
    });
  };

  return (
    <ModalWrapper title={salary ? "Edit Salary Entry" : "Add Salary Entry"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Year</label>
          <input 
            type="number" 
            placeholder="e.g. 2026" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Salary (₹/Month)</label>
          <input 
            type="number" 
            placeholder="e.g. 60000" 
            value={salaryVal} 
            onChange={(e) => setSalaryVal(e.target.value)}
            required
            min="0"
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border pt-3 mt-3">
          {salary && (
            <button 
              type="button" 
              onClick={() => onDelete(salary.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-danger hover:bg-red-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs mr-auto"
            >
              Delete
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Save
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/**
 * Modal to Add or Edit an Udaipur Trip expense item
 */
export function UdaipurModal({ item, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('my'); // 'my' | 'combined' | 'virat'

  useEffect(() => {
    if (item) {
      setLabel(item.label || '');
      setAmount(item.amount || '');
      setType(item.type || 'my');
    } else {
      setLabel('');
      setAmount('');
      setType('my');
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim() || isNaN(amount) || Number(amount) <= 0) return;

    onSave({
      id: item?.id,
      label: label.trim(),
      amount: Number(amount),
      type
    });
  };

  return (
    <ModalWrapper title={item ? "Edit Trip Expense Item" : "Add Trip Expense Item"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Item Label</label>
          <input 
            type="text" 
            placeholder="e.g. Return Ticket" 
            value={label} 
            onChange={(e) => setLabel(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Amount (₹)</label>
          <input 
            type="number" 
            placeholder="e.g. 600" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Paid By / Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          >
            <option value="my">My Personal Expenses</option>
            <option value="combined">Combined Shared Expenses</option>
            <option value="virat">Virat Personal Expenses</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border pt-3 mt-3">
          {item && (
            <button 
              type="button" 
              onClick={() => onDelete(item.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-danger hover:bg-red-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs mr-auto"
            >
              Delete
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Save Item
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/**
 * Modal to manage Dues & Accounts sub-items (receivables, installments, payables, credits, and shortfall)
 */
export function DuesModal({ type, item, shortfall, onSave, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [shouldBe, setShouldBe] = useState('');
  const [currentlyThere, setCurrentlyThere] = useState('');

  useEffect(() => {
    if (type === 'shortfall' && shortfall) {
      setShouldBe(shortfall.shouldBe || 0);
      setCurrentlyThere(shortfall.currentlyThere || 0);
    } else if (item) {
      setName(item.name || '');
      setAmount(item.amount || '');
      setDate(item.date || '');
    } else {
      setName('');
      setAmount('');
      setDate('');
      setShouldBe('');
      setCurrentlyThere('');
    }
  }, [type, item, shortfall]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'shortfall') {
      onSave({
        id: shortfall?.id,
        shouldBe: Number(shouldBe),
        currentlyThere: Number(currentlyThere)
      });
      return;
    }

    if (type === 'receivable' || type === 'payable' || type === 'credit') {
      if (!name.trim() || isNaN(amount) || Number(amount) <= 0) return;
      onSave({
        id: item?.id,
        name: name.trim(),
        amount: Number(amount)
      });
    } else if (type === 'installment') {
      if (!date.trim() || isNaN(amount) || Number(amount) <= 0) return;
      onSave({
        id: item?.id,
        date: date.trim(),
        amount: Number(amount)
      });
    }
  };

  const getTitle = () => {
    if (type === 'shortfall') return "Edit Dishank Shortfall";
    const action = item ? "Edit" : "Add";
    if (type === 'receivable') return `${action} Lent Receivable`;
    if (type === 'payable') return `${action} Payable Account`;
    if (type === 'installment') return `${action} Lalumama Installment`;
    if (type === 'credit') return `${action} Credit Balance`;
    return "Edit Account Details";
  };

  return (
    <ModalWrapper title={getTitle()} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {type === 'shortfall' ? (
          <>
            <div>
              <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Should Be Balance (₹)</label>
              <input 
                type="number" 
                value={shouldBe} 
                onChange={(e) => setShouldBe(e.target.value)}
                required
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Currently There (₹)</label>
              <input 
                type="number" 
                value={currentlyThere} 
                onChange={(e) => setCurrentlyThere(e.target.value)}
                required
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
              />
            </div>
          </>
        ) : (
          <>
            {type === 'installment' ? (
              <div>
                <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Installment Date</label>
                <input 
                  type="text" 
                  placeholder="e.g. 5/31/2025" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Name / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hakufai" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-brand-muted mb-1 uppercase tracking-wider">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="e.g. 10000" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-brand-border pt-3 mt-3">
          {item && (
            <button 
              type="button" 
              onClick={() => onDelete(item.id)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-danger hover:bg-red-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs mr-auto"
            >
              Delete
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Save Details
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/**
 * Simplified modal for adjusting or editing a category's expense inside a month
 */
export function SimpleCategoryModal({ month, categoryName, onSave, onClose }) {
  const [catName, setCatName] = useState(categoryName || '');
  const [amountInput, setAmountInput] = useState('');
  
  // Pre-fill amount if we are editing an existing category
  useEffect(() => {
    if (categoryName && month && month.categories) {
      const currentAmt = month.categories[categoryName];
      setAmountInput(currentAmt !== undefined ? currentAmt.toString() : '');
    } else {
      setAmountInput('');
    }
  }, [categoryName, month]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!catName.trim() || !amountInput.trim()) return;

    const name = catName.trim();
    const updatedCategories = { ...(month.categories || {}) };

    // Let's parse the amount input
    const isRelative = amountInput.startsWith('+') || amountInput.startsWith('-');
    const typedVal = parseFloat(amountInput);
    if (isNaN(typedVal)) {
      alert("Please enter a valid numeric amount.");
      return;
    }

    if (categoryName) {
      // Direct edit of an existing category (clicked below chart)
      // If they typed a relative adjustment (e.g. "+200" or "-100"), adjust it.
      // Otherwise, overwrite the total amount.
      if (isRelative) {
        const currentVal = updatedCategories[categoryName] || 0;
        const newVal = currentVal + typedVal;
        if (newVal <= 0) {
          delete updatedCategories[categoryName];
        } else {
          updatedCategories[categoryName] = newVal;
        }
      } else {
        if (typedVal <= 0) {
          delete updatedCategories[categoryName];
        } else {
          updatedCategories[categoryName] = typedVal;
        }
      }
      
      // If the category name was changed, delete the old key and add the new one
      if (name !== categoryName) {
        const amt = updatedCategories[categoryName];
        delete updatedCategories[categoryName];
        if (amt > 0) {
          updatedCategories[name] = amt;
        }
      }
    } else {
      // General "Edit Month" adjustment (adding/subtracting relative to current value)
      // Since it's adjustment mode, any number without a sign is treated as an addition.
      const currentVal = updatedCategories[name] || 0;
      const newVal = currentVal + typedVal; // typedVal will be negative if it has a minus sign, positive otherwise
      
      if (newVal <= 0) {
        delete updatedCategories[name];
      } else {
        updatedCategories[name] = newVal;
      }
    }

    onSave({
      ...month,
      categories: updatedCategories
    });
  };

  const handleDelete = () => {
    if (!categoryName) return;
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

    const updatedCategories = { ...(month.categories || {}) };
    delete updatedCategories[categoryName];

    onSave({
      ...month,
      categories: updatedCategories
    });
  };

  return (
    <ModalWrapper 
      title={categoryName ? `Edit Category: ${categoryName}` : `Adjust Expenses - ${month?.label}`} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <div>
          <label className="block text-xs font-bold text-brand-muted mb-1.5 uppercase tracking-wider">Category Name</label>
          <input 
            type="text" 
            placeholder="e.g. Food" 
            value={catName} 
            onChange={(e) => setCatName(e.target.value)}
            required
            disabled={!!categoryName}
            className="w-full px-3.5 py-2.5 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-muted mb-1.5 uppercase tracking-wider">
            {categoryName ? "Amount (₹)" : "Amount Adjustment (₹)"}
          </label>
          <input 
            type="text" 
            placeholder={categoryName ? "e.g. 1200 or -200 to subtract" : "e.g. 150 or -50"} 
            value={amountInput} 
            onChange={(e) => setAmountInput(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-brand-border rounded-lg bg-brand-bg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent text-sm"
          />
          <p className="text-[11px] text-brand-muted mt-1 leading-normal">
            {categoryName 
              ? "Enter a new total amount, or use + or - prefix to adjust (e.g. +200, -100)."
              : "Enter amount to add. Put a minus sign (-) in front to subtract (e.g. -50)."
            }
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border pt-4 mt-2">
          {categoryName && (
            <button 
              type="button" 
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-danger hover:bg-red-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs mr-auto"
            >
              Delete Category
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border bg-transparent text-brand-text hover:bg-brand-bg cursor-pointer active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
