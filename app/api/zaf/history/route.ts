import { NextResponse } from "next/server";
import { getZafHistoricalActivity } from "@/lib/zaf/history-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const history = await getZafHistoricalActivity();
  return NextResponse.json(history, {
    headers: {
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
}
