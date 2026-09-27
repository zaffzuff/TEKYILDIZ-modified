import { NextResponse } from "next/server";
import { getZafSnapshot } from "@/lib/zaf/horizon-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getZafSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
