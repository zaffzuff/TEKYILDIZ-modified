"use client";

import {
  APP_NAME,
  APP_TAGLINE,
  formatDate,
  overviewCounters,
  type ConfidenceId,
  type Dataset,
  type TabId,
} from "@/lib/tekyildiz/data";
import { ActivityCard } from "./activity-card";
import { Card, ConfidenceBadge, cx } from "./ui";
import {
  IconApps,
  IconChevronRight,
  IconInfo,
  IconProjects,
  IconTrends,
  Logo,
} from "./icons";

function Counter({
  label,
  value,
  confidence,
}: {
  label: string;
  value: number | string;
  confidence: ConfidenceId;
}) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold text-foreground ty-nums">{value}</span>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <p className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground text-pretty">
        {label}
      </p>
    </Card>
  );
}

function QuickTile({
  label,
  desc,
  icon,
  onClick,
}: {
  label: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ty-press flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-ty-gold/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-ty-gold">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{desc}</span>
      </span>
      <IconChevronRight width={17} height={17} className="text-muted-foreground" />
    </button>
  );
}

export function OverviewScreen({
  data,
  onNavigate,
}: {
  data: Dataset;
  onNavigate: (t: TabId) => void;
}) {
  const c = overviewCounters(data);
  const latest = data.activity.slice(0, 4);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6">
      {/* Hero */}
      <section className="ty-hero-grad -mx-4 border-b border-border px-4 pb-5 pt-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <Logo width={40} height={40} />
            <div>
              <h1 className="text-2xl font-bold leading-none ty-brand-text">{APP_NAME}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            A neutral, read-only view of what&apos;s active, what&apos;s new, and how the Pi
            ecosystem is evolving — without hype or speculation.
          </p>
        </div>
      </section>

      {/* Data banner */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-ty-gold/30 bg-ty-gold-soft/50 p-3 text-[11px] leading-relaxed text-foreground/90">
        <IconInfo width={15} height={15} className="mt-0.5 shrink-0 text-ty-gold" />
        <span className="text-pretty">
          Displayed data comes from tracked sources and may not be complete or real-time. Every
          figure carries a confidence label. TEKYILDIZ is not an official Pi Core Team app.
        </span>
      </div>

      {/* Counters */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Snapshot</h2>
        <div className="grid grid-cols-2 gap-3">
          <Counter label="Total tracked apps" value={c.totalApps} confidence="demo" />
          <Counter label="Active projects" value={c.activeProjects} confidence="demo" />
          <Counter label="Recent updates (14d)" value={c.recentUpdates} confidence="demo" />
          <Counter label="Network signals" value={c.networkSignals ?? "—"} confidence="unavailable" />
        </div>
      </section>

      {/* Quick tiles */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Explore</h2>
        <div className="flex flex-col gap-2.5">
          <QuickTile
            label="Apps"
            desc="Browse tracked Pi ecosystem applications"
            icon={<IconApps width={20} height={20} />}
            onClick={() => onNavigate("apps")}
          />
          <QuickTile
            label="Projects"
            desc="Community, research, tooling and infrastructure"
            icon={<IconProjects width={20} height={20} />}
            onClick={() => onNavigate("projects")}
          />
          <QuickTile
            label="Trends"
            desc="Activity patterns over tracked periods"
            icon={<IconTrends width={20} height={20} />}
            onClick={() => onNavigate("trends")}
          />
        </div>
      </section>

      {/* Latest activity */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Latest activity</h2>
          <button
            onClick={() => onNavigate("activity")}
            className={cx(
              "ty-press inline-flex items-center gap-1 text-xs font-medium text-ty-gold",
            )}
          >
            View all
            <IconChevronRight width={14} height={14} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {latest.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground ty-nums">
          Dataset: {data.sourceLabel} · assembled {formatDate(data.generatedAt)}
        </p>
      </section>
    </div>
  );
}
