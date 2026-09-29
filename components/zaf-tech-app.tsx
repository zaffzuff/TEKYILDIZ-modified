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

export function ZafTechApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [section, setSection] = useState<ZafSection>("overview");
  const [subtab, setSubtab] = useState("Ecosystem");
  const [snapshot, setSnapshot] = useState<ZafSnapshot | null>(null);
  const [ecosystem, setEcosystem] = useState<EcosystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;

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
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr("Pi Ecosystem Intelligence", "Pi Ekosistem İstihbaratı")}</p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="flex rounded-lg border border-border bg-card p-0.5 text-[11px]">
                {(Object.keys(localeLabels) as Locale[]).map(option => <button key={option} type="button" onClick={() => setLocale(option)} className={`rounded-md px-2 py-1.5 font-medium ${locale === option ? "bg-muted text-foreground" : "text-muted-foreground"}`}>{localeLabels[option]}</button>)}
              </div>
              <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground">{theme === "light" ? `☾ ${tr("Dark", "Koyu")}` : `☀ ${tr("Light", "Açık")}`}</button>
              <button type="button" onClick={() => void load()} disabled={refreshing} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">{refreshing ? tr("Refreshing…", "Yenileniyor…") : tr("Refresh", "Yenile")}</button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Pi Network", "Pi Network")}</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Mainnet", "Mainnet")}</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{tr("Read-only", "Salt-okunur")}</span>
            <span className={`rounded-full border px-2.5 py-1 ${sourceOnline ? "border-ty-active/40 text-foreground" : "border-border text-muted-foreground"}`}>{sourceOnline ? tr("Ecosystem source online", "Ekosistem kaynağı çevrimiçi") : tr("Source unavailable", "Kaynak kullanılamıyor")}</span>
          </div>
          <ZafEcosystemNavigation locale={locale} section={section} subtab={subtab} onSectionChange={(next) => { setSection(next); const first = { overview: "Ecosystem", apps: "App Directory", node: "Node", intelligence: "Radar" }[next] ?? ""; if (first) setSubtab(first); }} onSubtabChange={setSubtab} />
          <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ty-active" />{tr("Live observations", "Canlı gözlemler")}</span>
            <span>{tr("Updated", "Güncellendi")} {age(snapshot?.generatedAt, locale)}</span>
          </div>
        </header>

        {loading ? <div className="py-12 text-center text-sm text-muted-foreground">{tr("Loading ecosystem intelligence…", "Ekosistem istihbaratı yükleniyor…")}</div> : null}

        {!loading && section === "overview" && subtab === "Ecosystem" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("Pi Ecosystem Intelligence", "Pi Ekosistem İstihbaratı")}</h2><p className="text-[11px] text-muted-foreground">{tr("A read-only technology layer for discovering observable Pi ecosystem data, applications and Node infrastructure.", "Gözlemlenebilir Pi ekosistem verilerini, uygulamaları ve Node altyapısını keşfetmek için salt-okunur teknoloji katmanı.")}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Observed apps", "Gözlemlenen uygulamalar")} value={number(ecosystem?.apps.totalCount)} detail={tr("Current public source response", "Mevcut herkese açık kaynak yanıtı")} />
              <Card title={tr("Recent ledgers", "Son ledger'lar")} value={number(snapshot?.metrics.recentLedgerCount)} detail={tr("Pi Mainnet observation window", "Pi Mainnet gözlem penceresi")} />
              <Card title={tr("Transactions", "İşlemler")} value={number(snapshot?.metrics.recentTransactions)} detail={tr("Current sample", "Mevcut örnek")} />
              <Card title={tr("Protocol", "Protokol")} value={snapshot?.metrics.latestProtocolVersion != null ? `v${snapshot.metrics.latestProtocolVersion}` : "—"} detail={tr("Latest observed ledger", "Son gözlemlenen ledger")} />
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

        {!loading && section === "intelligence" && subtab !== "Wallet" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">{tr("Ecosystem Intelligence", "Ekosistem İstihbaratı")}</h2><p className="text-[11px] text-muted-foreground">{tr("Measured signals from public sources and observable Mainnet activity.", "Herkese açık kaynaklardan ve gözlemlenebilir Mainnet aktivitesinden ölçülen sinyaller.")}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Card title={tr("Activity state", "Aktivite durumu")} value={snapshot?.intelligence.activityState ?? "—"} detail={tr("Descriptive, not predictive", "Tanımlayıcı, tahmin edici değil")} /><Card title={tr("Tx / hour", "İşlem / saat")} value={number(snapshot?.metrics.observedTransactionsPerHour, 1)} /><Card title={tr("Operations / hour", "Operasyon / saat")} value={number(snapshot?.metrics.observedOperationsPerHour, 1)} /></div>
            <div className="mt-3 rounded-xl border border-border bg-card p-4"><div className="text-xs font-semibold text-foreground">{tr("Measurement boundary", "Ölçüm sınırı")}</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tr("These signals describe the sampled public blockchain data only. They are not a score for Pi Network, do not infer user intent, and do not predict future network behavior.", "Bu sinyaller yalnızca örneklenen herkese açık blockchain verisini tanımlar. Pi Network için puan değildir, kullanıcı niyeti çıkarmaz ve gelecekteki ağ davranışını tahmin etmez.")}</p></div>
          </section>
        ) : null}

        {!loading && section === "node" ? <ZafNodeCompute locale={locale} data={snapshot} subtab={subtab} /> : null}

        {!loading && section === "intelligence" && subtab === "Wallet" ? <ZafWalletIntelligence locale={locale} /> : null}

        {!loading && section === "overview" && subtab === "Network" ? (
          <section className="mt-5 sm:mt-7">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">{tr("Pi Network", "Pi Network")}</h2>
              <p className="text-[11px] text-muted-foreground">{tr("Observable Mainnet data from Pi Mainnet Horizon. This is a read-only view, not a claim of full-network coverage.", "Pi Mainnet Horizon üzerinden gözlemlenen Mainnet verileri. Bu salt-okunur görünüm tüm ağın eksiksiz temsili olduğu iddiasında değildir.")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Network", "Ağ")} value={snapshot?.network ?? "—"} detail={tr("Observed source", "Gözlemlenen kaynak")} />
              <Card title={tr("Protocol", "Protokol")} value={snapshot?.metrics.latestProtocolVersion != null ? `v${snapshot.metrics.latestProtocolVersion}` : "—"} detail={tr("Latest observed ledger", "Son gözlemlenen ledger")} />
              <Card title={tr("Latest ledger", "Son ledger")} value={snapshot?.latestLedger?.sequence ?? "—"} detail={snapshot?.latestLedger?.closedAt ? age(snapshot.latestLedger.closedAt, locale) : "—"} />
              <Card title={tr("Data status", "Veri durumu")} value={snapshot?.error ? "ERROR" : snapshot?.latestLedger ? "AVAILABLE" : "UNAVAILABLE"} detail={snapshot?.error ?? tr("Pi Mainnet Horizon response observed.", "Pi Mainnet Horizon yanıtı gözlemlendi.")} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card title={tr("Transactions", "İşlemler")} value={number(snapshot?.metrics.recentTransactions)} detail={tr("Current sample", "Mevcut örnek")} />
              <Card title={tr("Operations", "Operasyonlar")} value={number(snapshot?.metrics.recentOperations)} detail={tr("Current sample", "Mevcut örnek")} />
              <Card title={tr("Tx / hour", "İşlem / saat")} value={number(snapshot?.metrics.observedTransactionsPerHour, 1)} />
              <Card title={tr("Ops / hour", "Operasyon / saat")} value={number(snapshot?.metrics.observedOperationsPerHour, 1)} />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold text-foreground">{tr("Network measurement boundary", "Ağ ölçüm sınırı")}</div>
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
            <span>ZAF TECH · Pi Ecosystem Intelligence</span>
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
