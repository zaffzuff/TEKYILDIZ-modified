"use client";

import { useEffect, useState } from "react";
import type { EcosystemSnapshot } from "@/lib/zaf/ecosystem";
import type { Locale } from "@/lib/zaf/i18n";

const STORAGE_KEY = "zaf-tech-ecosystem-snapshot-v1";

function text(locale: Locale, en: string, tr: string) {
  return locale === "tr" ? tr : en;
}

function timeAgo(value: string, locale: Locale) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (locale === "tr") {
    if (seconds < 60) return `${seconds} sn önce`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    return `${Math.floor(minutes / 60)} sa önce`;
  }
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function saveSnapshot(snapshot: EcosystemSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      generatedAt: snapshot.generatedAt,
      apps: snapshot.apps.items.map((item) => item.url),
      news: snapshot.news.map((item) => item.url),
    }));
  } catch {}
}

function getPreviousSnapshot(): { apps: string[]; news: string[] } | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!value || !Array.isArray(value.apps) || !Array.isArray(value.news)) return null;
    return value;
  } catch {
    return null;
  }
}

export function ZafEcosystemOverview({ locale }: { locale: Locale }) {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [newApps, setNewApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch("/api/zaf/ecosystem", { cache: "no-store" });
      if (!response.ok) throw new Error("Ecosystem request failed");
      const next = (await response.json()) as EcosystemSnapshot;
      const previous = getPreviousSnapshot();
      if (previous) {
        const previousApps = new Set(previous.apps);
        setNewApps(next.apps.items.filter((item) => !previousApps.has(item.url)).map((item) => item.name));
      }
      saveSnapshot(next);
      setSnapshot(next);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5 * 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading && !snapshot) {
    return <section className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">Loading ecosystem intelligence…</section>;
  }

  if (!snapshot) {
    return <section className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">{text(locale, "Ecosystem intelligence is temporarily unavailable.", "Ekosistem zekâ verisi şu anda kullanılamıyor.")}</section>;
  }

  const availableSources = snapshot.sources.filter((source) => source.status === "available").length;
  const totalSources = snapshot.sources.length;

  return (
    <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">{text(locale, "Pi Ecosystem Overview", "Pi Ekosistem Genel Bakışı")}</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {text(locale, "A live observation layer for apps, official updates and ecosystem changes.", "Uygulamaları, resmi güncellemeleri ve ekosistem değişikliklerini izleyen canlı gözlem katmanı.")}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground">{text(locale, "Updated", "Güncellendi")} {timeAgo(snapshot.generatedAt, locale)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [text(locale, "Sources", "Kaynaklar"), `${availableSources}/${totalSources}`, text(locale, "live sources", "erişilebilir kaynak")],
          [text(locale, "Apps", "Uygulamalar"), snapshot.apps.totalCount?.toLocaleString(locale === "tr" ? "tr-TR" : "en-US") ?? "—", text(locale, "observed", "gözlemlenen")],
          [text(locale, "Official News", "Resmi Haber"), snapshot.news.length.toString(), text(locale, "recent items", "son içerik")],
          [text(locale, "Refresh", "Yenileme"), "5m", text(locale, "client polling", "istemci kontrolü")],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="text-lg font-bold ty-nums text-foreground">{value}</div>
            <div className="mt-1 text-[11px] font-medium text-foreground">{label}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{detail}</div>
          </div>
        ))}
      </div>

      {newApps.length > 0 && (
        <div className="mt-3 rounded-xl border border-ty-gold/40 bg-ty-gold-soft/20 p-3">
          <div className="text-xs font-semibold text-foreground">{text(locale, "New app detected", "Yeni uygulama algılandı")}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{newApps.slice(0, 5).join(" · ")}</div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <div className="text-xs font-semibold text-foreground">{text(locale, "Latest Ecosystem Changes", "Son Ekosistem Değişiklikleri")}</div>
          <div className="mt-2 space-y-2">
            {snapshot.changes.slice(0, 5).map((change, index) => (
              <div key={`${change.type}-${index}`} className="border-b border-border pb-2 last:border-b-0 last:pb-0">
                <div className="text-[11px] font-medium text-foreground ty-clamp-2">{change.title}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{change.detail}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <div className="text-xs font-semibold text-foreground">{text(locale, "Official Pi News", "Pi Resmi Haberleri")}</div>
          <div className="mt-2 space-y-2">
            {snapshot.news.slice(0, 4).map((item) => (
              <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-transparent p-1.5 hover:border-border hover:bg-background/40">
                <div className="text-[11px] font-medium text-foreground ty-clamp-2">{item.title}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{text(locale, "Official Pi source", "Resmi Pi kaynağı")}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {text(locale, "The directory source may render app records dynamically. ZAF TECH does not invent app counts or activity when the source does not expose them.", "Dizin kaynağı uygulama kayıtlarını dinamik oluşturabilir. Kaynak veriyi göstermediğinde ZAF TECH uygulama sayısı veya aktivite uydurmaz.")}
      </div>
    </section>
  );
}
