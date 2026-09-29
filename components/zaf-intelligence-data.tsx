"use client";

import { useEffect, useMemo, useState } from "react";
import type { EcosystemSnapshot } from "@/lib/zaf/ecosystem";
import type { Locale } from "@/lib/zaf/i18n";
import type { ZafSnapshot } from "@/lib/zaf/types";

type TrendPoint = {
  capturedAt: string;
  appCount: number | null;
  newsCount: number;
  transactionsPerHour: number | null;
  operationsPerHour: number | null;
};

const STORAGE_KEY = "zaf-tech-intelligence-trends-v1";
const SIGNAL_STATE_KEY = "zaf-tech-intelligence-signal-state-v1";

type SignalState = Record<string, { fingerprint: string; lastSeenAt: string }>;

function readSignalState(): SignalState {
  try {
    const value = JSON.parse(window.localStorage.getItem(SIGNAL_STATE_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as SignalState;
  } catch {
    return {};
  }
}

function signalFingerprint(signal: EcosystemSnapshot["signals"][number]) {
  return [signal.title, signal.detail, signal.detailTr, signal.sourceUrl ?? ""].join("|");
}

function copy(locale: Locale, en: string, tr: string) {
  return locale === "tr" ? tr : en;
}

function readPoints(): TrendPoint[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((p): p is TrendPoint =>
      p && typeof p.capturedAt === "string" &&
      (p.appCount === null || typeof p.appCount === "number") &&
      typeof p.newsCount === "number" &&
      (p.transactionsPerHour === null || typeof p.transactionsPerHour === "number") &&
      (p.operationsPerHour === null || typeof p.operationsPerHour === "number")
    ).slice(-288);
  } catch {
    return [];
  }
}

function savePoint(point: TrendPoint) {
  const history = readPoints();
  const existing = history.findIndex((item) => item.capturedAt === point.capturedAt);
  const next = existing >= 0
    ? history.map((item, index) => index === existing ? point : item)
    : [...history, point];
  const trimmed = next.slice(-288);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
  return trimmed;
}

function Sparkline({ values }: { values: Array<number | null> }) {
  const numeric = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (numeric.length < 2) return <div className="h-14 text-[10px] text-muted-foreground">—</div>;
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const yValue = value ?? min;
    const x = (index / Math.max(values.length - 1, 1)) * 600;
    const y = 54 - ((yValue - min) / span) * 46;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 600 58" className="h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}

export function ZafIntelligenceData({
  locale,
  subtab,
  data,
}: {
  locale: Locale;
  subtab: string;
  data: ZafSnapshot | null;
}) {
  const [ecosystem, setEcosystem] = useState<EcosystemSnapshot | null>(null);
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [signalState, setSignalState] = useState<SignalState>({});
  const [signalStatuses, setSignalStatuses] = useState<Record<string, "new" | "updated" | "observed">>({});
  const [loading, setLoading] = useState(true);

  async function loadEcosystem() {
    try {
      const response = await fetch("/api/zaf/ecosystem", { cache: "no-store" });
      if (!response.ok) throw new Error("Ecosystem request failed");
      setEcosystem((await response.json()) as EcosystemSnapshot);
    } catch {
      setEcosystem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPoints(readPoints());
    setSignalState(readSignalState());
    void loadEcosystem();
    const timer = window.setInterval(() => void loadEcosystem(), 5 * 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ecosystem) return;
    setPoints(savePoint({
      capturedAt: ecosystem.generatedAt,
      appCount: ecosystem.apps.totalCount,
      newsCount: ecosystem.news.length,
      transactionsPerHour: data?.metrics.observedTransactionsPerHour ?? null,
      operationsPerHour: data?.metrics.observedOperationsPerHour ?? null,
    }));
  }, [ecosystem, data?.metrics.observedTransactionsPerHour, data?.metrics.observedOperationsPerHour]);

  const recentChanges = ecosystem?.changes.slice(0, 8) ?? [];
  const signals = useMemo(() => {
    const result = [...(ecosystem?.signals ?? [])];

    if (data?.metrics.observedTransactionsPerHour != null) {
      result.push({
        id: "mainnet-transactions-observed",
        category: "mainnet" as const,
        kind: "observed" as const,
        title: copy(locale, "Mainnet activity observed", "Mainnet aktivitesi gözlemlendi"),
        detail: `${data.metrics.observedTransactionsPerHour.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} transactions/hour in the current observation window.`,
        detailTr: `Mevcut gözlem penceresinde saatte ${data.metrics.observedTransactionsPerHour.toLocaleString("tr-TR")} işlem.`,
        detectedAt: ecosystem?.generatedAt ?? new Date().toISOString(),
        sourceUrl: null,
      });
    }

    return result.slice(0, 12).map((signal) => ({
      ...signal,
      displayKind: signalStatuses[signal.id] ?? "observed",
    }));
  }, [ecosystem, data?.metrics.observedTransactionsPerHour, locale, signalStatuses]);

  useEffect(() => {
    if (!ecosystem?.signals.length) return;
    const current = readSignalState();
    const statuses: Record<string, "new" | "updated" | "observed"> = {};
    const next = { ...current };

    for (const signal of ecosystem.signals) {
      const fingerprint = signalFingerprint(signal);
      const previous = current[signal.id];
      statuses[signal.id] = !previous ? "new" : previous.fingerprint !== fingerprint ? "updated" : "observed";
      next[signal.id] = { fingerprint, lastSeenAt: ecosystem.generatedAt };
    }

    const trimmed = Object.fromEntries(Object.entries(next).slice(-500));
    try { window.localStorage.setItem(SIGNAL_STATE_KEY, JSON.stringify(trimmed)); } catch {}
    setSignalStatuses(statuses);
    setSignalState(trimmed);
  }, [ecosystem]);

  if (subtab === "Trends") {
    return (
      <section className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">{copy(locale, "Ecosystem Trends", "Ekosistem Trendleri")}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {copy(locale, "Local observation history built from snapshots actually seen by this ZAF TECH instance.", "Bu ZAF TECH örneğinin gerçekten gözlemlediği snapshot'lar üzerinden oluşturulan yerel gözlem geçmişi.")}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Apps observed", points.map(p => p.appCount), "Uygulamalar"],
              ["Official news items", points.map(p => p.newsCount), "Resmi haberler"],
              ["Transactions / hour", points.map(p => p.transactionsPerHour), "İşlemler / saat"],
              ["Operations / hour", points.map(p => p.operationsPerHour), "Operasyonlar / saat"],
            ].map(([enLabel, values, trLabel]) => (
              <div key={String(enLabel)} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground">{copy(locale, String(enLabel), String(trLabel))}</span>
                  <span className="font-mono text-muted-foreground">{(values as Array<number | null>).at(-1) ?? "—"}</span>
                </div>
                <div className="mt-2 text-muted-foreground"><Sparkline values={values as Array<number | null>} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            {copy(locale, "A local trend is not a global historical dataset. Missing periods remain missing.", "Yerel trend, küresel bir tarihsel veri seti değildir. Eksik dönemler eksik olarak kalır.")}
          </p>
        </div>
      </section>
    );
  }

  if (subtab === "Alerts") {
    return (
      <section className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">{copy(locale, "Observed Signals", "Gözlemlenen Sinyaller")}</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">{copy(locale, "Structured change signals derived from official ecosystem sources and observed Mainnet activity.", "Resmi ekosistem kaynakları ve gözlemlenen Mainnet aktivitesinden türetilen yapılandırılmış değişim sinyalleri.")}</p>
          <div className="mt-4 space-y-2">
            {signals.length ? signals.map((signal) => (
              <div key={signal.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium text-foreground">{signal.title}</div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{signal.displayKind}</span>
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{copy(locale, signal.detail, signal.detailTr)}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
                  <span>{signal.category}</span>
                  <span>·</span>
                  <span>{new Date(signal.detectedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}</span>
                  {signal.sourceUrl ? <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{copy(locale, "Source ↗", "Kaynak ↗")}</a> : null}
                </div>
              </div>
            )) : <div className="text-xs text-muted-foreground">{copy(locale, "No signals observed.", "Sinyal gözlemlenmedi.")}</div>}
          </div>
        </div>
      </section>
    );
  }

  if (subtab === "Ecosystem Graph") {
    return (
      <section className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">{copy(locale, "Ecosystem Graph", "Ekosistem Grafiği")}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copy(locale, "Observed relationships between ZAF TECH source domains and ecosystem layers.", "ZAF TECH kaynak alanları ile ekosistem katmanları arasındaki gözlemlenen ilişkiler.")}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              ["Pi Mainnet", "Blockchain → Activity"],
              ["Pi Ecosystem", "Directory → Apps"],
              ["Pi Official", "News → Launchpad / DEX / Pioneer"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-xl border border-border p-3">
                <div className="text-xs font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
            {copy(locale, "This is an observed-source relationship map, not a claim of direct technical integration between every listed service.", "Bu, gözlemlenen kaynak ilişkilerini gösteren bir haritadır; listelenen servislerin tamamı arasında doğrudan teknik entegrasyon olduğu anlamına gelmez.")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{copy(locale, "Ecosystem Radar", "Ekosistem Radarı")}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copy(locale, "What changed across the observable Pi ecosystem layer.", "Gözlemlenebilir Pi ekosistem katmanında nelerin değiştiği.")}</p>
          </div>
          {ecosystem ? <span className="text-[10px] text-muted-foreground">{new Date(ecosystem.generatedAt).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US")}</span> : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [copy(locale, "Apps", "Uygulamalar"), ecosystem?.apps.totalCount?.toLocaleString(locale === "tr" ? "tr-TR" : "en-US") ?? "—"],
            [copy(locale, "Official news", "Resmi haber"), ecosystem?.news.length ?? "—"],
            [copy(locale, "Launchpad", "Launchpad"), ecosystem?.defi.launchpad.status ?? "—"],
            [copy(locale, "DEX / AMM", "DEX / AMM"), ecosystem?.defi.dex.status ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border p-3">
              <div className="text-lg font-bold text-foreground">{value}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {loading && !ecosystem ? <div className="text-xs text-muted-foreground">{copy(locale, "Reading official ecosystem sources…", "Resmi ekosistem kaynakları okunuyor…")}</div> : null}
          {ecosystem?.officialSignals.length ? (
            <div className="rounded-xl border border-border p-3">
              <div className="mb-2 text-xs font-semibold text-foreground">{copy(locale, "Official Signals", "Resmi Sinyaller")}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ecosystem.officialSignals.map((signal) => (
                  <a key={signal.id} href={signal.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-3 hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-medium text-foreground">{signal.title}</div>
                      <span className="shrink-0 text-[10px] font-semibold text-foreground">{signal.value}</span>
                    </div>
                    <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{copy(locale, signal.detail, signal.detailTr)}</div>
                    <div className="mt-2 text-[9px] text-muted-foreground">{signal.observedAt} · Official source ↗</div>
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
                {copy(locale, "These are dated figures reported by Pi Network, not live ZAF TECH measurements or current network-wide counts.", "Bunlar Pi Network tarafından belirli tarihlerde açıklanan rakamlardır; canlı ZAF TECH ölçümü veya güncel ağ geneli sayımı değildir.")}
              </p>
            </div>
          ) : null}
          {recentChanges.map((change, index) => (
            <div key={index} className="rounded-xl border border-border p-3">
              <div className="text-xs font-medium text-foreground">{change.title}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{change.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
