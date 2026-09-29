import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "::1" || host === "[::1]") return false;
    if (/^(10|127)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    if (host.endsWith(".local") || host.endsWith(".internal")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim();
  if (!target || !isSafeHttpUrl(target)) return NextResponse.json({ error: "A public HTTP(S) URL is required." }, { status: 400 });

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { "user-agent": "ZAF-TECH-App-Checker/1.0" },
    });
    return NextResponse.json({
      url: target,
      status: response.status,
      ok: response.ok,
      reachable: true,
      responseTimeMs: Date.now() - started,
      https: new URL(target).protocol === "https:",
      redirect: response.status >= 300 && response.status < 400,
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      url: target,
      reachable: false,
      responseTimeMs: Date.now() - started,
      https: new URL(target).protocol === "https:",
      redirect: false,
      error: error instanceof Error ? error.message : "Request failed",
      checkedAt: new Date().toISOString(),
    });
  } finally {
    clearTimeout(timer);
  }
}
