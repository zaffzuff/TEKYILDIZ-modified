import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:39100/history", { cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Local Node Connector history is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
