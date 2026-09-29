import { getEcosystemSnapshotHistory, isEcosystemHistoryConfigured } from "@/lib/zaf/ecosystem-history";

export type EcosystemTrendPoint = {
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

export async function getEcosystemTrends(limit = 48): Promise<EcosystemTrends> {
  const history = await getEcosystemSnapshotHistory(limit);
  const points = history
    .map((item) => {
      const payload = (item.payload && typeof item.payload === "object" ? item.payload : {}) as SnapshotPayload;
      const sources = Array.isArray(payload.sources) ? payload.sources : [];
      const signals = Array.isArray(payload.signals) ? payload.signals : [];
      return {
        generatedAt: item.generatedAt,
        observedAppCount: item.observedAppCount,
        sourceAvailable: item.sourceAvailable,
        availableSources: sources.filter((source) => source.status === "available").length,
        totalSources: sources.length,
        signalCount: signals.length,
      };
    })
    .reverse();

  return {
    configured: isEcosystemHistoryConfigured(),
    points,
  };
}
