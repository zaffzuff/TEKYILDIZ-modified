import { NextResponse } from "next/server";
import { getEcosystemSnapshot } from "@/lib/zaf/ecosystem";
import { checkAppHealth } from "@/lib/zaf/app-health";
import { saveAppChecks } from "@/lib/zaf/app-check-history";

export const dynamic = "force-dynamic";

const MAX_APPS = 20;

export async function GET() {
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
    // Persistence is best-effort; an unavailable database must not break live health checks.
  }

  const reachable = results.filter((item) => item.check.reachable).length;
  const online = results.filter((item) => item.check.ok).length;

  return NextResponse.json(
    {
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
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
