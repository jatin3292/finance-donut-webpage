import React from 'react';

export default function UrlLoader({ url, onUrlChange, onLoad, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading) {
      onLoad(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 mt-3">
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Paste Google Sheets URL (Shared / Published to web)"
        aria-label="Google Sheets URL"
        disabled={isLoading}
        className="flex-1 px-3.5 py-2.5 border border-brand-border rounded-lg text-[13px] outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 bg-brand-card text-brand-text disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <button 
        type="submit" 
        className="px-[18px] py-2.5 text-sm font-medium rounded-lg border border-brand-border bg-brand-accent hover:bg-brand-accent-hover text-white cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Load Sheet'}
      </button>
    </form>
  );
}
