import { NextResponse } from "next/server";
import { checkAppHealth } from "@/lib/zaf/app-health";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim();

  if (!target) {
    return NextResponse.json(
      { error: "A public HTTP(S) URL is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await checkAppHealth(target);

  return NextResponse.json(result, {
    status: result.error === "A public HTTP(S) URL is required." ? 400 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
