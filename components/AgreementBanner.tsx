"use client";

import { useMemo } from "react";
import type { ComparisonResults } from "@/lib/types";

type AgreementBannerProps = {
  results?: ComparisonResults | null;
};

export default function AgreementBanner({ results }: AgreementBannerProps) {
  if (!results) return null;

  const agreementRate = Number(results?.agreement_rate) || 0;
  const totalSamples = Number(results?.total_samples) || 0;
  const accuracyA = Number(results?.accuracy_a) || 0;
  const accuracyB = Number(results?.accuracy_b) || 0;
  const disagreementCount = Number(results?.disagreement_count) || 0;
  const modelAName = results?.model_a_name || "Model A";
  const modelBName = results?.model_b_name || "Model B";

  const agreedSamples =
    results?.total_samples && results?.agreement_rate
      ? Math.round((results.agreement_rate / 100) * results.total_samples)
      : 0;

  const styles = useMemo(() => {
    if (agreementRate > 80)
      return {
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        bar: "bg-emerald-400",
        label: "High Agreement",
      };
    if (agreementRate >= 60)
      return {
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
        text: "text-amber-300",
        bar: "bg-amber-400",
        label: "Moderate Agreement",
      };
    return {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-300",
      bar: "bg-red-400",
      label: "Low Agreement",
    };
  }, [agreementRate]);

  return (
    <div
      className={`rounded-[2rem] border p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${styles.border} ${styles.bg}`}
    >
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">
          {styles.label}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          Agreement Rate
        </span>
      </div>

      <h3 className={`text-6xl font-bold tracking-tight sm:text-7xl ${styles.text}`}>
        {agreementRate}%
      </h3>

      <div className="mx-auto mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${styles.bar}`}
          style={{ width: `${agreementRate}%` }}
        />
      </div>

      <p className="mt-6 text-sm text-zinc-200">
        <span className="font-semibold text-white">{String(agreedSamples)}</span> of{" "}
        <span className="font-semibold text-white">{totalSamples}</span> samples both
        models agree on
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div className="rounded-full border border-[#f97316]/20 bg-[#f97316]/10 px-4 py-2 text-sm text-[#fdba74]">
          {modelAName}: {accuracyA}%
        </div>
        <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          {modelBName}: {accuracyB}%
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
          Disagreements: {disagreementCount}
        </div>
      </div>
    </div>
  );
}
