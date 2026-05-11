"use client";

import type { HistoryItem } from "@/lib/types";

type HistorySidebarProps = {
  history: HistoryItem[];
};

function formatDate(value?: string) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function HistorySidebar({ history }: HistorySidebarProps) {
  return (
    <aside className="border-b border-white/10 bg-white/[0.02] lg:w-[320px] lg:border-r lg:border-b-0">
      <div className="sticky top-0 p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f97316]">
            History
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Past Comparisons
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Recent runs pulled from the analysis server
          </p>
        </div>

        <div className="max-h-[calc(100vh-280px)] space-y-3 overflow-y-auto pr-2 scrollbar-thin">
          {history.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <svg
                className="mb-3 h-8 w-8 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-zinc-500">No past comparisons yet</p>
              <p className="mt-1 text-xs text-zinc-600">
                Results will appear here after each run
              </p>
            </div>
          ) : (
            history.map((item, index) => {
              const sessionColor =
                item.agreement_rate > 80
                  ? "text-emerald-400"
                  : item.agreement_rate >= 60
                    ? "text-amber-400"
                    : "text-red-400";

              return (
                <div
                  key={item.session_id ?? item.id ?? index}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-[#f97316]/30 hover:bg-[#f97316]/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {item.model_a_name} vs {item.model_b_name}
                    </p>
                    <span className={`shrink-0 text-sm font-semibold ${sessionColor}`}>
                      {item.agreement_rate}%
                    </span>
                  </div>

                  {item.dataset_name && (
                    <p className="mt-1.5 text-xs text-zinc-500">{item.dataset_name}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatDate(item.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
