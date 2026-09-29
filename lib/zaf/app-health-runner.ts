import { getEcosystemSnapshot } from "@/lib/zaf/ecosystem";
import { checkAppHealth, type AppHealthCheck } from "@/lib/zaf/app-health";
import { saveAppChecks } from "@/lib/zaf/app-check-history";
import { saveEcosystemSnapshot } from "@/lib/zaf/ecosystem-history";

export const MAX_APPS = 20;

export type EcosystemHealthRun = {
  generatedAt: string;
  source: boolean;
  limit: number;
  checked: number;
  summary: {
    reachable: number;
    online: number;
    offline: number;
  };
  results: Array<{
    name: string;
    url: string;
    check: AppHealthCheck;
  }>;
};

export async function runEcosystemHealthChecks(): Promise<EcosystemHealthRun> {
  const ecosystem = await getEcosystemSnapshot();
  const apps = ecosystem.apps.items.slice(0, MAX_APPS);

  const results = await Promise.all(
    apps.map(async (app) => ({
      name: app.name,
      url: app.url,
      check: await checkAppHealth(app.url),
    })),
  );

  try {
    await saveAppChecks(results.map((item) => ({ appName: item.name, ...item.check })));
  } catch {
    // Persistence is best-effort; an unavailable database must not break live checks.
  }

  try {\n    await saveEcosystemSnapshot({\n      generatedAt: new Date().toISOString(),\n      sourceAvailable: ecosystem.apps.sourceAvailable,\n      observedAppCount: ecosystem.apps.totalCount,\n      payload: ecosystem,\n    });\n  } catch {\n    // Snapshot persistence is best-effort.\n  }\n\n  const reachable = results.filter((item) => item.check.reachable).length;
  const online = results.filter((item) => item.check.ok).length;

  return {
    generatedAt: new Date().toISOString(),
    source: ecosystem.apps.sourceAvailable,
    limit: MAX_APPS,
    checked: results.length,
    summary: {
      reachable,
      online,
      offline: results.length - reachable,
    },
    results,
  };
}
