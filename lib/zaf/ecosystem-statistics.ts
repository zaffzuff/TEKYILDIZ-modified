import { getEcosystemSnapshot } from "@/lib/zaf/ecosystem";
import { getEcosystemSnapshotHistory, isEcosystemHistoryConfigured } from "@/lib/zaf/ecosystem-history";

export type EcosystemStatistics = {
  generatedAt: string;
  current: {
    observedApps: number | null;
    availableSources: number;
    totalSources: number;
    observedSignals: number;
    officialSignals: number;
    defi: { launchpad: string; dex: string; amm: string; mainnetTrading: string };
  };
  history: {
    configured: boolean;
    snapshots: number;
    firstObservedAt: string | null;
    latestObservedAt: string | null;
    appCounts: number[];
  };
};

export async function getEcosystemStatistics(): Promise<EcosystemStatistics> {
  const snapshot = await getEcosystemSnapshot();
  const history = await getEcosystemSnapshotHistory(100);

  return {
    generatedAt: snapshot.generatedAt,
    current: {
      observedApps: snapshot.apps.totalCount,
      availableSources: snapshot.sources.filter((source) => source.status === "available").length,
      totalSources: snapshot.sources.length,
      observedSignals: snapshot.signals.length,
      officialSignals: snapshot.officialSignals.length,
      defi: {
        launchpad: snapshot.defi.launchpad.status,
        dex: snapshot.defi.dex.status,
        amm: snapshot.defi.amm.status,
        mainnetTrading: snapshot.defi.mainnetTrading.status,
      },
    },
    history: {
      configured: isEcosystemHistoryConfigured(),
      snapshots: history.length,
      firstObservedAt: history.length ? history[history.length - 1].generatedAt : null,
      latestObservedAt: history.length ? history[0].generatedAt : null,
      appCounts: history.map((item) => item.observedAppCount).filter((count): count is number => count != null),
    },
  };
}
