"use client";

import { useEffect, useMemo, useState } from "react";
import type { EcosystemSnapshot } from "@/lib/zaf/ecosystem";
import type { Locale } from "@/lib/zaf/i18n";

function text(locale: Locale, en: string, tr: string) {
  return locale === "tr" ? tr : en;
}

type AppsSubtab = "App Directory" | "Newly Observed" | "Official Context";
const APP_OBSERVATION_KEY = "zaf-tech-app-observations-v1";

type AppObservation = {
  url: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

function readObservations(): Record<string, AppObservation> {
  try {
    const value = JSON.parse(window.localStorage.getItem(APP_OBSERVATION_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, AppObservation>;
  } catch {
    return {};
  }
}

function hostFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\\./, "");
  } catch {
    return url;
  }
}

function appType(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith(".pi")) return "Pi domain";
    if (host.endsWith(".pinet.com")) return "PiNet address";
    return "Web address";
  } catch {
    return "Web address";
  }
}

function isAppsSubtab(value: string): value is AppsSubtab {
  return value === "App Directory" || value === "Newly Observed" || value === "Official Context";
}

export function ZafAppsData({ locale, subtab }: { locale: Locale; subtab: string }) {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [observations, setObservations] = useState<Record<string, AppObservation>>({});
  const [newUrls, setNewUrls] = useState<string[]>([]);

  const selected = isAppsSubtab(subtab) ? subtab : "App Directory";

  useEffect(() => {
    setObservations(readObservations());

    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/zaf/ecosystem", { cache: "no-store" });
        if (!response.ok) throw new Error("request failed");
        const next = (await response.json()) as EcosystemSnapshot;
        if (!active) return;

        const current = readObservations();
        const now = next.generatedAt;
        const fresh = next.apps.items
          .filter((item) => !current[item.url])
          .map((item) => item.url);

        const updated = { ...current };
        for (const item of next.apps.items) {
          const previous = updated[item.url];
          updated[item.url] = {
            url: item.url,
            firstSeenAt: previous?.firstSeenAt ?? now,
            lastSeenAt: now,
          };
        }

        try {
          window.localStorage.setItem(APP_OBSERVATION_KEY, JSON.stringify(updated));
        } catch {}

        setNewUrls(fresh);
        setObservations(updated);
        setSnapshot(next);
      } catch {
        if (active) setSnapshot(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const apps = useMemo(() => snapshot?.apps.items ?? [], [snapshot?.apps.items]);
  const filteredApps = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return apps;
    return apps.filter((app) => app.name.toLowerCase().includes(needle) || app.url.toLowerCase().includes(needle));
  }, [apps, query]);

  const newlyObserved = useMemo(
    () => apps.filter((app) => newUrls.includes(app.url)),
    [apps, newUrls]
  );

  const observedCount = apps.length;
  const newCount = newlyObserved.length;

  if (loading) {
    return (
      <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        {text(locale, "Loading observed app records…", "Gözlemlenen uygulama kayıtları yükleniyor…")}
      </section>
    );
  }

  if (!snapshot || !snapshot.apps.sourceAvailable) {
    return (
      <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {text(
            locale,
            "The Pi Ecosystem source is not currently available. ZAF TECH does not fabricate app records.",
            "Pi Ekosistem kaynağı şu anda erişilebilir değil. ZAF TECH uygulama kaydı uydurmaz.",
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {text(locale, selected, selected === "App Directory" ? "Uygulama Dizini" : selected === "Newly Observed" ? "Yeni Gözlemlenenler" : "Resmi Bağlam")}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {text(
              locale,
              "A source-backed directory view of application records exposed by the Pi Ecosystem.",
              "Pi Ekosisteminin açığa çıkardığı uygulama kayıtlarını kaynak destekli olarak gösteren dizin görünümü.",
            )}
          </p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          {observedCount} {text(locale, "observed records", "gözlemlenen kayıt")}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="text-lg font-bold ty-nums text-foreground">{observedCount}</div>
          <div className="mt-1 text-[11px] font-medium text-foreground">{text(locale, "Observed apps", "Gözlemlenen uygulama")}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{text(locale, "current source response", "mevcut kaynak yanıtı")}</div>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="text-lg font-bold ty-nums text-foreground">{newCount}</div>
          <div className="mt-1 text-[11px] font-medium text-foreground">{text(locale, "New this session", "Bu oturumda yeni")}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{text(locale, "compared with local history", "yerel geçmişle karşılaştırma")}</div>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-background/40 p-3 sm:col-span-1">
          <div className="text-lg font-bold text-foreground">{text(locale, "Live", "Canlı")}</div>
          <div className="mt-1 text-[11px] font-medium text-foreground">{text(locale, "Source status", "Kaynak durumu")}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{text(locale, "polled every 5 minutes", "5 dakikada bir kontrol")}</div>
        </div>
      </div>

      {selected === "Official Context" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-foreground">
              {text(locale, "What this directory represents", "Bu dizin neyi temsil ediyor?")}
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {text(
                locale,
                "Pi describes the Ecosystem Interface as a curated directory of Testnet and Mainnet community apps. The public source available to ZAF TECH currently exposes application records, but not reliable per-app network, category, activity, or staking fields.",
                "Pi, Ekosistem Arayüzünü Testnet ve Mainnet topluluk uygulamalarından oluşan seçilmiş bir dizin olarak tanımlar. ZAF TECH'in erişebildiği herkese açık kaynak şu anda uygulama kayıtlarını açığa çıkarıyor; ancak uygulama başına güvenilir ağ, kategori, aktivite veya staking alanları sunmuyor.",
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-foreground">
              {text(locale, "Important user boundary", "Önemli kullanıcı sınırı")}
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {text(
                locale,
                "Being listed does not mean ZAF TECH has reviewed or endorsed an app. Pi's own documentation tells Pioneers to assess individual apps themselves. Open an app only after checking its destination and what it asks you to approve.",
                "Bir uygulamanın listelenmesi ZAF TECH'in o uygulamayı incelediği veya onayladığı anlamına gelmez. Pi'nin kendi belgeleri de Pioneer'ların uygulamaları kendilerinin değerlendirmesi gerektiğini belirtir. Bir uygulamayı yalnızca hedefini ve sizden neyi onaylamanızı istediğini kontrol ettikten sonra açın.",
              )}
            </p>
          </div>
          <a
            href="https://ecosystem.pinet.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border border-border bg-background/40 px-3 py-2 text-[11px] font-medium text-foreground hover:bg-muted/40"
          >
            {text(locale, "Open official Pi Ecosystem", "Resmi Pi Ekosistemini Aç")} ↗
          </a>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <label className="sr-only" htmlFor="zaf-app-search">
              {text(locale, "Search apps", "Uygulama ara")}
            </label>
            <input
              id="zaf-app-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text(locale, "Search by app name or URL…", "Uygulama adı veya URL ile ara…")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {selected === "Newly Observed" && !newlyObserved.length ? (
            <div className="mt-4 rounded-xl border border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
              {text(
                locale,
                "No new app records have been observed since this browser established its local observation history.",
                "Bu tarayıcı yerel gözlem geçmişini oluşturduğundan beri yeni bir uygulama kaydı gözlemlenmedi.",
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(selected === "Newly Observed" ? newlyObserved : filteredApps).map((app) => (
                <a
                  key={app.url}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-xs font-medium text-foreground ty-clamp-2">{app.name}</div>
                    <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {appType(app.url)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[10px] text-muted-foreground">{hostFor(app.url)}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span>{text(locale, "Observed from Pi Ecosystem", "Pi Ekosisteminden gözlemlendi")}</span>
                    <span>↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {selected === "App Directory" && !filteredApps.length && (
            <div className="mt-4 rounded-xl border border-border p-4 text-[11px] text-muted-foreground">
              {text(locale, "No observed app matches this search.", "Bu aramayla eşleşen gözlemlenen uygulama yok.")}
            </div>
          )}
        </>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        {snapshot.apps.note} {text(locale, "App counts are source observations, not a claim about every Pi app in existence.", "Uygulama sayıları kaynak gözlemidir; var olan tüm Pi uygulamalarının sayısı olduğu iddia edilmez.")}
      </p>
    </section>
  );
}
