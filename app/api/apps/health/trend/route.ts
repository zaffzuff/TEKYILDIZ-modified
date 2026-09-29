import { NextResponse } from "next/server";
import { getAppHealthTrend, isHistoryStorageConfigured } from "@/lib/zaf/app-check-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });
  if (!isHistoryStorageConfigured()) {
    return NextResponse.json({ configured: false, url, points: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  return NextResponse.json({ configured: true, url, points: await getAppHealthTrend(url, 48) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
