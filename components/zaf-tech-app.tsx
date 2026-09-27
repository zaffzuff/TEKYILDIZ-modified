"use client";

import { useCallback, useEffect, useState } from "react";
import type { ZafHistoricalActivity, ZafSnapshot } from "@/lib/zaf/types";
import { localeLabels, t, type Locale } from "@/lib/zaf/i18n";
import { ZafHistoricalExplorer, ZafWalletIntelligence } from "@/components/zaf-data-tools";

function formatNumber(value: number | null, digits = 0) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function short(value: string | null, length = 12) {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

const TREND_STORAGE_KEY = "zaf-tech-observation-history-v1";
const MAX_TREND_POINTS = 1440;
const RECENT_RECORD_PREVIEW = 10;

type ZafTab = "overview" | "activity" | "transactions" | "operations" | "history" | "wallet" | "network";

interface TrendPoint {
  capturedAt: string;
  ledger: string | null;
  transactionsPerHour: number | null;
  operationsPerHour: number | null;
  successRate: number | null;
}

function loadTrendHistory(): TrendPoint[] {
  try {
    const raw = window.localStorage.getItem(TREND_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((point): point is TrendPoint =>
      point &&
      typeof point.capturedAt === "string" &&
      (point.ledger === null || typeof point.ledger === "string") &&
      (point.transactionsPerHour === null || typeof point.transactionsPerHour === "number") &&
      (point.operationsPerHour === null || typeof point.operationsPerHour === "number") &&
      (point.successRate === null || typeof point.successRate === "number")
    ).slice(-MAX_TREND_POINTS);
  } catch {
    return [];
  }
}

function saveTrendPoint(snapshot: ZafSnapshot) {
  try {
    const history = loadTrendHistory();
    const point: TrendPoint = {
      capturedAt: snapshot.generatedAt,
      ledger: snapshot.latestLedger?.sequence ?? null,
      transactionsPerHour: snapshot.metrics.observedTransactionsPerHour,
      operationsPerHour: snapshot.metrics.observedOperationsPerHour,
      successRate: snapshot.metrics.transactionSuccessRate,
    };
    const next = [...history, point].slice(-MAX_TREND_POINTS);
    window.localStorage.setItem(TREND_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

function formatDateTime(value: string | null, locale: Locale = "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAge(value: string | null, nowMs = Date.now(), locale: Locale = "en") {
  if (!value) return "—";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "—";
  const seconds = Math.max(0, Math.floor((nowMs - time) / 1000));
  if (seconds < 60) return locale === "tr" ? `${seconds} sn önce` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "tr" ? `${minutes} dk ${seconds % 60} sn önce` : `${minutes}m ${seconds % 60}s ago`;
  const hours = Math.floor(minutes / 60);
  return locale === "tr" ? `${hours} sa ${minutes % 60} dk önce` : `${hours}h ${minutes % 60}m ago`;
}

function ledgerTransactionCount(ledger: ZafSnapshot["recentLedgers"][number]) {
  if (ledger.successfulTransactionCount != null && ledger.failedTransactionCount != null) {
    return ledger.successfulTransactionCount + ledger.failedTransactionCount;
  }
  return ledger.transactionCount;
}

function ledgerIntervalSeconds(
  current: ZafSnapshot["recentLedgers"][number],
  older: ZafSnapshot["recentLedgers"][number] | undefined
) {
  if (!older) return null;
  const currentTime = Date.parse(current.closedAt);
  const olderTime = Date.parse(older.closedAt);
  if (!Number.isFinite(currentTime) || !Number.isFinite(olderTime) || olderTime >= currentTime) return null;
  return (currentTime - olderTime) / 1000;
}

function operationsPerTransaction(transactions: number, operations: number) {
  if (transactions <= 0) return null;
  return operations / transactions;
}
function InfoBadge({ label, description }: { label: string; description: string }) {
  return (
    <span
      tabIndex={0}
      title={description}
      aria-label={`${label}: ${description}`}
      className="group relative cursor-help rounded-full border border-border px-2.5 py-1 text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
    >
      {label}
      <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-lg border border-border bg-card p-2.5 text-[11px] leading-relaxed text-foreground shadow-lg group-hover:block group-focus:block">
        {description}
      </span>
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold ty-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium text-foreground">{label}</div>
      {detail && <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>}
    </div>
  );
}

export function ZafTechApp() {
  const [data, setData] = useState<ZafSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>([]);
  const [historicalActivity, setHistoricalActivity] = useState<ZafHistoricalActivity | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllOperations, setShowAllOperations] = useState(false);
  const [showAllLedgers, setShowAllLedgers] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<ZafTab>("overview");
  const tr = (key: string) => t(locale, key);
  const tabClass = (tab: ZafTab) => activeTab === tab ? "" : "hidden";

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("zaf-tech-locale-v1");
    if (savedLocale === "en" || savedLocale === "tr") setLocale(savedLocale);
    const savedTheme = window.localStorage.getItem("zaf-tech-theme-v1");
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("zaf-tech-theme-v1", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("zaf-tech-locale-v1", locale);
  }, [locale]);

  useEffect(() => {
    setTrendHistory(loadTrendHistory());
    void fetch("/api/zaf/history", { cache: "no-store" })
      .then((response) => response.json())
      .then((history) => setHistoricalActivity(history as ZafHistoricalActivity))
      .catch(() => setHistoricalActivity({ windowHours: 24, points: [], error: "Unable to load historical activity" }));
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/zaf", { cache: "no-store" });
      const snapshot = (await response.json()) as ZafSnapshot;
      setData(snapshot);
      setTrendHistory(saveTrendPoint(snapshot));
    } catch (error) {
      setData((current) => current ?? {
        network: "Pi Network",
        source: "Pi Mainnet Horizon",
        generatedAt: new Date().toISOString(),
        latestLedger: null,
        recentLedgers: [],
        transactions: [],
        operations: [],
        intelligence: {
          activityState: "insufficient-data",
          transactionChangePercent: null,
          operationChangePercent: null,
          dominantOperationShare: null,
          uniqueTransactionSources: 0,
          uniqueOperationSources: 0,
          notes: [],
        },
        metrics: {
          recentLedgerCount: 0,
          recentTransactions: 0,
          recentOperations: 0,
          avgTransactionsPerLedger: null,
          avgOperationsPerLedger: null,
          avgLedgerCloseSeconds: null,
          ledgerIntervalStdDevSeconds: null,
          ledgerIntervalCoefficientVariationPercent: null,
          latestProtocolVersion: null,
          protocolVersionDistribution: [],
          transactionSuccessRate: null,
          failedTransactionRatePercent: null,
          averageTransactionFeePi: null,
          averageOperationsPerTransaction: null,
          uniqueTransactionSources: 0,
          uniqueOperationSources: 0,
          topOperationType: null,
          topOperationTypeCount: 0,
          operationTypeDistribution: [],
          transactionSampleWindowMinutes: null,
          operationSampleWindowMinutes: null,
          observedTransactionsPerHour: null,
          observedOperationsPerHour: null,
          emptyLedgerRatePercent: null,
          ledgerActivityRatePerMinute: null,
        },
        error: error instanceof Error ? error.message : "Unable to load Pi Mainnet data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-10">
        <header className="border-b border-border pb-5 pt-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold tracking-tight ty-brand-text">ZAF TECH</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr("Pi Ecosystem Activity Intelligence")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex rounded-lg border border-border bg-card p-0.5 text-[11px]" role="group" aria-label={tr("Language")}>
                {(Object.keys(localeLabels) as Locale[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLocale(option)}
                    className={`rounded-md px-2 py-1.5 font-medium ${locale === option ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    {localeLabels[option]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
                className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground"
                aria-label={tr("Toggle theme")}
                title={theme === "dark" ? tr("Light theme") : tr("Dark theme")}
              >
                {theme === "dark" ? `☀ ${tr("Light")}` : `☾ ${tr("Dark")}`}
              </button>
                          <button
              type="button"
              onClick={() => void load()}
              disabled={refreshing}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50"
            >
              {refreshing ? tr("Refreshing…") : tr("Refresh")}
            </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <InfoBadge
              label={tr("Pi Network")}
              description={tr("Pi Network badge description")}
            />
            <InfoBadge
              label={tr("Mainnet")}
              description={tr("Mainnet badge description")}
            />
            <InfoBadge
              label={tr("Read-only")}
              description={tr("Read-only badge description")}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-muted-foreground">{tr("Data fetched")}</div>
              <div className="mt-0.5 font-medium text-foreground">{data ? formatAge(data.generatedAt, Date.now(), locale) : "—"}</div>
              <div className="mt-0.5 text-muted-foreground">{data ? formatDateTime(data.generatedAt, locale) : tr("Waiting for data")}</div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-muted-foreground">{tr("Latest ledger closed")}</div>
              <div className="mt-0.5 font-medium text-foreground">{data?.latestLedger ? formatAge(data.latestLedger.closedAt, Date.now(), locale) : "—"}</div>
              <div className="mt-0.5 text-muted-foreground">{data?.latestLedger ? formatDateTime(data.latestLedger.closedAt, locale) : tr("Waiting for ledger")}</div>
            </div>
          </div>
          <nav className="mt-4 overflow-x-auto border-t border-border pt-3" aria-label={tr("Dashboard sections")}>
            <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1">
              {([
                ["overview", "Overview", "Genel Bakış"],
                ["activity", "Activity", "Aktivite"],
                ["transactions", "Transactions", "İşlemler"],
                ["operations", "Operations", "Operasyonlar"],
                ["history", "History", "Geçmiş"],
                ["wallet", "Wallet", "Cüzdan"],
                ["network", "Network", "Ağ"],
              ] as const).map(([id, en, trLabel]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={activeTab === id ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${activeTab === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {locale === "tr" ? trLabel : en}
                </button>
              ))}
            </div>
          </nav>
        </header>

        {loading && !data ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{tr("Loading Pi Mainnet data…")}</div>
        ) : (
          <>
            {data?.error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                {tr("Pi Mainnet data error:")} {data.error}
              </div>
            )}

            <section className={`mt-7 ${tabClass("network")}`}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">{tr("Network Health")}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {tr("Health indicators derived from the latest observed Pi Mainnet ledger window")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  label={tr("Transaction success rate")}
                  value={data?.metrics.transactionSuccessRate != null ? `${formatNumber(data.metrics.transactionSuccessRate, 2)}%` : "—"}
                  detail={tr("Successful transactions / observed transaction total")}
                />
                <Metric
                  label={tr("Failed transaction rate")}
                  value={data?.metrics.failedTransactionRatePercent != null ? `${formatNumber(data.metrics.failedTransactionRatePercent, 2)}%` : "—"}
                  detail={tr("Failed transactions / observed transaction total")}
                />
                <Metric
                  label={tr("Average operations / transaction")}
                  value={formatNumber(data?.metrics.averageOperationsPerTransaction ?? null, 2)}
                  detail={tr("From transactions where operation count is reported")}
                />
                <Metric
                  label={tr("Average transaction fee")}
                  value={data?.metrics.averageTransactionFeePi != null ? `${formatNumber(data.metrics.averageTransactionFeePi, 7)} Pi` : "—"}
                  detail={tr("Average fee across the transaction sample")}
                />
                <Metric
                  label={tr("Ledger interval variability")}
                  value={data?.metrics.ledgerIntervalStdDevSeconds != null ? `${formatNumber(data.metrics.ledgerIntervalStdDevSeconds, 2)}s` : "—"}
                  detail={data?.metrics.ledgerIntervalCoefficientVariationPercent != null ? `${tr("Coefficient of variation:")} ${formatNumber(data.metrics.ledgerIntervalCoefficientVariationPercent, 2)}%` : tr("Standard deviation of ledger close intervals")}
                />
                <Metric
                  label={tr("Empty ledger rate")}
                  value={data?.metrics.emptyLedgerRatePercent != null ? `${formatNumber(data.metrics.emptyLedgerRatePercent, 2)}%` : "—"}
                  detail={tr("Ledgers with 0 transactions and 0 operations")}
                />
                <Metric
                  label={tr("Ledger activity rate")}
                  value={data?.metrics.ledgerActivityRatePerMinute != null ? `${formatNumber(data.metrics.ledgerActivityRatePerMinute, 2)} / min` : "—"}
                  detail={tr("Observed ledger closes per minute")}
                />
                <Metric
                  label={tr("Protocol distribution")}
                  value={data?.metrics.protocolVersionDistribution?.length ? data.metrics.protocolVersionDistribution.map((item) => `v${item.version}: ${formatNumber(item.percentage, 1)}%`).join(" · ") : "—"}
                  detail={tr("Distribution across the latest observed ledger window")}
                />
              </div>
            </section>

            <section className={`mt-7 ${tabClass("overview")}`}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">{tr("Current Activity")}</h2>
                <p className="text-[11px] text-muted-foreground">{tr("A compact view of the latest observed Mainnet activity")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label={tr("Activity state")}
                  value={data?.intelligence.activityState ? tr(data.intelligence.activityState) : "—"}
                  detail={tr("Descriptive state from observed chain data")}
                />
                <Metric
                  label={tr("Transactions / hour")}
                  value={data?.metrics.observedTransactionsPerHour != null ? `${formatNumber(data.metrics.observedTransactionsPerHour, 1)}` : "—"}
                  detail={tr("Latest observed ledger window")}
                />
                <Metric
                  label={tr("Operations / hour")}
                  value={data?.metrics.observedOperationsPerHour != null ? `${formatNumber(data.metrics.observedOperationsPerHour, 1)}` : "—"}
                  detail={tr("Latest observed ledger window")}
                />
                <Metric
                  label={tr("Transaction success rate")}
                  value={data?.metrics.transactionSuccessRate != null ? `${formatNumber(data.metrics.transactionSuccessRate, 1)}%` : "—"}
                  detail={tr("Observed transaction total")}
                />
              </div>
            </section>

            <section className={`mt-5 ${tabClass("overview")}`}>
              <h1 className="mb-3 text-sm font-semibold text-foreground">{tr("Network Snapshot")}</h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric label={tr("Latest ledger")} value={data?.latestLedger?.sequence ?? "—"} detail={data?.latestLedger ? short(data.latestLedger.hash, 16) : undefined} />
                <Metric label={tr("Protocol version")} value={data?.metrics.latestProtocolVersion != null ? String(data.metrics.latestProtocolVersion) : "—"} />
                <Metric label={tr("Recent transactions")} value={formatNumber(data?.metrics.recentTransactions ?? null)} detail={tr("Latest 100 from Pi Mainnet Horizon")} />
                <Metric label={tr("Recent operations")} value={formatNumber(data?.metrics.recentOperations ?? null)} detail={tr("Latest 100 from Pi Mainnet Horizon")} />
                <Metric label={tr("Tx / ledger (sample)")} value={formatNumber(data?.metrics.avgTransactionsPerLedger ?? null, 2)} detail={tr("Based on ledgers represented in the transaction sample")} />
                <Metric label={tr("Ledger interval")} value={data?.metrics.avgLedgerCloseSeconds != null ? `${formatNumber(data.metrics.avgLedgerCloseSeconds, 2)}s` : "—"} detail={tr("Average across the latest 100 ledgers")} />
              </div>
            </section>

            <section className={`mt-7 ${tabClass("activity")}`}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{tr("Ledger Activity Timeline")}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Latest real Pi Mainnet ledgers, newest first")}
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {data?.recentLedgers.length ?? 0} {tr(data?.recentLedgers.length === 1 ? "ledger" : "ledgers")}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.recentLedgers.length ? (
                  <>
                    {(showAllLedgers ? data.recentLedgers : data.recentLedgers.slice(0, 12)).map((ledger, index) => {
                      const transactions = ledgerTransactionCount(ledger);
                      const olderLedger = data.recentLedgers[index + 1];
                      const intervalSeconds = ledgerIntervalSeconds(ledger, olderLedger);
                      const opsPerTx = operationsPerTransaction(transactions, ledger.operationCount);
                      return (
                        <div key={ledger.sequence} className="border-b border-border p-3 last:border-b-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs font-medium text-foreground">
                              {tr("Ledger")} {ledger.sequence}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(ledger.closedAt, locale)}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
                            <div>
                              <div className="text-muted-foreground">{tr("Transactions")}</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(transactions)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{tr("Operations")}</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(ledger.operationCount)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{tr("Ops / tx")}</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(opsPerTx, 2)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{tr("Ledger interval")}</div>
                              <div className="mt-0.5 font-medium text-foreground">
                                {intervalSeconds != null ? formatNumber(intervalSeconds, 1) + "s" : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{tr("Protocol / fee")}</div>
                              <div className="mt-0.5 font-medium text-foreground">
                                {ledger.protocolVersion ?? "—"} · {ledger.baseFeePi != null ? formatNumber(ledger.baseFeePi, 7) + " Pi" : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {data.recentLedgers.length > 12 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllLedgers((current) => !current)}
                        className="w-full border-t border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {showAllLedgers ? tr("Show less") : `${tr("Show all")} ${data.recentLedgers.length} ${locale === "tr" ? "ledger" : "ledgers"}`}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="p-4 text-xs text-muted-foreground">{tr("No ledger records available.")}</div>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {tr("Each row is a real Mainnet ledger observed from Pi Horizon. Transaction counts include successful and failed transactions when both ledger counters are available.")}
              </p>
            </section>

            <section className={`mt-7 ${tabClass("activity")}`}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{tr("Activity Signals")}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric label={tr("Transaction success rate")} value={data?.metrics.transactionSuccessRate != null ? `${formatNumber(data.metrics.transactionSuccessRate, 1)}%` : "—"} detail={tr("Latest 100-ledger window")} />
                <Metric label={tr("Average fee")} value={data?.metrics.averageTransactionFeePi != null ? `${formatNumber(data.metrics.averageTransactionFeePi, 7)} Pi` : "—"} detail={tr("Latest transaction sample")} />
                <Metric label={tr("Operations / transaction")} value={formatNumber(data?.metrics.averageOperationsPerTransaction ?? null, 2)} detail={tr("Latest transaction sample")} />
                <Metric label={tr("Unique tx sources")} value={formatNumber(data?.metrics.uniqueTransactionSources ?? null)} detail={tr("Distinct source accounts in sample")} />
                <Metric label={tr("Unique operation sources")} value={formatNumber(data?.metrics.uniqueOperationSources ?? null)} detail={tr("Distinct source accounts in sample")} />
                <Metric label={tr("Top operation type")} value={data?.metrics.topOperationType ?? "—"} detail={data?.metrics.topOperationType ? `${data.metrics.topOperationTypeCount} ${tr("of latest 100 operations")}` : undefined} />
              </div>
            </section>

            <section className={`mt-7 ${tabClass("activity")}`}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">{tr("Activity Intelligence")}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {tr("Recent activity context derived from the latest observed Mainnet ledger window")}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric label={tr("Activity state")} value={data?.intelligence.activityState ? tr(data.intelligence.activityState) : "—"} detail={tr("Descriptive state from observed chain data")} />
                  <Metric label={tr("Transactions / hour")} value={data?.metrics.observedTransactionsPerHour != null ? formatNumber(data.metrics.observedTransactionsPerHour, 1) : "—"} detail={tr("Latest observed ledger window")} />
                  <Metric label={tr("Operations / hour")} value={data?.metrics.observedOperationsPerHour != null ? formatNumber(data.metrics.observedOperationsPerHour, 1) : "—"} detail={tr("Latest observed ledger window")} />
                  <Metric label={tr("Transaction rate change")} value={data?.intelligence.transactionChangePercent != null ? `${data.intelligence.transactionChangePercent >= 0 ? "+" : ""}${formatNumber(data.intelligence.transactionChangePercent, 1)}%` : "—"} detail={tr("Newer vs older half of the latest 100-ledger window")} />
                  <Metric label={tr("Operation rate change")} value={data?.intelligence.operationChangePercent != null ? `${data.intelligence.operationChangePercent >= 0 ? "+" : ""}${formatNumber(data.intelligence.operationChangePercent, 1)}%` : "—"} detail={tr("Newer vs older half of the latest 100-ledger window")} />
                  <Metric label={tr("Average ledger interval")} value={data?.metrics.avgLedgerCloseSeconds != null ? `${formatNumber(data.metrics.avgLedgerCloseSeconds, 2)}s` : "—"} detail={tr("Average close interval across the latest observed ledgers")} />
                  <Metric label={tr("Empty ledger rate")} value={data?.metrics.emptyLedgerRatePercent != null ? `${formatNumber(data.metrics.emptyLedgerRatePercent, 1)}%` : "—"} detail={tr("Ledgers with 0 transactions and 0 operations")} />
                  <Metric label={tr("Dominant operation share")} value={data?.intelligence.dominantOperationShare != null ? `${formatNumber(data.intelligence.dominantOperationShare, 1)}%` : "—"} detail={tr("Share of latest operation sample")} />
                  <Metric label={tr("Unique tx sources")} value={formatNumber(data?.intelligence.uniqueTransactionSources ?? null)} detail={tr("Distinct source accounts")} />
                  <Metric label={tr("Unique operation sources")} value={formatNumber(data?.intelligence.uniqueOperationSources ?? null)} detail={tr("Distinct source accounts")} />
                  <Metric label={tr("Observed ledger window")} value={formatNumber(data?.recentLedgers.length ?? null)} detail={tr("Recent Mainnet ledgers used for activity intelligence")} />
                </div>
                <div className="mt-3 rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground">
                  <div className="font-medium text-foreground">{tr("Measurement basis")}</div>
                  <div className="mt-1 leading-relaxed">
                    {locale === "tr"
                      ? `Oran değişimleri son ${data?.recentLedgers.length ?? 0} gözlemlenen ledger'ın yeni ve eski yarısını gerçek geçen süreye göre karşılaştırır. Sonuç gözlemlenen zincir aktivitesini açıklar; tahmin veya ekosistem geneli kullanım ölçümü değildir.`
                      : `Rate changes compare the newer and older halves of the latest ${data?.recentLedgers.length ?? 0} observed ledgers and normalize each half by its actual elapsed time. The result describes recent observed chain activity; it is not a forecast or ecosystem-wide usage estimate.`}
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  {(data?.intelligence.notes ?? []).map((note) => <p key={note}>• {tr(note)}</p>)}
                </div>
              </div>
            </section>

            <section className={`mt-7 ${tabClass("operations")}`}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{tr("Operation Distribution")}</h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{tr("Latest 100 operations")}</span>
                  <span>{data?.metrics.recentOperations ?? 0} {tr("records")}</span>
                </div>
                <div className="space-y-2.5">
                  {data?.metrics.operationTypeDistribution.length ? data.metrics.operationTypeDistribution.map((item) => (
                    <div key={item.type}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground">{item.type}</span>
                        <span className="text-muted-foreground">{item.count} · {formatNumber(item.percentage, 1)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">{tr("No operation distribution available.")}</div>
                  )}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {tr("Distribution is calculated from the latest real Pi Mainnet operation sample. It describes observed operation mix, not application or user activity outside the blockchain.")}
                </p>
              </div>
            </section>

            <section className={`mt-7 ${tabClass("activity")}`}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{tr("Observed Activity Rate")}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  label={tr("Transactions / hour")}
                  value={data?.metrics.observedTransactionsPerHour != null ? formatNumber(data.metrics.observedTransactionsPerHour, 1) : "—"}
                  detail={tr("Calculated across the latest 100-ledger window")}
                />
                <Metric
                  label={tr("Operations / hour")}
                  value={data?.metrics.observedOperationsPerHour != null ? formatNumber(data.metrics.observedOperationsPerHour, 1) : "—"}
                  detail={tr("Calculated across the latest 100-ledger window")}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {tr("Rates are calculated from the transaction and operation counts recorded in the latest 100 ledgers; they are a rolling network activity measure, not a historical average.")}
              </p>
            </section>

            <section className={`mt-7 ${tabClass("overview")}`}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{tr("Recent Chain Activity")}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Hourly-equivalent rates across the latest")} {historicalActivity?.windowHours ?? "—"}h {tr("of real Pi Mainnet ledger data")}
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {historicalActivity?.points.length ?? 0} {tr("points")}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                {historicalActivity?.points.length ? (
                  <div className="space-y-4">
                    {([
                      [tr("Transactions / hour"), historicalActivity.points.map((point) => point.transactionsPerHour ?? 0)],
                      [tr("Operations / hour"), historicalActivity.points.map((point) => point.operationsPerHour ?? 0)],
                    ] as const).map(([label, values]) => {
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      const span = max - min || 1;
                      const points = values.map((value, index) => {
                        const x = (index / Math.max(values.length - 1, 1)) * 600;
                        const y = 58 - ((value - min) / span) * 52;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(" ");
                      return (
                        <div key={label}>
                          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{tr(label)}</span>
                            <span>{formatNumber(values[values.length - 1], 1)}</span>
                          </div>
                          <div className="h-16 w-full">
                            <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" aria-label={tr(label)}>
                              <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[11px]">
                      <div className="rounded-lg border border-border px-3 py-2">
                        <div className="text-muted-foreground">{tr("Transactions change")}</div>
                        <div className="mt-1 font-medium text-foreground">
                          {historicalActivity.change.transactionsPerHourPercent == null
                            ? "—"
                            : (historicalActivity.change.transactionsPerHourPercent >= 0 ? "+" : "") + formatNumber(historicalActivity.change.transactionsPerHourPercent, 1) + "%"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border px-3 py-2">
                        <div className="text-muted-foreground">{tr("Operations change")}</div>
                        <div className="mt-1 font-medium text-foreground">
                          {historicalActivity.change.operationsPerHourPercent == null
                            ? "—"
                            : (historicalActivity.change.operationsPerHourPercent >= 0 ? "+" : "") + formatNumber(historicalActivity.change.operationsPerHourPercent, 1) + "%"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{tr("Latest sampled success rate")}</span>
                      <span>{formatNumber(historicalActivity.points[historicalActivity.points.length - 1].successRate, 1)}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {tr("Change compares the first and latest buckets in the current real ledger window. It describes observed blockchain activity; it is not a prediction or an ecosystem-wide usage score.")}
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {tr("Historical ledger data is not available right now.")}
                  </div>
                )}
              </div>
            </section>

            <section className={`mt-7 ${tabClass("history")}`}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{tr("Observation History")}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Local history collected from real Pi Mainnet snapshots on this device")}
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {trendHistory.length} {tr("samples")}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                {trendHistory.length < 2 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {tr("History will appear after at least two automatic or manual refreshes.")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{tr("Transactions / hour")}</span>
                        <span>{formatNumber(trendHistory[trendHistory.length - 1].transactionsPerHour, 1)}</span>
                      </div>
                      <div className="h-16 w-full">
                        <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={tr("Transactions / hour")}>
                          {(() => {
                            const values = trendHistory.map((point) => point.transactionsPerHour).filter((value): value is number => value != null);
                            if (values.length < 2) return null;
                            const min = Math.min(...values);
                            const max = Math.max(...values);
                            const span = max - min || 1;
                            const points = trendHistory.map((point, index) => {
                              const value = point.transactionsPerHour ?? min;
                              const x = (index / Math.max(trendHistory.length - 1, 1)) * 600;
                              const y = 58 - ((value - min) / span) * 52;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }).join(" ");
                            return <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />;
                          })()}
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{tr("Operations / hour")}</span>
                        <span>{formatNumber(trendHistory[trendHistory.length - 1].operationsPerHour, 1)}</span>
                      </div>
                      <div className="h-16 w-full">
                        <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={tr("Operations / hour")}>
                          {(() => {
                            const values = trendHistory.map((point) => point.operationsPerHour).filter((value): value is number => value != null);
                            if (values.length < 2) return null;
                            const min = Math.min(...values);
                            const max = Math.max(...values);
                            const span = max - min || 1;
                            const points = trendHistory.map((point, index) => {
                              const value = point.operationsPerHour ?? min;
                              const x = (index / Math.max(trendHistory.length - 1, 1)) * 600;
                              const y = 58 - ((value - min) / span) * 52;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }).join(" ");
                            return <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />;
                          })()}
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{tr("Success rate")}</span>
                      <span>{formatNumber(trendHistory[trendHistory.length - 1].successRate, 1)}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {tr("This history is stored locally in the browser. It contains only snapshots actually observed by this ZAF TECH instance; it is not a prefilled historical dataset.")}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className={`mt-7 ${tabClass("transactions")}`}>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{tr("Recent Transactions")}</h2>
                  <p className="text-[11px] text-muted-foreground">{tr("Latest 100 from Pi Mainnet Horizon")}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.transactions.length ? (showAllTransactions ? data.transactions : data.transactions.slice(0, RECENT_RECORD_PREVIEW)).map((tx) => (
                  <div key={tx.hash} className="border-b border-border p-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-foreground">{short(tx.hash, 18)}</span>
                      <span className={`text-[11px] ${tx.successful === false ? "text-destructive" : "text-muted-foreground"}`}>
                        {tx.successful === false ? tr("Failed") : tr("Successful")}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {tr("Ledger")} {tx.ledger ?? "—"} · {tx.operationCount ?? "—"} {tr("operations")} · {tr("fee")} {tx.feePi != null ? `${formatNumber(tx.feePi, 7)} Pi` : "—"}
                    </div>
                  </div>
                )) : <div className="p-4 text-xs text-muted-foreground">{tr("No transaction records available.")}</div>}
              </div>
              {data?.transactions.length && data.transactions.length > RECENT_RECORD_PREVIEW ? (
                <button
                  type="button"
                  onClick={() => setShowAllTransactions((current) => !current)}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {showAllTransactions ? tr("Show less") : `${tr("Show all")} ${data.transactions.length} ${tr(data.transactions.length === 1 ? "transaction" : "transactions")}`}
                </button>
              ) : null}
            </section>

            <section className={`mt-7 ${tabClass("operations")}`}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{tr("Recent Operations")}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.operations.length ? (showAllOperations ? data.operations : data.operations.slice(0, RECENT_RECORD_PREVIEW)).map((op) => (
                  <div key={op.id} className="border-b border-border p-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-foreground">{op.type}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{short(op.id, 16)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {tr("Ledger")} {op.ledger ?? "—"} · {op.amountPi != null ? `${formatNumber(op.amountPi, 7)} Pi` : tr("No amount field")}
                    </div>
                  </div>
                )) : <div className="p-4 text-xs text-muted-foreground">{tr("No operation records available.")}</div>}
              </div>
              {data?.operations.length && data.operations.length > RECENT_RECORD_PREVIEW ? (
                <button
                  type="button"
                  onClick={() => setShowAllOperations((current) => !current)}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {showAllOperations ? tr("Show less") : `${tr("Show all")} ${data.operations.length} ${tr(data.operations.length === 1 ? "operation" : "operations")}`}
                </button>
              ) : null}
            </section>

            {activeTab === "history" ? <ZafHistoricalExplorer locale={locale} /> : null}
            {activeTab === "wallet" ? <ZafWalletIntelligence locale={locale} /> : null}

            <footer className="mt-7 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
              {tr("Source: Pi Mainnet Horizon. Generated")} {data ? new Date(data.generatedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US") : "—"}.
              {tr("ZAF TECH displays public blockchain activity and does not claim to measure Pi app traffic or ecosystem usage outside observable chain data.")}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
