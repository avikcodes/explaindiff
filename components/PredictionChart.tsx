"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { PredictionDistribution } from "@/lib/types";

type PredictionChartProps = {
  data?: PredictionDistribution[];
  modelAName?: string;
  modelBName?: string;
};

export default function PredictionChart({
  data,
  modelAName = "Model A",
  modelBName = "Model B",
}: PredictionChartProps) {
  const chartData = useMemo(
    () => {
      if (!data || !Array.isArray(data) || data.length === 0) return [];
      return data.map((item) => ({
        classLabel: item.class_label,
        [modelAName]: item.count_a,
        [modelBName]: item.count_b,
      }));
    },
    [data, modelAName, modelBName],
  );

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h3 className="text-xl font-semibold text-white">
        Prediction Distribution
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        {modelAName} vs {modelBName} &middot; Per-class prediction counts
      </p>
      <div className="mt-6 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barCategoryGap="20%">
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="classLabel"
              stroke="#a1a1aa"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                backgroundColor: "#111111",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#ffffff",
                fontSize: "13px",
              }}
              labelStyle={{ color: "#ffffff", fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="rect"
              iconSize={10}
            />
            <Bar
              dataKey={modelAName}
              fill="#f97316"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey={modelBName}
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
