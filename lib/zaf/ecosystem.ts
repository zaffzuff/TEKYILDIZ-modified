export const ECOSYSTEM_SOURCES = {
  ecosystemInterface: "https://ecosystem.pinet.com/",
  ecosystemAppPlatform: "https://ecosystem-fzu6gx2rh2n94wpw.piappengine.com/",
  officialBlog: "https://minepi.com/blog/",
  officialDevelopers: "https://developers.minepi.com/",
} as const;

export type EcosystemSourceStatus = {
  id: keyof typeof ECOSYSTEM_SOURCES;
  label: string;
  url: string;
  status: "available" | "unavailable";
  checkedAt: string;
  detail: string;
};

export type EcosystemNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
};

export type EcosystemSnapshot = {
  generatedAt: string;
  sources: EcosystemSourceStatus[];
  apps: {
    sourceAvailable: boolean;
    mainnetCount: number | null;
    testnetCount: number | null;
    totalCount: number | null;
    items: Array<{ name: string; url: string }>;
    note: string;
  };
  news: EcosystemNewsItem[];
  changes: Array<{
    type: "new-app" | "news" | "source";
    title: string;
    detail: string;
    detectedAt: string;
  }>;
};

const APP_SOURCE = ECOSYSTEM_SOURCES.ecosystemAppPlatform;

function absoluteUrl(value: string) {
  try {
    return new URL(value, APP_SOURCE).toString();
  } catch {
    return value;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchText(url: string, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "ZAF-TECH-Ecosystem-Intelligence/1.0" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function inspectSource(
  id: keyof typeof ECOSYSTEM_SOURCES,
  label: string,
  url: string,
  detail: string,
): Promise<EcosystemSourceStatus> {
  try {
    await fetchText(url);
    return { id, label, url, status: "available", checkedAt: new Date().toISOString(), detail };
  } catch (error) {
    return {
      id,
      label,
      url,
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      detail: error instanceof Error ? error.message : "Source unavailable",
    };
  }
}

async function readEcosystemApps() {
  try {
    const html = await fetchText(APP_SOURCE);
    const items = new Map<string, { name: string; url: string }>();
    const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(html)) && items.size < 200) {
      const url = absoluteUrl(match[1]);
      const name = stripHtml(match[2]);
      if (!name || name.length < 2 || name.length > 100) continue;
      if (!/^https?:/i.test(url)) continue;
      if (/^(privacy|terms|support|share|explore the ecosystem|what is pinet)$/i.test(name)) continue;
      items.set(url, { name, url });
    }
    return {
      sourceAvailable: true,
      mainnetCount: null,
      testnetCount: null,
      totalCount: items.size || null,
      items: [...items.values()].slice(0, 100),
      note: items.size
        ? "Observed directly from the public Pi Ecosystem source."
        : "The source is reachable, but app records are rendered dynamically and are not exposed in the initial HTML response.",
    };
  } catch (error) {
    return {
      sourceAvailable: false,
      mainnetCount: null,
      testnetCount: null,
      totalCount: null,
      items: [],
      note: error instanceof Error ? error.message : "Ecosystem source unavailable",
    };
  }
}

async function readOfficialNews() {
  try {
    const html = await fetchText(ECOSYSTEM_SOURCES.officialBlog);
    const items = new Map<string, EcosystemNewsItem>();
    const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && items.size < 20) {
      const url = absoluteUrl(match[1]);
      const title = stripHtml(match[2]);
      if (!url.includes("minepi.com/blog/") || title.length < 8 || title.length > 180) continue;
      if (/^(blog|read more|previous post|next post)$/i.test(title)) continue;
      items.set(url, { title, url, publishedAt: null });
    }
    return [...items.values()].slice(0, 8);
  } catch {
    return [];
  }
}

export async function getEcosystemSnapshot(): Promise<EcosystemSnapshot> {
  const generatedAt = new Date().toISOString();
  const [ecosystemInterface, appData, news] = await Promise.all([
    inspectSource(
      "ecosystemInterface",
      "Pi Ecosystem Interface",
      ECOSYSTEM_SOURCES.ecosystemInterface,
      "Official curated Mainnet/Testnet ecosystem directory.",
    ),
    readEcosystemApps(),
    readOfficialNews(),
  ]);

  const sources: EcosystemSourceStatus[] = [
    ecosystemInterface,
    {
      id: "ecosystemAppPlatform",
      label: "Pi Ecosystem App Platform",
      url: APP_SOURCE,
      status: appData.sourceAvailable ? "available" : "unavailable",
      checkedAt: generatedAt,
      detail: appData.note,
    },
    {
      id: "officialBlog",
      label: "Pi Official Blog",
      url: ECOSYSTEM_SOURCES.officialBlog,
      status: news.length ? "available" : "unavailable",
      checkedAt: generatedAt,
      detail: news.length ? "Official Pi publications observed." : "No publication records were exposed by the source response.",
    },
    {
      id: "officialDevelopers",
      label: "Pi Developer Documentation",
      url: ECOSYSTEM_SOURCES.officialDevelopers,
      status: "available",
      checkedAt: generatedAt,
      detail: "Official developer documentation source.",
    },
  ];

  const changes: EcosystemSnapshot["changes"] = [];
  if (appData.totalCount != null) {
    changes.push({
      type: "new-app",
      title: "Ecosystem directory observed",
      detail: `${appData.totalCount.toLocaleString("en-US")} app records were exposed by the current source response.`,
      detectedAt: generatedAt,
    });
  }
  for (const item of news.slice(0, 4)) {
    changes.push({
      type: "news",
      title: item.title,
      detail: "Official Pi publication observed.",
      detectedAt: generatedAt,
    });
  }

  return { generatedAt, sources, apps: appData, news, changes };
}
