"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ComparisonResults,
  HistoryItem,
  ProgressMessage,
  UploadFile,
} from "@/lib/types";
import FileUpload from "@/components/FileUpload";
import ProgressSection from "@/components/ProgressSection";
import AgreementBanner from "@/components/AgreementBanner";
import PredictionChart from "@/components/PredictionChart";
import FeatureImportanceChart from "@/components/FeatureImportanceChart";
import DisagreementTable from "@/components/DisagreementTable";
import AIReportCard from "@/components/AIReportCard";
import HistorySidebar from "@/components/HistorySidebar";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [modelA, setModelA] = useState<UploadFile>(null);
  const [modelB, setModelB] = useState<UploadFile>(null);
  const [dataset, setDataset] = useState<UploadFile>(null);
  const [modelAName, setModelAName] = useState("");
  const [modelBName, setModelBName] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [results, setResults] = useState<ComparisonResults | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const resolvedModelAName = modelAName || "Model A";
  const resolvedModelBName = modelBName || "Model B";

  useEffect(() => {
    const saved = window.localStorage.getItem("explaindiff_last_result");
    if (saved) {
      try {
        setResults(JSON.parse(saved) as ComparisonResults);
      } catch {
        window.localStorage.removeItem("explaindiff_last_result");
      }
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:8000/history");
        const data = (await response.json()) as HistoryItem[];
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setHistory([]);
      }
    };

    fetchHistory();
  }, []);

  const handleParseCSV = useCallback((file: File) => {
    setColumns([]);
    setTargetColumn("");

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const firstLine = text.split(/\r?\n/)[0] ?? "";
      const headers = firstLine
        .split(",")
        .map((header) => header.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
      setColumns(headers);
    };
    reader.onerror = () => {
      setError("Could not parse CSV headers.");
    };
    reader.readAsText(file);
  }, []);

  const handleCompare = useCallback(async () => {
    if (!modelA || !modelB || !dataset || !targetColumn) return;

    setLoading(true);
    setProgress(0);
    setProgressStep("Preparing files...");
    setError("");
    setResults(null);

    let socket: WebSocket | null = null;

    try {
      const [modelABase64, modelBBase64, datasetBase64] = await Promise.all([
        fileToBase64(modelA),
        fileToBase64(modelB),
        fileToBase64(dataset),
      ]);

      socket = new WebSocket("ws://localhost:8000/ws/compare");

      socket.onopen = () => {
        socket!.send(
          JSON.stringify({
            model_a_data: modelABase64,
            model_b_data: modelBBase64,
            dataset_data: datasetBase64,
            target_column: targetColumn,
            model_a_name: resolvedModelAName,
            model_b_name: resolvedModelBName,
          }),
        );
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as ProgressMessage;

        if (data.step) {
          setProgress(data.progress ?? 0);
          setProgressStep(data.step);
        }

        if (data.error) {
          setError(data.error);
          setLoading(false);
          socket?.close();
          return;
        }

        if (data.progress === 100 && data.results) {
          setResults(data.results);
          window.localStorage.setItem(
            "explaindiff_last_result",
            JSON.stringify(data.results),
          );
          setLoading(false);
          setProgress(100);
          setProgressStep("Complete");
          socket?.close();
        }
      };

      socket.onerror = () => {
        setError("Unable to connect to the analysis server. Ensure the backend is running on ws://localhost:8000.");
        setLoading(false);
      };

      socket.onclose = () => {
        setLoading(false);
      };
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, [modelA, modelB, dataset, targetColumn, resolvedModelAName, resolvedModelBName]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <HistorySidebar history={history} />

        <section className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <header className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-10">
              <div className="inline-flex items-center rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#fdba74]">
                ML Explainability Tool
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                ExplainDiff
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-zinc-200 sm:text-xl">
                Upload two models. See exactly where they disagree.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Compare any two trained ML models on the same dataset. Powered by FastAPI and
                real-time WebSocket streaming.
              </p>
            </header>

            <FileUpload
              modelA={modelA}
              modelB={modelB}
              dataset={dataset}
              modelAName={modelAName}
              modelBName={modelBName}
              targetColumn={targetColumn}
              columns={columns}
              loading={loading}
              onModelAChange={setModelA}
              onModelBChange={setModelB}
              onDatasetChange={setDataset}
              onModelANameChange={setModelAName}
              onModelBNameChange={setModelBName}
              onTargetColumnChange={setTargetColumn}
              onCompare={handleCompare}
              onParseCSV={handleParseCSV}
            />

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8">
                <ProgressSection progress={progress} progressStep={progressStep} />
              </div>
            ) : null}

            {results ? (
              <section className="mt-8 space-y-8">
                <AgreementBanner results={results} />

                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
                  <PredictionChart
                    data={results?.prediction_distribution || []}
                    modelAName={resolvedModelAName}
                    modelBName={resolvedModelBName}
                  />
                  <FeatureImportanceChart
                    data={results?.feature_importance || []}
                    modelAName={resolvedModelAName}
                    modelBName={resolvedModelBName}
                  />
                </div>

                <DisagreementTable disagreements={results?.disagreements || []} />

                <AIReportCard report={results?.ai_report || ""} />
              </section>
            ) : null}

            {!results && !loading ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] p-12 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-zinc-400">
                  No analysis results yet
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Upload two models and a dataset above, then click &quot;Compare Models&quot;
                </p>
              </div>
            ) : null}

            <footer className="py-10 text-center text-sm text-zinc-600">
              Built with Next.js, Tailwind CSS, Recharts &middot; ExplainDiff
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
