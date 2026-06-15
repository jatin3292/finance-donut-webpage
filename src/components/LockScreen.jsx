import React, { useState, useEffect } from 'react';

export default function LockScreen({ onUnlock, darkMode, setDarkMode }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 8) {
          setPin((prev) => prev + e.key);
          setError('');
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleKeyPress = (num) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!pin) return;
    
    const success = onUnlock(pin);
    if (!success) {
      setError('Incorrect security PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center z-[100] px-4 overflow-y-auto">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl border border-brand-border bg-brand-card text-brand-text hover:bg-brand-bg cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0"
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Lock Screen Card */}
      <div className="bg-brand-card border border-brand-border rounded-[28px] w-full max-w-sm p-8 shadow-2xl relative text-center flex flex-col items-center">
        {/* Animated Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-6 animate-pulse border border-brand-accent/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 className="text-2xl font-extrabold text-brand-text mb-1 tracking-tight">Private Dashboard</h3>
        <p className="text-xs text-brand-muted mb-6 max-w-[240px]">Enter security PIN to view financial insights</p>

        {/* PIN Indicators / Dots */}
        <div className="flex gap-4 mb-6 justify-center">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border border-brand-border transition-all duration-150 ${
                pin.length > i 
                  ? 'bg-brand-accent scale-110 shadow-xs' 
                  : 'bg-brand-bg/50'
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className="text-[10px] text-brand-accent font-semibold self-center ml-1">
              +{pin.length - 4}
            </div>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          {/* Error Message */}
          <div className="h-5 mb-2">
            {error && (
              <p className="text-xs font-semibold text-brand-danger animate-bounce">
                {error}
              </p>
            )}
          </div>

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[240px] mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                className="w-14 h-14 rounded-full border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text hover:text-brand-accent active:scale-90 font-bold text-xl flex items-center justify-center cursor-pointer shadow-xs transition-all"
              >
                {num}
              </button>
            ))}
            {/* Backspace button */}
            <button
              type="button"
              onClick={handleBackspace}
              className="w-14 h-14 rounded-full border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-muted hover:text-brand-danger active:scale-90 flex items-center justify-center cursor-pointer shadow-xs transition-all"
              aria-label="Delete last digit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0010.828 5H20a2 2 0 002 2v10a2 2 0 00-2 2h-9.172a2 2 0 00-1.414-.586L3 12z" />
              </svg>
            </button>
            {/* Zero button */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-14 h-14 rounded-full border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text hover:text-brand-accent active:scale-90 font-bold text-xl flex items-center justify-center cursor-pointer shadow-xs transition-all"
            >
              0
            </button>
            {/* Submit button */}
            <button
              type="submit"
              disabled={!pin}
              className="w-14 h-14 rounded-full bg-brand-accent hover:bg-brand-accent-hover text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 flex items-center justify-center cursor-pointer shadow-md transition-all"
              aria-label="Unlock Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
