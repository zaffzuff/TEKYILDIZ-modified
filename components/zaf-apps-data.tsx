"use client";

import { useEffect, useMemo, useState } from "react";
import type { EcosystemSnapshot } from "@/lib/zaf/ecosystem";
import type { Locale } from "@/lib/zaf/i18n";

function text(locale: Locale, en: string, tr: string) {
  return locale === "tr" ? tr : en;
}

type AppsSubtab =
  | "All Apps"
  | "Mainnet"
  | "Testnet"
  | "New Apps"
  | "App Activity"
  | "App Categories"
  | "Ecosystem Staking";

function isSameSubtab(value: string): value is AppsSubtab {
  return [
    "All Apps",
    "Mainnet",
    "Testnet",
    "New Apps",
    "App Activity",
    "App Categories",
    "Ecosystem Staking",
  ].includes(value);
}

export function ZafAppsData({ locale, subtab }: { locale: Locale; subtab: string }) {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/zaf/ecosystem", { cache: "no-store" });
        if (!response.ok) throw new Error("request failed");
        const next = (await response.json()) as EcosystemSnapshot;
        if (active) setSnapshot(next);
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

  const apps = snapshot?.apps.items ?? [];
  const selected = isSameSubtab(subtab) ? subtab : "All Apps";

  const visibleApps = useMemo(() => {
    if (selected === "New Apps") return apps.slice(0, 12);
    return apps;
  }, [apps, selected]);

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

  const supported = selected === "All Apps" || selected === "New Apps";
  const detailByTab: Record<string, [string, string]> = {
    Mainnet: [
      "The current public ecosystem response does not expose a reliable network field for each observed app. ZAF TECH does not classify apps from names or URLs.",
      "Mevcut herkese açık ekosistem yanıtı her uygulama için güvenilir bir ağ alanı açığa çıkarmıyor. ZAF TECH isim veya URL'den uygulama ağı sınıflandırmaz.",
    ],
    Testnet: [
      "Testnet classification requires an explicit source field. It is not inferred from application URLs or titles.",
      "Testnet sınıflandırması açık bir kaynak alanı gerektirir. Uygulama URL veya başlıklarından tahmin edilmez.",
    ],
    "App Activity": [
      "The current source exposes app records but not a standardized per-app activity metric. Blockchain activity shown elsewhere is not attributed to individual apps.",
      "Mevcut kaynak uygulama kayıtlarını açığa çıkarıyor ancak standartlaştırılmış uygulama başına aktivite metriği sunmuyor. Diğer bölümlerdeki blockchain aktivitesi tek tek uygulamalara atfedilmez.",
    ],
    "App Categories": [
      "Categories are shown only when the source exposes them explicitly. The current response does not provide a reliable category field.",
      "Kategoriler yalnızca kaynak bunları açıkça sunduğunda gösterilir. Mevcut yanıt güvenilir bir kategori alanı sağlamıyor.",
    ],
    "Ecosystem Staking": [
      "Staking requires explicit per-app staking data. Current observed app records do not expose those amounts.",
      "Staking için uygulama başına açık staking verisi gerekir. Mevcut gözlemlenen uygulama kayıtları bu miktarları açığa çıkarmıyor.",
    ],
  };

  return (
    <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {text(locale, selected, selected === "All Apps" ? "Tüm Uygulamalar" : selected)}
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {text(
              locale,
              "Only application records exposed by the official Pi ecosystem source are shown.",
              "Yalnızca resmi Pi ekosistem kaynağının açığa çıkardığı uygulama kayıtları gösterilir.",
            )}
          </p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          {apps.length} {text(locale, "observed", "gözlemlenen")}
        </div>
      </div>

      {!supported ? (
        <div className="mt-4 rounded-xl border border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
          {text(locale, detailByTab[selected]?.[0] ?? "", detailByTab[selected]?.[1] ?? "")}
        </div>
      ) : visibleApps.length ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visibleApps.map((app) => (
            <a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="text-xs font-medium text-foreground ty-clamp-2">{app.name}</div>
              <div className="mt-1 truncate text-[10px] text-muted-foreground">{app.url}</div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {text(locale, "Observed from Pi Ecosystem source", "Pi Ekosistem kaynağından gözlemlendi")}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border p-4 text-[11px] text-muted-foreground">
          {text(
            locale,
            "The source is reachable, but application records are dynamically rendered and are not exposed in the server response.",
            "Kaynak erişilebilir durumda ancak uygulama kayıtları dinamik oluşturulduğu için sunucu yanıtında açığa çıkmıyor.",
          )}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        {snapshot.apps.note}
      </p>
    </section>
  );
}
