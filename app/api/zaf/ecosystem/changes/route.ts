import { NextResponse } from "next/server";
import { getEcosystemChanges } from "@/lib/zaf/ecosystem-changes";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getEcosystemChanges();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
