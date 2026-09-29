import { NextRequest, NextResponse } from "next/server";
import { getZafWallet } from "@/lib/zaf/wallet-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim() ?? "";
  const network = request.nextUrl.searchParams.get("network")?.trim().toLowerCase() === "testnet"
    ? "testnet"
    : "mainnet";

  if (!address) {
    return NextResponse.json(
      { error: "A Pi wallet address is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const snapshot = await getZafWallet(address, network);
    const status = snapshot.exists === false ? 404 : 200;

    return NextResponse.json(snapshot, {
      status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pi wallet request failed" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
