import { NextRequest, NextResponse } from "next/server";
import { getZafWallet } from "@/lib/zaf/wallet-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address") ?? "";

  try {
    return NextResponse.json(await getZafWallet(address), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pi wallet request failed" },
      { status: 400 },
    );
  }
}
