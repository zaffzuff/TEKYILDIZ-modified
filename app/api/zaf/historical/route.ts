import { NextRequest, NextResponse } from "next/server";
import { getHistoricalLedgerPage } from "@/lib/zaf/historical-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cursor = request.nextUrl.searchParams.get("cursor");
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "200");
    const page = await getHistoricalLedgerPage(cursor, Number.isFinite(limit) ? limit : 200);

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Historical Pi Mainnet request failed" },
      { status: 502 },
    );
  }
}
