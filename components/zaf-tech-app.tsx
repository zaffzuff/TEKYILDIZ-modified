"use client";

import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { ZafSnapshot } from "@/lib/zaf/types";
import type { Locale } from "@/lib/zaf/i18n";
import { localeLabels } from "@/lib/zaf/i18n";
import { ZafEcosystemNavigation, type ZafSection } from "@/components/zaf-ecosystem-navigation";
import { ZafNodeCompute } from "@/components/zaf-node-compute";
import { ZafAppHealth } from "@/components/zaf-app-health";
import { ZafDeveloperTools } from "@/components/zaf-developer-tools";
import { ZafWalletIntelligence } from "@/components/zaf-wallet-intelligence";
import { APP_CATEGORIES, toDirectoryApp, type AppCategory } from "@/lib/zaf/app-directory";
import { useMemo } from "react";

type AppItem = { name: string; url: string };
type EcosystemPayload = {
  generatedAt: string;
  apps: { sourceAvailable: boolean; totalCount: number | null; items: AppItem[]; note: string };
  sources: Array<{ label: string; status: string; url: string; detail: string }>;
};

function number(value: number | null | undefined, digits = 0) {
  return value == null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function age(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const ms = Date.now() - Date.parse(value);
  if (!Number.isFinite(ms)) return "—";
  const min = Math.floor(ms / 60000);
  return locale === "tr" ? (min < 1 ? "az önce" : min < 60 ? `${min} dk önce` : `${Math.floor(min / 60)} sa önce`) : (min < 1 ? "just now" : min < 60 ? `${min}m ago` : `${Math.floor(min / 60)}h ago`);
}
function Card({ title, value, detail }: { title: string; value: string; detail?: string }) {
  return <div className="rounded-xl border border-border bg-card p-3 sm:p-4"><div className="text-xl font-bold ty-nums text-foreground sm:text-2xl">{value}</div><div className="mt-1 text-xs font-medium text-foreground">{title}</div>{detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}</div>;
}
function External({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">{children}</a>;
}

function AppDirectoryView({ apps, sourceOnline, generatedAt, note, locale, tr }: { apps: AppItem[]; sourceOnline: boolean; generatedAt?: string; note?: string; locale: Locale; tr: (en: string, trText: string) => string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | AppCategory>("All");
  const directoryApps = useMemo(() => apps.map(app => toDirectoryApp(app, generatedAt ?? new Date().toISOString())), [apps, generatedAt]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryApps.filter(app => {
      const matchesQuery = !q || app.name.toLowerCase().includes(q) || app.url.toLowerCase().includes(q);
      const matchesCategory = category === "All" || app.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [directoryApps, query, category]);

  return (
    <section className="mt-5 sm:mt-7">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{tr("Pi App Directory", "Pi Uygulama Dizini")}</h2>
        <p className="text-[11px] text-muted-foreground">{tr("Structured discovery of applications observed from the public Pi ecosystem source.", "Herkese açık Pi ekosistem kaynağında gözlemlenen uygulamaların yapılandırılmış keşfi.")}</p>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card title={tr("Observed", "Gözlemlenen")} value={number(directoryApps.length)} detail={tr("Current source response", "Mevcut kaynak yanıtı")} />
        <Card title={tr("Matching", "Eşleşen")} value={number(filtered.length)} detail={tr("Current filters", "Mevcut filtreler")} />
        <Card title={tr("Source", "Kaynak")} value={sourceOnline ? "ONLINE" : "OFFLINE"} detail={age(generatedAt, locale)} />
      </div>
      <div className="rounded-xl border border-border bg-card p-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("Search apps or URLs…", "Uygulama veya URL ara…")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring" />
        <div className="mt-2 overflow-x-auto ty-no-scrollbar">
          <div className="flex min-w-max gap-1">
            <button type="button" onClick={() => setCategory("All")} className={`rounded-md border px-2.5 py-1.5 text-[10px] font-medium ${category === "All" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>{tr("All", "Tümü")}</button>
            {APP_CATEGORIES.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-md border px-2.5 py-1.5 text-[10px] font-medium ${category === item ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>{item}</button>)}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {filtered.map(app => (
          <article key={app.url} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-foreground">{app.name}</h3>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{app.url}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <a href={`/ecosystem/${app.slug}`} className="rounded-md bg-foreground px-2.5 py-1.5 text-[10px] font-medium text-background">{tr("Details", "Detay")}</a>
                <a href={app.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-muted">{tr("Open", "Aç")}</a>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{app.category}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{tr("Pi features: not verified", "Pi özellikleri: doğrulanmadı")}</span>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? <div className="mt-3 rounded-xl border border-border bg-card p-4 text-[11px] text-muted-foreground">{apps.length ? tr("No applications match the current filters.", "Mevcut filtrelerle eşleşen uygulama yok.") : note}</div> : null}
      <div className="mt-3 rounded-xl border border-border bg-card p-3 text-[10px] leading-relaxed text-muted-foreground">
        {tr("Category is a ZAF TECH classification based on the public app name/URL signal, not an official Pi category. Pi Authentication, Pi Payments, PiNet, network and health fields remain unverified until a dedicated observable check confirms them.", "Kategori, herkese açık uygulama adı/URL sinyaline dayalı ZAF TECH sınıflandırmasıdır; resmi Pi kategorisi değildir. Pi Authentication, Pi Payments, PiNet, ağ ve sağlık alanları özel bir gözlemlenebilir kontrol doğrulayana kadar doğrulanmamış olarak kalır.")}
      </div>
    </section>
  );
}



type EcosystemStatisticsPayload = {
  generatedAt: string;
  current: {
    observedApps: number | null;
    availableSources: number;
    totalSources: number;
    observedSignals: number;
    officialSignals: number;
    defi: { launchpad: string; dex: string; amm: string; mainnetTrading: string };
  };
  history: {
    configured: boolean;
    snapshots: number;
    firstObservedAt: string | null;
    latestObservedAt: string | null;
    appCounts: number[];
  };
};

type EcosystemChangePayload = {
  configured: boolean;
  comparedAt: string | null;
  hasBaseline: boolean;
  changes: Array<{
    type: string;
    title: string;
    detail: string;
    detailTr: string;
    previous: string | number | null;
    current: string | number | null;
  }>;
};

function ObservatoryStatisticsView({ locale, tr }: { locale: Locale; tr: (en: string, trText: string) => string }) {
  const [data, setData] = useState<EcosystemStatisticsPayload | null>(null);
  const [changes, setChanges] = useState<EcosystemChangePayload | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/zaf/ecosystem/statistics", { cache: "no-store" }).then(response => response.ok ? response.json() : null),
      fetch("/api/zaf/ecosystem/changes", { cache: "no-store" }).then(response => response.ok ? response.json() : null),
    ])
      .then(([statistics, changeData]) => {
        if (!active) return;
        setData(statistics);
        setChanges(changeData);
      })
      .catch(() => {
        if (!active) return;
        setData(null);
        setChanges(null);
      })
      .finally(() => { if (active) setLoadingStats(false); });
    return () => { active = false; };
  }, []);

  if (loadingStats) return <div className="py-10 text-center text-xs text-muted-foreground">{tr("Loading Statistics…", "İstatistikler Yükleniyor…")}</div>;

  return (
    <section className="mt-5 sm:mt-7">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{tr("Activity Signals", "Aktivite Sinyalleri")}</h2>
        <p className="text-[11px] text-muted-foreground">{tr("Current observations, stored snapshots and detected changes from public ecosystem sources.", "Herkese açık ekosistem kaynaklarından mevcut gözlemler, kayıtlı snapshot'lar ve tespit edilen değişiklikler.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card title={tr("Observed Apps", "Gözlemlenen Uygulamalar")} value={number(data?.current.observedApps)} />
        <Card title={tr("Available Sources", "Kullanılabilir Kaynaklar")} value={data ? `${data.current.availableSources}/${data.current.totalSources}` : "—"} />
        <Card title={tr("Observed Signals", "Gözlemlenen Sinyaller")} value={number(data?.current.observedSignals)} />
        <Card title={tr("Official Signals", "Resmi Sinyaller")} value={number(data?.current.officialSignals)} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-foreground">{tr("Detected Changes", "Tespit Edilen Değişiklikler")}</div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {changes?.hasBaseline
                ? `${tr("Compared with", "Karşılaştırma")}: ${age(changes.comparedAt, locale)}`
                : tr("A baseline is not available yet.", "Henüz karşılaştırılacak bir temel snapshot yok.")}
            </p>
          </div>
          <span className="rounded-full border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">{number(changes?.changes.length)} {tr("changes", "değişiklik")}</span>
        </div>
        <div className="mt-3 space-y-2">
          {changes?.changes.slice(0, 8).map(change => (
            <div key={`${change.type}-${change.title}`} className="rounded-lg border border-border p-3">
              <div className="text-[11px] font-semibold text-foreground">{change.title}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{locale === "tr" ? change.detailTr : change.detail}</p>
              {(change.previous != null || change.current != null) ? (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {String(change.previous ?? "—")} → {String(change.current ?? "—")}
                </div>
              ) : null}
            </div>
          ))}
          {changes?.hasBaseline && !changes.changes.length ? (
            <div className="rounded-lg border border-border p-3 text-[10px] text-muted-foreground">{tr("No changes detected between the current observation and the latest stored snapshot.", "Mevcut gözlem ile son kayıtlı snapshot arasında değişiklik tespit edilmedi.")}</div>
          ) : null}
          {!changes?.hasBaseline ? (
            <div className="rounded-lg border border-border p-3 text-[10px] leading-relaxed text-muted-foreground">{tr("Changes will appear after at least one scheduled or persisted snapshot is available.", "En az bir zamanlanmış veya kaydedilmiş snapshot oluştuğunda değişiklikler burada görünecek.")}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card title="Launchpad" value={data?.current.defi.launchpad.toUpperCase() ?? "—"} />
        <Card title="DEX" value={data?.current.defi.dex.toUpperCase() ?? "—"} />
        <Card title="AMM" value={data?.current.defi.amm.toUpperCase() ?? "—"} />
        <Card title={tr("Mainnet Trading", "Mainnet İşlemleri")} value={data?.current.defi.mainnetTrading.toUpperCase() ?? "—"} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Historical Snapshots", "Tarihsel Snapshot'lar")}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card title={tr("Stored Snapshots", "Kayıtlı Snapshot'lar")} value={number(data?.history.snapshots)} />
          <Card title={tr("Storage", "Depolama")} value={data?.history.configured ? "ACTIVE" : "NOT CONFIGURED"} detail={tr("DATABASE_URL", "DATABASE_URL")} />
          <Card title={tr("First Snapshot", "İlk Snapshot")} value={age(data?.history.firstObservedAt, locale)} />
          <Card title={tr("Latest Snapshot", "Son Snapshot")} value={age(data?.history.latestObservedAt, locale)} />
        </div>
        {!data?.history.configured ? <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{tr("Historical storage is optional. Live observations remain available while DATABASE_URL is not configured.", "Tarihsel depolama isteğe bağlıdır. DATABASE_URL yapılandırılmamış olsa da canlı gözlemler kullanılabilir.")}</p> : null}
      </div>
    </section>
  );
}

