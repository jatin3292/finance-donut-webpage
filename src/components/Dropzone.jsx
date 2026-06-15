import React, { useRef, useState } from 'react';

export default function Dropzone({ onFileLoaded, isLoading }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileLoaded(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (isLoading) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileLoaded(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-150 ${
        isDragOver
          ? 'border-brand-accent bg-brand-accent/10'
          : 'border-brand-border bg-brand-card'
      } ${
        isLoading
          ? 'opacity-60 cursor-not-allowed'
          : 'opacity-100 cursor-pointer'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload Excel File"
    >
      <span className="font-semibold">Click to upload</span> or drag &amp; drop your <code className="bg-brand-bg px-1 py-0.5 rounded text-xs text-brand-text">.xlsx</code> file here
      <div className="text-brand-muted text-[13px] mt-1.5">
        Nothing is uploaded anywhere — everything runs locally in your browser.
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
        disabled={isLoading}
      />
    </div>
  );
}
