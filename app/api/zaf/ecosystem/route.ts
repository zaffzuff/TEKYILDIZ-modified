import { NextResponse } from "next/server";
import { getEcosystemSnapshot } from "@/lib/zaf/ecosystem";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await getEcosystemSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
