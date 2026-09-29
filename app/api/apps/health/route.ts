import { NextResponse } from "next/server";
import { runEcosystemHealthChecks } from "@/lib/zaf/app-health-runner";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runEcosystemHealthChecks();

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
