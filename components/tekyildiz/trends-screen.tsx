"use client";

import { useState } from "react";
import {
  type Dataset,
  type TrendPeriod,
  type TrendSeries,
} from "@/lib/tekyildiz/data";
import { Card, ConfidenceBadge, Chip, cx } from "./ui";
import { IconInfo, IconTrends } from "./icons";

type MetricKey = "updates" | "newApps" | "signals";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "updates", label: "Updates", color: "var(--ty-gold)" },
  { key: "newApps", label: "New apps", color: "var(--ty-silver)" },
  { key: "signals", label: "Signals", color: "var(--ty-demo)" },
];

function BarChart({ series, metric }: { series: TrendSeries; metric: MetricKey }) {
  const values = series.points.map((p) => p[metric]);
  const max = Math.max(1, ...values);
  const color = METRICS.find((m) => m.key === metric)!.color;

  return (
    <div className="flex items-end justify-between gap-2 px-1 pt-2" style={{ height: 160 }}>
      {series.points.map((p, i) => {
        const v = p[metric];
        const h = Math.max(4, Math.round((v / max) * 130));
        return (
          <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-foreground ty-nums">{v}</span>
            <div
              className="ty-bar w-full max-w-[28px] rounded-t-md"
              style={{
                height: h,
                background: `linear-gradient(180deg, ${color}, color-mix(in oklch, ${color} 55%, transparent))`,
                animationDelay: `${i * 45}ms`,
              }}
              aria-hidden
            />
            <span className="truncate text-[10px] text-muted-foreground">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TrendsScreen({ data }: { data: Dataset }) {
  const [period, setPeriod] = useState<TrendPeriod>("weekly");
  const [metric, setMetric] = useState<MetricKey>("updates");

  const series = data.trends.find((t) => t.period === period) ?? data.trends[0];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6">
      <header className="pt-5">
        <div className="flex items-center gap-2">
          <IconTrends className="text-ty-gold" width={22} height={22} />
          <h1 className="text-xl font-bold text-foreground">Trends</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Ecosystem activity patterns over time. No prices, no financial projections.
        </p>
      </header>

      {/* Period toggle */}
      <div className="mt-4 flex gap-2">
        <Chip active={period === "weekly"} onClick={() => setPeriod("weekly")}>
          Weekly
        </Chip>
        <Chip active={period === "monthly"} onClick={() => setPeriod("monthly")}>
          Monthly
        </Chip>
      </div>

      {/* Metric toggle */}
      <div className="ty-no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
        {METRICS.map((m) => (
          <Chip key={m.key} active={metric === m.key} onClick={() => setMetric(m.key)}>
            <span
              className="mr-1 inline-block h-2 w-2 rounded-full"
              style={{ background: m.color }}
              aria-hidden
            />
            {m.label}
          </Chip>
        ))}
      </div>

      {/* Chart */}
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {METRICS.find((m) => m.key === metric)!.label} ·{" "}
              {period === "weekly" ? "by week" : "by month"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Count per period</p>
          </div>
          <ConfidenceBadge confidence={series.confidence} />
        </div>

        <BarChart series={series} metric={metric} />

        <div
          className={cx(
            "mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-[11px] leading-relaxed",
            series.confidence === "estimated"
              ? "border-ty-estimated/40 bg-ty-estimated-soft/40 text-ty-estimated"
              : "border-border bg-secondary/50 text-muted-foreground",
          )}
        >
          <IconInfo width={14} height={14} className="mt-0.5 shrink-0" />
          <span className="text-pretty">{series.note}</span>
        </div>
      </Card>

      {/* All metrics summary */}
      <Card className="mt-4 p-4">
        <h3 className="text-sm font-semibold text-foreground">This period at a glance</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {METRICS.map((m) => {
            const total = series.points.reduce((sum, p) => sum + p[m.key], 0);
            return (
              <div key={m.key} className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
                <span
                  className="mx-auto mb-1.5 block h-2 w-2 rounded-full"
                  style={{ background: m.color }}
                  aria-hidden
                />
                <p className="text-lg font-bold text-foreground ty-nums">{total}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground text-pretty">
        Limited to ecosystem activity, not market behavior. Trend lines derived from partial data
        are labelled Estimated.
      </p>
    </div>
  );
}
