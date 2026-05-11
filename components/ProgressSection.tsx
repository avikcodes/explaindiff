"use client";

type ProgressSectionProps = {
  progress: number;
  progressStep: string;
};

export default function ProgressSection({ progress, progressStep }: ProgressSectionProps) {
  return (
    <section className="rounded-[2rem] border border-[#f97316]/20 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Analysis Progress</h3>
          <p className="mt-1 text-sm text-zinc-500">Running comparison on the server</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f97316]/10 px-4 py-1.5 text-sm font-semibold text-[#fdba74]">
          <svg className="h-3 w-3 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
          {progress}%
        </span>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fdba74] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f97316]/15">
          <svg className="h-4 w-4 animate-spin text-[#f97316]" viewBox="0 0 24 24" fill="none">
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
        </div>
        <p className="animate-pulse text-sm text-zinc-300">{progressStep || "Initializing..."}</p>
      </div>
    </section>
  );
}
