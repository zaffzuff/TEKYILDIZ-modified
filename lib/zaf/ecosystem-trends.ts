import { getEcosystemSnapshotHistory, isEcosystemHistoryConfigured } from "@/lib/zaf/ecosystem-history";

export type EcosystemTrendPoint = {
  day: string;
  generatedAt: string;
  observedAppCount: number | null;
  sourceAvailable: boolean;
  availableSources: number;
  totalSources: number;
  signalCount: number;
};

export type EcosystemTrends = {
  configured: boolean;
  points: EcosystemTrendPoint[];
};

type SnapshotPayload = {
  sources?: Array<{ status?: string }>;
  signals?: unknown[];
};

function utcDay(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export async function getEcosystemTrends(limit = 168): Promise<EcosystemTrends> {
  const history = await getEcosystemSnapshotHistory(limit);
  const byDay = new Map<string, EcosystemTrendPoint>();

  for (const item of history) {
    const day = utcDay(item.generatedAt);
    if (!day) continue;

    const payload = (item.payload && typeof item.payload === "object" ? item.payload : {}) as SnapshotPayload;
    const sources = Array.isArray(payload.sources) ? payload.sources : [];
    const signals = Array.isArray(payload.signals) ? payload.signals : [];
    const point: EcosystemTrendPoint = {
      day,
      generatedAt: item.generatedAt,
      observedAppCount: item.observedAppCount,
      sourceAvailable: item.sourceAvailable,
      availableSources: sources.filter((source) => source.status === "available").length,
      totalSources: sources.length,
      signalCount: signals.length,
    };

    // History is returned newest-first, so the first point is the latest
    // observation for that UTC day. This avoids double-counting snapshots.
    if (!byDay.has(day)) byDay.set(day, point);
  }

  return {
    configured: isEcosystemHistoryConfigured(),
    points: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
  };
}
