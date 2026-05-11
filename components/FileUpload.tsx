"use client";

import { useCallback, useRef, useState } from "react";
import type { UploadFile } from "@/lib/types";

type FileUploadProps = {
  modelA: UploadFile;
  modelB: UploadFile;
  dataset: UploadFile;
  modelAName: string;
  modelBName: string;
  targetColumn: string;
  columns: string[];
  loading: boolean;
  onModelAChange: (f: UploadFile) => void;
  onModelBChange: (f: UploadFile) => void;
  onDatasetChange: (f: UploadFile) => void;
  onModelANameChange: (v: string) => void;
  onModelBNameChange: (v: string) => void;
  onTargetColumnChange: (v: string) => void;
  onCompare: () => void;
  onParseCSV: (file: File) => void;
};

type UploadZoneProps = {
  accept: string;
  label: string;
  hint: string;
  file: UploadFile;
  onFile: (f: UploadFile) => void;
};

function UploadZone({ accept, label, hint, file, onFile }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0] ?? null);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={`group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 py-6 text-center transition-all duration-300
        ${
          dragging
            ? "border-[#f97316] bg-[#f97316]/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
            : "border-white/10 bg-white/[0.03] hover:border-[#f97316]/50 hover:bg-white/[0.06]"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300
        ${
          dragging
            ? "scale-110 bg-[#f97316]/20"
            : "bg-white/5 group-hover:scale-110 group-hover:bg-[#f97316]/10"
        }`}
      >
        <svg
          className={`h-6 w-6 transition-colors ${
            dragging ? "text-[#f97316]" : "text-zinc-400 group-hover:text-[#f97316]"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <span className="text-sm font-semibold text-white">{label}</span>
      <span className="mt-2 max-w-full truncate text-xs text-zinc-500">
        {file?.name ?? hint}
      </span>
      {file && (
        <span className="mt-1 rounded-full bg-[#f97316]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#fdba74]">
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </span>
      )}
    </div>
  );
}

export default function FileUpload({
  modelA,
  modelB,
  dataset,
  modelAName,
  modelBName,
  targetColumn,
  columns,
  loading,
  onModelAChange,
  onModelBChange,
  onDatasetChange,
  onModelANameChange,
  onModelBNameChange,
  onTargetColumnChange,
  onCompare,
  onParseCSV,
}: FileUploadProps) {
  const canCompare = Boolean(modelA && modelB && dataset && targetColumn);

  const handleDatasetFile = (file: UploadFile) => {
    onDatasetChange(file);
    if (file) onParseCSV(file);
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f97316]">
          Upload
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Inputs</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload two pickled models and a CSV dataset to compare
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <UploadZone
          accept=".pkl"
          label="Model A (.pkl)"
          hint="Drop your first model file here"
          file={modelA}
          onFile={onModelAChange}
        />
        <UploadZone
          accept=".pkl"
          label="Model B (.pkl)"
          hint="Drop your second model file here"
          file={modelB}
          onFile={onModelBChange}
        />
        <UploadZone
          accept=".csv"
          label="Dataset (.csv)"
          hint="Drop your CSV dataset here"
          file={dataset}
          onFile={handleDatasetFile}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          value={modelAName}
          onChange={(e) => onModelANameChange(e.target.value)}
          placeholder="e.g. Random Forest"
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30"
        />
        <input
          value={modelBName}
          onChange={(e) => onModelBNameChange(e.target.value)}
          placeholder="e.g. Gradient Boosting"
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={targetColumn}
          onChange={(e) => onTargetColumnChange(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30"
        >
          <option value="">Select target column</option>
          {columns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onCompare}
          disabled={!canCompare || loading}
          className="relative rounded-2xl bg-[#f97316] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ea580c] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#f97316]/40 disabled:text-white/70 disabled:shadow-none disabled:active:scale-100"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Comparing...
            </span>
          ) : (
            "Compare Models"
          )}
        </button>
      </div>
    </section>
  );
}
