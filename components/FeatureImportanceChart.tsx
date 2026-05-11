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
import type { FeatureImportance } from "@/lib/types";

type FeatureImportanceChartProps = {
  data?: FeatureImportance[];
  modelAName?: string;
  modelBName?: string;
};

export default function FeatureImportanceChart({
  data,
  modelAName = "Model A",
  modelBName = "Model B",
}: FeatureImportanceChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const topFeatures = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) =>
        Math.max(Number(b?.importance_a) || 0, Number(b?.importance_b) || 0) -
        Math.max(Number(a?.importance_a) || 0, Number(a?.importance_b) || 0),
    );
    return sorted.slice(0, 10).reverse();
  }, [data]);

  const chartData = useMemo(
    () =>
      topFeatures.map((item) => ({
        feature:
          (item?.feature || "").length > 20
            ? `${(item?.feature || "").slice(0, 20)}...`
            : item?.feature || "",
        [modelAName]: Number((Number(item?.importance_a) || 0).toFixed(4)) || 0,
        [modelBName]: Number((Number(item?.importance_b) || 0).toFixed(4)) || 0,
      })),
    [topFeatures, modelAName, modelBName],
  );

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h3 className="text-xl font-semibold text-white">
        Feature Importance Comparison
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Top {Number(Math.min(10, data?.length || 0)) || 0} features &middot; {modelAName} vs{" "}
        {modelBName}
      </p>
      <div className="mt-6 h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            barGap={4}
            barCategoryGap="25%"
          >
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#a1a1aa"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              dataKey="feature"
              type="category"
              stroke="#a1a1aa"
              tickLine={false}
              axisLine={false}
              width={130}
              fontSize={12}
            />
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
              formatter={(value) => (typeof value === "number" ? value.toFixed(4) : value)}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="rect"
              iconSize={10}
            />
            <Bar
              dataKey={modelAName}
              fill="#f97316"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey={modelBName}
              fill="#3b82f6"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
