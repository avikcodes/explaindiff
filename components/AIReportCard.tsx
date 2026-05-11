"use client";

type AIReportCardProps = {
  report?: string;
};

export default function AIReportCard({ report }: AIReportCardProps) {
  if (!report) return null;

  const paragraphs = report?.split(/\n+/).filter(Boolean) || [];

  if (!paragraphs.length) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 border-l-[6px] border-l-[#f97316] bg-gradient-to-r from-[#f97316]/[0.04] to-transparent p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f97316]/15">
          <svg
            className="h-5 w-5 text-[#f97316]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Why They Differ</h3>
          <p className="text-sm text-zinc-500">AI-generated analysis</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {paragraphs.map((para, i) => (
          <p
            key={i}
            className="max-w-4xl text-sm leading-7 text-zinc-200 sm:text-base"
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
