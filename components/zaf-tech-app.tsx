"use client";

import { useCallback, useEffect, useState } from "react";
import type { ZafSnapshot } from "@/lib/zaf/types";

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

  useEffect(() => {
    setTrendHistory(loadTrendHistory());
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
              <h1 className="mb-3 text-sm font-semibold text-foreground">Network snapshot</h1>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Latest ledger" value={data?.latestLedger?.sequence ?? "—"} detail={data?.latestLedger ? short(data.latestLedger.hash, 16) : undefined} />
                <Metric label="Protocol version" value={data?.metrics.latestProtocolVersion != null ? String(data.metrics.latestProtocolVersion) : "—"} />
                <Metric label="Recent transactions" value={formatNumber(data?.metrics.recentTransactions ?? null)} detail="Latest 100 from Pi Mainnet Horizon" />
                <Metric label="Recent operations" value={formatNumber(data?.metrics.recentOperations ?? null)} detail="Latest 100 from Pi Mainnet Horizon" />
                <Metric label="Tx / ledger (sample)" value={formatNumber(data?.metrics.avgTransactionsPerLedger ?? null, 2)} detail="Based on ledgers represented in the transaction sample" />
                <Metric label="Ledger interval" value={data?.metrics.avgLedgerCloseSeconds != null ? `${formatNumber(data.metrics.avgLedgerCloseSeconds, 2)}s` : "—"} detail="Average across the latest 100 ledgers" />
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Activity signals</h2>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Transaction success rate" value={data?.metrics.transactionSuccessRate != null ? `${formatNumber(data.metrics.transactionSuccessRate, 1)}%` : "—"} detail="Latest 100-ledger window" />
                <Metric label="Average fee" value={data?.metrics.averageTransactionFeePi != null ? `${formatNumber(data.metrics.averageTransactionFeePi, 7)} Pi` : "—"} detail="Latest transaction sample" />
                <Metric label="Operations / transaction" value={formatNumber(data?.metrics.averageOperationsPerTransaction ?? null, 2)} detail="Latest transaction sample" />
                <Metric label="Unique tx sources" value={formatNumber(data?.metrics.uniqueTransactionSources ?? null)} detail="Distinct source accounts in sample" />
                <Metric label="Unique operation sources" value={formatNumber(data?.metrics.uniqueOperationSources ?? null)} detail="Distinct source accounts in sample" />
                <Metric label="Top operation type" value={data?.metrics.topOperationType ?? "—"} detail={data?.metrics.topOperationType ? `${data.metrics.topOperationTypeCount} of latest 100 operations` : undefined} />
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Observed activity rate</h2>
              <div className="grid grid-cols-2 gap-3">
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
                  <h2 className="text-sm font-semibold text-foreground">Observation history</h2>
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
                  <h2 className="text-sm font-semibold text-foreground">Recent transactions</h2>
                  <p className="text-[11px] text-muted-foreground">Latest 100 from Pi Mainnet Horizon</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.transactions.length ? data.transactions.map((tx) => (
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
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent operations</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {data?.operations.length ? data.operations.map((op) => (
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
