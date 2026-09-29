import { NextResponse } from "next/server";
import { getEcosystemSnapshot } from "@/lib/zaf/ecosystem";
import { slugify, toDirectoryApp } from "@/lib/zaf/app-directory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const snapshot = await getEcosystemSnapshot();
  const app = snapshot.apps.items
    .map((item) => toDirectoryApp(item, snapshot.generatedAt))
    .find((item) => item.slug === slug);

  if (!app) {
    return NextResponse.json({ error: "App not found", slug }, { status: 404 });
  }

  return NextResponse.json({
    app,
    source: snapshot.apps.sourceAvailable ? "Pi Ecosystem source" : "unavailable",
    sourceUrl: app.url,
    generatedAt: snapshot.generatedAt,
  }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } });
}
