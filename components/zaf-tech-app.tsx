"use client";

import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { ZafSnapshot } from "@/lib/zaf/types";
import type { Locale } from "@/lib/zaf/i18n";
import { localeLabels, translate } from "@/lib/zaf/i18n";
import { ZafEcosystemNavigation, ZAF_SECTION_TABS, type ZafSection } from "@/components/zaf-ecosystem-navigation";
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
function displayStatus(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const normalized = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  const known: Record<string, [string, string, string]> = {
    online: ["Online", "En Línea", "En Línea"],
    offline: ["Offline", "Fuera De Línea", "Fuera De Línea"],
    available: ["Available", "Kullanılabilir", "Disponible"],
    unavailable: ["Unavailable", "Kullanılamıyor", "No Disponible"],
    error: ["Error", "Hata", "Error"],
    active: ["Active", "Aktif", "Activo"],
    "not configured": ["Not configured", "Yapılandırılmadı", "No Configurado"],
    rising: ["Rising", "Yükseliyor", "Subiendo"],
    stable: ["Stable", "Sabit", "Estable"],
    falling: ["Falling", "Düşüyor", "Bajando"],
    observed: ["Observed", "Gözlemlendi", "Observado"],
    unverified: ["Unverified", "Doğrulanmadı", "No Verificado"],
  };
  const pair = known[normalized];
  if (pair) return locale === "tr" ? pair[1] : locale === "es" ? pair[2] : pair[0];
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return label;
}
function age(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const ms = Date.now() - Date.parse(value);
  if (!Number.isFinite(ms)) return "—";
  const min = Math.floor(ms / 60000);
  return locale === "tr" ? (min < 1 ? "Az Önce" : min < 60 ? `${min} Dk Önce` : `${Math.floor(min / 60)} Sa Önce`) : locale === "es" ? (min < 1 ? "Ahora Mismo" : min < 60 ? `${min} Min Antes` : `${Math.floor(min / 60)} H Antes`) : (min < 1 ? "Just Now" : min < 60 ? `${min}m Ago` : `${Math.floor(min / 60)}h Ago`);
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
        <Card title={tr("Observed", "Gözlemlenen")} value={number(directoryApps.length)} detail={tr("Current Source Response", "Mevcut Kaynak Yanıtı")} />
        <Card title={tr("Matching", "Eşleşen")} value={number(filtered.length)} detail={tr("Current Filters", "Mevcut Filtreler")} />
        <Card title={tr("Source", "Kaynak")} value={displayStatus(sourceOnline ? "online" : "offline", locale)} detail={age(generatedAt, locale)} />
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
              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{tr("Pi Features: Not Verified", "Pi Özellikleri: Doğrulanmadı")}</span>
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



function ObservatoryExplorerView({ apps, sources, snapshot, locale, tr }: {
  apps: AppItem[];
  sources: EcosystemPayload["sources"];
  snapshot: ZafSnapshot | null;
  locale: Locale;
  tr: (en: string, trText: string) => string;
}) {
  return (
    <section className="mt-5 sm:mt-7">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{tr("Ecosystem Explorer", "Ekosistem Explorer")}</h2>
        <p className="text-[11px] text-muted-foreground">{tr("Explore the public ecosystem sources and applications currently observable by ZAF TECH.", "ZAF TECH tarafından şu anda gözlemlenebilen herkese açık ekosistem kaynaklarını ve uygulamaları keşfedin.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card title={tr("Observed Apps", "Gözlemlenen Uygulamalar")} value={number(apps.length)} />
        <Card title={tr("Public Sources", "Herkese Açık Kaynaklar")} value={number(sources.length)} />
        <Card title={tr("Latest Ledger", "Son Ledger")} value={snapshot?.latestLedger?.sequence?.toString() ?? "—"} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Public Ecosystem Sources", "Herkese Açık Ekosistem Kaynakları")}</div>
        <div className="mt-3 space-y-2">
          {sources.length ? sources.map(source => (
            <div key={source.url} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-foreground">{source.label}</div>
                <div className="mt-1 break-all text-[10px] text-muted-foreground">{source.detail}</div>
              </div>
              <a href={source.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-muted">{tr("Open Source", "Kaynağı Aç")}</a>
            </div>
          )) : (
            <div className="text-[10px] text-muted-foreground">{tr("No public sources are currently available.", "Şu anda kullanılabilir herkese açık kaynak yok.")}</div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Observed Applications", "Gözlemlenen Uygulamalar")}</div>
        <div className="mt-3 space-y-2">
          {apps.slice(0, 10).map(app => (
            <div key={app.url} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-foreground">{app.name}</div>
                <div className="mt-1 truncate text-[10px] text-muted-foreground">{app.url}</div>
              </div>
              <a href={app.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-muted">{tr("Open", "Aç")}</a>
            </div>
          ))}
          {!apps.length ? <div className="text-[10px] text-muted-foreground">{tr("No observed applications are currently available.", "Şu anda gözlemlenen uygulama yok.")}</div> : null}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Explorer Boundary", "Explorer Sınırı")}</div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{tr("Explorer exposes only public sources and records already observed by ZAF TECH. It does not add unverified ecosystem claims or perform Pi-side integration.", "Explorer yalnızca ZAF TECH tarafından gözlemlenmiş herkese açık kaynakları ve kayıtları gösterir. Doğrulanmamış ekosistem iddiaları eklemez ve Pi tarafı entegrasyonu gerçekleştirmez.")}</p>
      </div>
    </section>
  );
}

export function ZafTechApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [section, setSection] = useState<ZafSection>("overview");
  const [subtab, setSubtab] = useState("Ecosystem");
  const [snapshot, setSnapshot] = useState<ZafSnapshot | null>(null);
  const [ecosystem, setEcosystem] = useState<EcosystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tr = (en: string, trText: string) => translate(locale, en, trText);

  useEffect(() => {
    const l = window.localStorage.getItem("zaf-tech-locale-v1");
    if (l === "en" || l === "tr") setLocale(l);
    const t = window.localStorage.getItem("zaf-tech-theme-v1");
    if (t === "light" || t === "dark") setTheme(t);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("zaf-tech-theme-v1", theme);
  }, [theme]);
  useEffect(() => {
    window.localStorage.setItem("zaf-tech-locale-v1", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [network, apps] = await Promise.all([
        fetch("/api/zaf", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/zaf/ecosystem", { cache: "no-store" }).then(r => r.json()),
      ]);
      setSnapshot(network);
      setEcosystem(apps);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(id);
  }, [load]);

  const apps = ecosystem?.apps.items ?? [];
  const sourceOnline = ecosystem?.apps.sourceAvailable ?? false;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-10">
        <header className="border-b border-border pb-5 pt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/zaf-tech-logo.png" alt="ZAF TECH" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" priority />
              <div className="min-w-0">
                <div className="text-2xl font-bold tracking-tight ty-brand-text">ZAF TECH</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr("Pi Ecosystem Observatory", "Pi Ekosistem Gözlem Merkezi")}</p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <select value={locale} onChange={e => setLocale(e.target.value as Locale)} aria-label={tr("Language", "Dil")} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground">
                {(["en", "es", "tr"] as Locale[]).sort((a, b) => localeLabels[a].localeCompare(localeLabels[b], "en")).map(option => <option key={option} value={option}>{localeLabels[option]}</option>)}
              </select>
              <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground">{theme === "light" ? `☾ ${tr("Dark", "Koyu")}` : `☀ ${tr("Light", "Açık")}`}</button>
              <button type="button" onClick={() => void load()} disabled={refreshing} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">{refreshing ? tr("Refreshing…", "Yenileniyor…") : tr("Refresh", "Yenile")}</button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Pi Network", "Pi Network")}</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Mainnet", "Mainnet")}</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Read-only", "Salt-okunur")}</span>
            <span className={`rounded-full border px-2.5 py-1 ${sourceOnline ? "border-ty-active/40 text-foreground" : "border-border text-muted-foreground"}`}>{sourceOnline ? tr("Ecosystem Source Online", "Ekosistem Kaynağı Çevrimiçi") : tr("Source Unavailable", "Kaynak Kullanılamıyor")}</span>
          </div>
          <ZafEcosystemNavigation locale={locale} section={section} subtab={subtab} onSectionChange={(next) => { setSection(next); const first = ZAF_SECTION_TABS[next][0] ?? ""; setSubtab(first); }} onSubtabChange={setSubtab} />
          <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ty-active" />{tr("Live Observations", "Canlı Gözlemler")}</span>
            <span>{tr("Updated", "Güncellendi")} {age(snapshot?.generatedAt, locale)}</span>
          </div>
        </header>

        {loading ? <div className="py-12 text-center text-sm text-muted-foreground">{tr("Loading Ecosystem Observatory…", "Ekosistem Gözlemleri Yükleniyor…")}</div> : null}

        {!loading && section === "overview" && subtab === "Ecosystem" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("Pi Ecosystem Observatory", "Pi Ekosistem Gözlem Merkezi")}</h2><p className="text-[11px] text-muted-foreground">{tr("A read-only technology layer for discovering observable Pi ecosystem data, applications and Node infrastructure.", "Gözlemlenebilir Pi ekosistem verilerini, uygulamaları ve Node altyapısını keşfetmek için salt-okunur teknoloji katmanı.")}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Observed Apps", "Gözlemlenen Uygulamalar")} value={number(ecosystem?.apps.totalCount)} detail={tr("Current Public Source Response", "Mevcut Herkese Açık Kaynak Yanıtı")} />
              <Card title={tr("Recent Ledgers", "Son Ledger'lar")} value={number(snapshot?.metrics.recentLedgerCount)} detail={tr("Pi Mainnet Observation Window", "Pi Mainnet Gözlem Penceresi")} />
              <Card title={tr("Transactions", "İşlemler")} value={number(snapshot?.metrics.recentTransactions)} detail={tr("Current Sample", "Mevcut Örnek")} />
              <Card title={tr("Protocol", "Protokol")} value={snapshot?.metrics.latestProtocolVersion != null ? `v${snapshot.metrics.latestProtocolVersion}` : "—"} detail={tr("Latest Observed Ledger", "Son Gözlemlenen Ledger")} />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold text-foreground">{tr("What ZAF TECH does", "ZAF TECH ne yapar")}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tr("ZAF TECH is an independent, read-only technology project. It observes public ecosystem sources and local Node diagnostics; it does not represent Pi Core Team and does not assign subjective network health scores.", "ZAF TECH bağımsız, salt-okunur bir teknoloji projesidir. Herkese açık ekosistem kaynaklarını ve yerel Node teşhislerini gözlemler; Pi Core Team'i temsil etmez ve öznel ağ sağlık puanları üretmez.")}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px]"><External href="https://minepi.com/developers/">{tr("Pi Developers", "Pi Geliştiricileri")}</External><External href="https://developers.minepi.com/">{tr("Developer Docs", "Geliştirici Dokümanları")}</External><External href="https://ecosystem.pinet.com/">{tr("Pi Ecosystem", "Pi Ekosistemi")}</External></div>
            </div>
          </section>
        ) : null}

        {!loading && section === "apps" && subtab === "App Health" ? <ZafAppHealth locale={locale} /> : null}

        {!loading && section === "apps" && subtab === "App Directory" ? <AppDirectoryView apps={apps} sourceOnline={sourceOnline} generatedAt={ecosystem?.generatedAt} note={ecosystem?.apps.note} locale={locale} tr={tr} /> : null}

        {!loading && section === "intelligence" && subtab === "Radar" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("Ecosystem Radar", "Ekosistem Radarı")}</h2><p className="text-[11px] text-muted-foreground">{tr("Measured signals from public sources and observable Mainnet activity.", "Herkese açık kaynaklardan ve gözlemlenebilir Mainnet aktivitesinden ölçülen sinyaller.")}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Card title={tr("Activity State", "Aktivite Durumu")} value={displayStatus(snapshot?.intelligence.activityState, locale)} detail={tr("Descriptive, Not Predictive", "Tanımlayıcı, Tahmin Edici Değil")} /><Card title={tr("Tx / Hour", "İşlem / Saat")} value={number(snapshot?.metrics.observedTransactionsPerHour, 1)} /><Card title={tr("Operations / Hour", "Operasyon / Saat")} value={number(snapshot?.metrics.observedOperationsPerHour, 1)} /></div>
            <div className="mt-3 rounded-xl border border-border bg-card p-4"><div className="text-xs font-semibold text-foreground">{tr("Measurement Boundary", "Ölçüm Sınırı")}</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tr("These signals describe the sampled public blockchain data only. They are not a score for Pi Network, do not infer user intent, and do not predict future network behavior.", "Bu sinyaller yalnızca örneklenen herkese açık blockchain verisini tanımlar. Pi Network için puan değildir, kullanıcı niyeti çıkarmaz ve gelecekteki ağ davranışını tahmin etmez.")}</p></div>
          </section>
        ) : null}

        {!loading && section === "node" ? <ZafNodeCompute locale={locale} data={snapshot} subtab={subtab} /> : null}

        {!loading && section === "wallet" ? <ZafWalletIntelligence locale={locale} /> : null}

        {!loading && section === "intelligence" && subtab === "Activity Signals" ? <ObservatoryStatisticsView locale={locale} tr={tr} /> : null}

        {!loading && section === "intelligence" && subtab === "Explorer" ? <ObservatoryExplorerView apps={apps} sources={ecosystem?.sources ?? []} snapshot={snapshot} locale={locale} tr={tr} /> : null}

        {!loading && section === "overview" && subtab === "Network" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">{tr("Pi Network", "Pi Network")}</h2>
              <p className="text-[11px] text-muted-foreground">{tr("Observable Mainnet data from Pi Mainnet Horizon. This is a read-only view, not a claim of full-network coverage.", "Pi Mainnet Horizon üzerinden gözlemlenen Mainnet verileri. Bu salt-okunur görünüm tüm ağın eksiksiz temsili olduğu iddiasında değildir.")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Network", "Ağ")} value={snapshot?.network ?? "—"} detail={tr("Observed Source", "Gözlemlenen Kaynak")} />
              <Card title={tr("Protocol", "Protokol")} value={snapshot?.metrics.latestProtocolVersion != null ? `v${snapshot.metrics.latestProtocolVersion}` : "—"} detail={tr("Latest Observed Ledger", "Son Gözlemlenen Ledger")} />
              <Card title={tr("Latest Ledger", "Son Ledger")} value={snapshot?.latestLedger?.sequence ?? "—"} detail={snapshot?.latestLedger?.closedAt ? age(snapshot.latestLedger.closedAt, locale) : "—"} />
              <Card title={tr("Data Status", "Veri Durumu")} value={displayStatus(snapshot?.error ? "error" : snapshot?.latestLedger ? "available" : "unavailable", locale)} detail={snapshot?.error ?? tr("Pi Mainnet Horizon response observed.", "Pi Mainnet Horizon yanıtı gözlemlendi.")} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Transactions", "İşlemler")} value={number(snapshot?.metrics.recentTransactions)} detail={tr("Current Sample", "Mevcut Örnek")} />
              <Card title={tr("Operations", "Operasyonlar")} value={number(snapshot?.metrics.recentOperations)} detail={tr("Current Sample", "Mevcut Örnek")} />
              <Card title={tr("Tx / Hour", "İşlem / Saat")} value={number(snapshot?.metrics.observedTransactionsPerHour, 1)} />
              <Card title={tr("Ops / Hour", "Operasyon / Saat")} value={number(snapshot?.metrics.observedOperationsPerHour, 1)} />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold text-foreground">{tr("Network Measurement Boundary", "Ağ Ölçüm Sınırı")}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tr("ZAF TECH reads public Mainnet Horizon data and reports the observed sample. It does not use a private node as the authority for the entire Pi Network and does not assign a subjective network health score.", "ZAF TECH herkese açık Mainnet Horizon verisini okur ve gözlemlenen örneği raporlar. Özel bir node'u tüm Pi Network için otorite olarak kullanmaz ve öznel bir ağ sağlık puanı üretmez.")}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
                <External href="https://api.mainnet.minepi.com">{tr("Pi Mainnet Horizon", "Pi Mainnet Horizon")}</External>
                <span className="text-muted-foreground">{tr("Updated", "Güncellendi")} {age(snapshot?.generatedAt, locale)}</span>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && section === "overview" && subtab === "Tools" ? <ZafDeveloperTools locale={locale} /> : null}

        <footer className="mt-8 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>ZAF TECH · Pi Ecosystem Observatory</span>
            <span>{tr("Independent community-developed technology project", "Bağımsız topluluk geliştirimi teknoloji projesi")}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <a href="/about" className="underline underline-offset-2">{tr("About", "Hakkında")}</a>
            <a href="/privacy" className="underline underline-offset-2">{tr("Privacy", "Gizlilik")}</a>
          </div>
        </footer>
      </main>
    </div>
  );
}


type EcosystemTrendPayload = {
  configured: boolean;
  points: Array<{
    generatedAt: string;
    observedAppCount: number | null;
    sourceAvailable: boolean;
    availableSources: number;
    totalSources: number;
    signalCount: number;
  }>;
};

function TrendView({ points, locale, tr }: { points: EcosystemTrendPayload["points"]; locale: Locale; tr: (en: string, trText: string) => string }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-semibold text-foreground">{tr("Ecosystem Trend", "Ekosistem Trendi")}</div>
      <p className="mt-1 text-[10px] text-muted-foreground">{tr("Stored observations over time.", "Zaman içindeki kayıtlı gözlemler.")}</p>
      <div className="mt-3 space-y-1.5">
        {points.length ? points.slice(-12).map((point) => (
          <div key={point.generatedAt} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[10px]">
            <span className="text-muted-foreground">{new Date(point.generatedAt).toLocaleString(locale === "es" ? "es-ES" : locale === "tr" ? "tr-TR" : "en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="text-foreground">{point.observedAppCount ?? "—"} {tr("apps", "uygulama")}</span>
            <span className="text-muted-foreground">{point.signalCount} {tr("signals", "sinyal")}</span>
          </div>
        )) : (
          <div className="text-[10px] text-muted-foreground">{tr("No stored trend points yet.", "Henüz kayıtlı trend noktası yok.")}</div>
        )}
      </div>
    </div>
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
  const [trends, setTrends] = useState<EcosystemTrendPayload | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/zaf/ecosystem/statistics", { cache: "no-store" }).then(response => response.ok ? response.json() : null),
      fetch("/api/zaf/ecosystem/changes", { cache: "no-store" }).then(response => response.ok ? response.json() : null),
      fetch("/api/zaf/ecosystem/trends", { cache: "no-store" }).then(response => response.ok ? response.json() : null),
    ])
      .then(([statistics, changeData, trendData]) => {
        if (!active) return;
        setData(statistics);
        setChanges(changeData);
        setTrends(trendData);
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
        <div className="text-xs font-semibold text-foreground">{tr("Observation Metadata", "Gözlem Metaverisi")}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card title={tr("Generated", "Üretildi")} value={age(data?.generatedAt, locale)} />
          <Card title={tr("Snapshots", "Snapshot'lar")} value={number(data?.history.snapshots)} />
          <Card title={tr("First Stored", "İlk Kayıt")} value={age(data?.history.firstObservedAt, locale)} />
          <Card title={tr("Latest Stored", "Son Kayıt")} value={age(data?.history.latestObservedAt, locale)} />
        </div>
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
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{locale === "tr" ? change.detailTr : locale === "es" ? translate(locale, change.detail, change.detailTr) : change.detail}</p>
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

      <TrendView points={trends?.points ?? []} locale={locale} tr={tr} />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card title="Launchpad" value={displayStatus(data?.current.defi.launchpad, locale)} />
        <Card title="DEX" value={displayStatus(data?.current.defi.dex, locale)} />
        <Card title="AMM" value={displayStatus(data?.current.defi.amm, locale)} />
        <Card title={tr("Mainnet Trading", "Mainnet İşlemleri")} value={displayStatus(data?.current.defi.mainnetTrading, locale)} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Data Boundary", "Veri Sınırı")}</div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tr("Observatory metrics are derived from public ecosystem responses and stored snapshots. They describe what ZAF TECH could observe at collection time; missing, unavailable or unverified signals are not inferred.", "Gözlem Merkezi metrikleri herkese açık ekosistem yanıtlarından ve kayıtlı snapshotlardan üretilir. Veriler, ZAF TECH'in toplama anında gözlemleyebildiği durumu tanımlar; eksik, kullanılamayan veya doğrulanmamış sinyaller çıkarımla tamamlanmaz.")}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground"><span>{tr("Read-only", "Salt-okunur")}</span><span>•</span><span>{tr("Public Sources", "Herkese Açık Kaynaklar")}</span><span>•</span><span>{tr("Historical Data", "Tarihsel Veri")}</span></div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground">{tr("Historical Snapshots", "Tarihsel Snapshot'lar")}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card title={tr("Stored Snapshots", "Kayıtlı Snapshot'lar")} value={number(data?.history.snapshots)} />
          <Card title={tr("Storage", "Depolama")} value={displayStatus(data?.history.configured ? "active" : "not configured", locale)} detail={tr("DATABASE_URL", "DATABASE_URL")} />
          <Card title={tr("First Snapshot", "İlk Snapshot")} value={age(data?.history.firstObservedAt, locale)} />
          <Card title={tr("Latest Snapshot", "Son Snapshot")} value={age(data?.history.latestObservedAt, locale)} />
        </div>
        {!data?.history.configured ? <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{tr("Historical storage is optional. Live observations remain available while DATABASE_URL is not configured.", "Tarihsel depolama isteğe bağlıdır. DATABASE_URL yapılandırılmamış olsa da canlı gözlemler kullanılabilir.")}</p> : null}
      </div>
    </section>
  );
}

