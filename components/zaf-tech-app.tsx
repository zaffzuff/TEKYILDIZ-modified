"use client";

import { useCallback, useEffect, useState } from "react";
import type { ZafHistoricalActivity, ZafSnapshot } from "@/lib/zaf/types";

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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAge(value: string | null, nowMs = Date.now()) {
  if (!value) return "—";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "—";
  const seconds = Math.max(0, Math.floor((nowMs - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
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
          latestProtocolVersion: null,
          transactionSuccessRate: null,
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
                Pi Ecosystem Activity Intelligence
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={refreshing}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">Pi Network</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">Mainnet</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">Read-only</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-muted-foreground">Data fetched</div>
              <div className="mt-0.5 font-medium text-foreground">{data ? formatAge(data.generatedAt) : "—"}</div>
              <div className="mt-0.5 text-muted-foreground">{data ? formatDateTime(data.generatedAt) : "Waiting for data"}</div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-muted-foreground">Latest ledger closed</div>
              <div className="mt-0.5 font-medium text-foreground">{data?.latestLedger ? formatAge(data.latestLedger.closedAt) : "—"}</div>
              <div className="mt-0.5 text-muted-foreground">{data?.latestLedger ? formatDateTime(data.latestLedger.closedAt) : "Waiting for ledger"}</div>
            </div>
          </div>
        </header>

        {loading && !data ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading Pi Mainnet data…</div>
        ) : (
          <>
            {data?.error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                Pi Mainnet data error: {data.error}
              </div>
            )}

            <section className="mt-5">
              <h1 className="mb-3 text-sm font-semibold text-foreground">Network Snapshot</h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric label="Latest ledger" value={data?.latestLedger?.sequence ?? "—"} detail={data?.latestLedger ? short(data.latestLedger.hash, 16) : undefined} />
                <Metric label="Protocol version" value={data?.metrics.latestProtocolVersion != null ? String(data.metrics.latestProtocolVersion) : "—"} />
                <Metric label="Recent transactions" value={formatNumber(data?.metrics.recentTransactions ?? null)} detail="Latest 100 from Pi Mainnet Horizon" />
                <Metric label="Recent operations" value={formatNumber(data?.metrics.recentOperations ?? null)} detail="Latest 100 from Pi Mainnet Horizon" />
                <Metric label="Tx / ledger (sample)" value={formatNumber(data?.metrics.avgTransactionsPerLedger ?? null, 2)} detail="Based on ledgers represented in the transaction sample" />
                <Metric label="Ledger interval" value={data?.metrics.avgLedgerCloseSeconds != null ? `${formatNumber(data.metrics.avgLedgerCloseSeconds, 2)}s` : "—"} detail="Average across the latest 100 ledgers" />
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Ledger Activity Timeline</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Latest real Pi Mainnet ledgers, newest first
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {data?.recentLedgers.length ?? 0} ledgers
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
                              Ledger {ledger.sequence}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(ledger.closedAt)}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
                            <div>
                              <div className="text-muted-foreground">Transactions</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(transactions)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Operations</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(ledger.operationCount)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Ops / tx</div>
                              <div className="mt-0.5 font-medium text-foreground">{formatNumber(opsPerTx, 2)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Ledger interval</div>
                              <div className="mt-0.5 font-medium text-foreground">
                                {intervalSeconds != null ? formatNumber(intervalSeconds, 1) + "s" : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Protocol / fee</div>
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
                        {showAllLedgers ? "Show less" : "Show all " + data.recentLedgers.length + " ledgers"}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="p-4 text-xs text-muted-foreground">No ledger records available.</div>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Each row is a real Mainnet ledger observed from Pi Horizon. Transaction counts include successful and failed transactions when both ledger counters are available.
              </p>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Activity Signals</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric label="Transaction success rate" value={data?.metrics.transactionSuccessRate != null ? `${formatNumber(data.metrics.transactionSuccessRate, 1)}%` : "—"} detail="Latest 100-ledger window" />
                <Metric label="Average fee" value={data?.metrics.averageTransactionFeePi != null ? `${formatNumber(data.metrics.averageTransactionFeePi, 7)} Pi` : "—"} detail="Latest transaction sample" />
                <Metric label="Operations / transaction" value={formatNumber(data?.metrics.averageOperationsPerTransaction ?? null, 2)} detail="Latest transaction sample" />
                <Metric label="Unique tx sources" value={formatNumber(data?.metrics.uniqueTransactionSources ?? null)} detail="Distinct source accounts in sample" />
                <Metric label="Unique operation sources" value={formatNumber(data?.metrics.uniqueOperationSources ?? null)} detail="Distinct source accounts in sample" />
                <Metric label="Top operation type" value={data?.metrics.topOperationType ?? "—"} detail={data?.metrics.topOperationType ? `${data.metrics.topOperationTypeCount} of latest 100 operations` : undefined} />
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Activity Intelligence</h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Metric label="Activity state" value={data?.intelligence.activityState ?? "—"} detail="Descriptive state from observed chain data" />
                  <Metric label="Transaction rate change" value={data?.intelligence.transactionChangePercent != null ? `${data.intelligence.transactionChangePercent >= 0 ? "+" : ""}${formatNumber(data.intelligence.transactionChangePercent, 1)}%` : "—"} detail="Newer vs older half of the latest 100-ledger window" />
                  <Metric label="Operation rate change" value={data?.intelligence.operationChangePercent != null ? `${data.intelligence.operationChangePercent >= 0 ? "+" : ""}${formatNumber(data.intelligence.operationChangePercent, 1)}%` : "—"} detail="Newer vs older half of the latest 100-ledger window" />
                  <Metric label="Dominant operation share" value={data?.intelligence.dominantOperationShare != null ? `${formatNumber(data.intelligence.dominantOperationShare, 1)}%` : "—"} detail="Share of latest operation sample" />
                  <Metric label="Unique tx sources" value={formatNumber(data?.intelligence.uniqueTransactionSources ?? null)} detail="Distinct source accounts" />
                  <Metric label="Unique operation sources" value={formatNumber(data?.intelligence.uniqueOperationSources ?? null)} detail="Distinct source accounts" />
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  {(data?.intelligence.notes ?? []).map((note) => <p key={note}>• {note}</p>)}
                </div>
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Operation Distribution</h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Latest 100 operations</span>
                  <span>{data?.metrics.recentOperations ?? 0} records</span>
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
                    <div className="py-4 text-center text-xs text-muted-foreground">No operation distribution available.</div>
                  )}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Distribution is calculated from the latest real Pi Mainnet operation sample. It describes observed operation mix, not application or user activity outside the blockchain.
                </p>
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Observed Activity Rate</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  label="Transactions / hour"
                  value={data?.metrics.observedTransactionsPerHour != null ? formatNumber(data.metrics.observedTransactionsPerHour, 1) : "—"}
                  detail="Calculated across the latest 100-ledger window"
                />
                <Metric
                  label="Operations / hour"
                  value={data?.metrics.observedOperationsPerHour != null ? formatNumber(data.metrics.observedOperationsPerHour, 1) : "—"}
                  detail="Calculated across the latest 100-ledger window"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Rates are calculated from the transaction and operation counts recorded in the latest 100 ledgers; they are a rolling network activity measure, not a historical average.
              </p>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Recent Chain Activity</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Hourly-equivalent rates across the latest {historicalActivity?.windowHours ?? "—"}h of real Pi Mainnet ledger data
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {historicalActivity?.points.length ?? 0} points
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                {historicalActivity?.points.length ? (
                  <div className="space-y-4">
                    {([
                      ["Transactions / hour", historicalActivity.points.map((point) => point.transactionsPerHour ?? 0)],
                      ["Operations / hour", historicalActivity.points.map((point) => point.operationsPerHour ?? 0)],
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
                            <span>{label}</span>
                            <span>{formatNumber(values[values.length - 1], 1)}</span>
                          </div>
                          <div className="h-16 w-full">
                            <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" aria-label={label}>
                              <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[11px]">
                      <div className="rounded-lg border border-border px-3 py-2">
                        <div className="text-muted-foreground">Transactions change</div>
                        <div className="mt-1 font-medium text-foreground">
                          {historicalActivity.change.transactionsPerHourPercent == null
                            ? "—"
                            : (historicalActivity.change.transactionsPerHourPercent >= 0 ? "+" : "") + formatNumber(historicalActivity.change.transactionsPerHourPercent, 1) + "%"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border px-3 py-2">
                        <div className="text-muted-foreground">Operations change</div>
                        <div className="mt-1 font-medium text-foreground">
                          {historicalActivity.change.operationsPerHourPercent == null
                            ? "—"
                            : (historicalActivity.change.operationsPerHourPercent >= 0 ? "+" : "") + formatNumber(historicalActivity.change.operationsPerHourPercent, 1) + "%"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Latest sampled success rate</span>
                      <span>{formatNumber(historicalActivity.points[historicalActivity.points.length - 1].successRate, 1)}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Change compares the first and latest buckets in the current real ledger window. It describes observed blockchain activity; it is not a prediction or an ecosystem-wide usage score.
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Historical ledger data is not available right now.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Observation History</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Local history collected from real Pi Mainnet snapshots on this device
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {trendHistory.length} samples
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                {trendHistory.length < 2 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    History will appear after at least two automatic or manual refreshes.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Transactions / hour</span>
                        <span>{formatNumber(trendHistory[trendHistory.length - 1].transactionsPerHour, 1)}</span>
                      </div>
                      <div className="h-16 w-full">
                        <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Transactions per hour history">
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
                        <span>Operations / hour</span>
                        <span>{formatNumber(trendHistory[trendHistory.length - 1].operationsPerHour, 1)}</span>
                      </div>
                      <div className="h-16 w-full">
                        <svg viewBox="0 0 600 64" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Operations per hour history">
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
                      <span>Success rate</span>
                      <span>{formatNumber(trendHistory[trendHistory.length - 1].successRate, 1)}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      This history is stored locally in the browser. It contains only snapshots actually observed by this ZAF TECH instance; it is not a prefilled historical dataset.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
                  <p className="text-[11px] text-muted-foreground">Latest 100 from Pi Mainnet Horizon</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.transactions.length ? (showAllTransactions ? data.transactions : data.transactions.slice(0, RECENT_RECORD_PREVIEW)).map((tx) => (
                  <div key={tx.hash} className="border-b border-border p-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-foreground">{short(tx.hash, 18)}</span>
                      <span className={`text-[11px] ${tx.successful === false ? "text-destructive" : "text-muted-foreground"}`}>
                        {tx.successful === false ? "Failed" : "Successful"}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Ledger {tx.ledger ?? "—"} · {tx.operationCount ?? "—"} operations · fee {tx.feePi != null ? `${formatNumber(tx.feePi, 7)} Pi` : "—"}
                    </div>
                  </div>
                )) : <div className="p-4 text-xs text-muted-foreground">No transaction records available.</div>}
              </div>
              {data?.transactions.length && data.transactions.length > RECENT_RECORD_PREVIEW ? (
                <button
                  type="button"
                  onClick={() => setShowAllTransactions((current) => !current)}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {showAllTransactions ? "Show less" : "Show all " + data.transactions.length + " transactions"}
                </button>
              ) : null}
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Operations</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.operations.length ? (showAllOperations ? data.operations : data.operations.slice(0, RECENT_RECORD_PREVIEW)).map((op) => (
                  <div key={op.id} className="border-b border-border p-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-foreground">{op.type}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{short(op.id, 16)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Ledger {op.ledger ?? "—"} · {op.amountPi != null ? `${formatNumber(op.amountPi, 7)} Pi` : "No amount field"}
                    </div>
                  </div>
                )) : <div className="p-4 text-xs text-muted-foreground">No operation records available.</div>}
              </div>
              {data?.operations.length && data.operations.length > RECENT_RECORD_PREVIEW ? (
                <button
                  type="button"
                  onClick={() => setShowAllOperations((current) => !current)}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {showAllOperations ? "Show less" : "Show all " + data.operations.length + " operations"}
                </button>
              ) : null}
            </section>

            <footer className="mt-7 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
              Source: Pi Mainnet Horizon. Generated {data ? new Date(data.generatedAt).toLocaleString() : "—"}.
              ZAF TECH displays public blockchain activity and does not claim to measure Pi app traffic or ecosystem usage outside observable chain data.
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
