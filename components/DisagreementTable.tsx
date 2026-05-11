"use client";

import { useMemo } from "react";
import type { DisagreementSample } from "@/lib/types";

type DisagreementTableProps = {
  disagreements?: DisagreementSample[];
};

export default function DisagreementTable({ disagreements }: DisagreementTableProps) {
  if (!disagreements || !Array.isArray(disagreements) || disagreements.length === 0) return null;

  const rows = useMemo(() => disagreements.slice(0, 10), [disagreements]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Top Disagreement Samples
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Showing {Number(rows?.length) || 0} of {Number(disagreements?.length) || 0} disagreements
          </p>
        </div>
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
          {Number(disagreements?.length) || 0} total
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Sample ID
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Model A Prediction
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Model B Prediction
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Actual Label
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const bothWrong =
                (row?.pred_a || "") !== (row?.actual || "") && (row?.pred_b || "") !== (row?.actual || "");
              const aCorrect = (row?.pred_a || "") === (row?.actual || "");
              const bCorrect = (row?.pred_b || "") === (row?.actual || "");

              return (
                <tr
                  key={row?.sample_id ?? index}
                  className={`border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]
                    ${bothWrong ? "bg-red-500/5" : ""}`}
                >
                  <td className="px-5 py-4 font-mono text-xs text-zinc-400">
                    #{Number(row?.sample_id) || 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                        ${aCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                    >
                      {aCorrect && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                      {row?.pred_a || ""}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                        ${bCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                    >
                      {bCorrect && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                      {row?.pred_b || ""}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white">
                      {row?.actual || ""}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
