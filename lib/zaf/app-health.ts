export type AppHealthCheck = {
  url: string;
  status: number | null;
  ok: boolean;
  reachable: boolean;
  responseTimeMs: number;
  https: boolean;
  redirect: boolean;
  checkedAt: string;
  error: string | null;
};

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) return true;

  if (/^(10|127)\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

  return false;
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password) return false;
    return !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

export async function checkAppHealth(target: string, timeoutMs = 8000): Promise<AppHealthCheck> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const https = target.startsWith("https://");

  if (!isSafeHttpUrl(target)) {
    return {
      url: target,
      status: null,
      ok: false,
      reachable: false,
      responseTimeMs: 0,
      https,
      redirect: false,
      checkedAt,
      error: "A public HTTP(S) URL is required.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { "user-agent": "ZAF-TECH-App-Checker/1.0" },
    });

    return {
      url: target,
      status: response.status,
      ok: response.ok,
      reachable: true,
      responseTimeMs: Date.now() - started,
      https,
      redirect: response.status >= 300 && response.status < 400,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return {
      url: target,
      status: null,
      ok: false,
      reachable: false,
      responseTimeMs: Date.now() - started,
      https,
      redirect: false,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}
