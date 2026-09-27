import type { ZafLedger } from "./types";

const BASE = "https://api.mainnet.minepi.com";

async function horizon(path: string): Promise<any> {
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Pi Horizon request failed: ${response.status}`);
  return response.json();
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapLedger(raw: any): ZafLedger {
  return {
    sequence: String(raw.sequence),
    hash: String(raw.hash ?? ""),
    closedAt: String(raw.closed_at ?? ""),
    transactionCount: numberOrNull(raw.transaction_count) ?? 0,
    operationCount: numberOrNull(raw.operation_count) ?? 0,
    successfulTransactionCount: numberOrNull(raw.successful_transaction_count),
    failedTransactionCount: numberOrNull(raw.failed_transaction_count),
    successfulOperationCount: numberOrNull(raw.successful_operation_count),
    protocolVersion: numberOrNull(raw.protocol_version),
    baseFeePi: numberOrNull(raw.base_fee_in_stroops) != null ? numberOrNull(raw.base_fee_in_stroops)! / 10_000_000 : null,
  };
}

export interface ZafHistoricalPoint {
  sequence: string;
  closedAt: string;
  transactions: number;
  operations: number;
  successRate: number | null;
  transactionsPerHour: number | null;
  operationsPerHour: number | null;
  windowMinutes: number;
}

export interface ZafHistoricalActivity {
  windowHours: number;
  points: ZafHistoricalPoint[];
  error: string | null;
}

export async function getZafHistoricalActivity(): Promise<ZafHistoricalActivity> {
  try {
    const page = await horizon("/ledgers?order=desc&limit=100");
    const recent = (page?._embedded?.records ?? []).map(mapLedger) as ZafLedger[];
    if (recent.length < 2) throw new Error("Insufficient ledger history");

    const times = recent.map((l) => Date.parse(l.closedAt)).filter(Number.isFinite).sort((a, b) => a - b);
    const ordered = recent
      .filter((ledger) => Number.isFinite(Date.parse(ledger.closedAt)))
      .sort((a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt));

    if (ordered.length < 2) throw new Error("Ledger timestamps are unavailable");

    const bucketCount = Math.min(12, ordered.length);
    const bucketSize = Math.ceil(ordered.length / bucketCount);
    const points: ZafHistoricalPoint[] = [];
    const fullWindowSeconds = Math.max(
      1,
      (Date.parse(ordered[ordered.length - 1].closedAt) - Date.parse(ordered[0].closedAt)) / 1000
    );
    const averageIntervalSeconds = fullWindowSeconds / Math.max(1, ordered.length - 1);

    for (let start = 0; start < ordered.length; start += bucketSize) {
      const bucket = ordered.slice(start, Math.min(start + bucketSize, ordered.length));
      const first = Date.parse(bucket[0].closedAt);
      const last = Date.parse(bucket[bucket.length - 1].closedAt);
      const elapsedSeconds = bucket.length > 1
        ? Math.max(1, (last - first) / 1000)
        : averageIntervalSeconds;

      const transactions = bucket.reduce((sum, ledger) => {
        const successful = ledger.successfulTransactionCount;
        const failed = ledger.failedTransactionCount;
        return sum + (successful != null && failed != null
          ? successful + failed
          : ledger.transactionCount);
      }, 0);
      const operations = bucket.reduce((sum, ledger) => sum + ledger.operationCount, 0);
      const successful = bucket.reduce((sum, ledger) => sum + (ledger.successfulTransactionCount ?? 0), 0);
      const failed = bucket.reduce((sum, ledger) => sum + (ledger.failedTransactionCount ?? 0), 0);
      const knownTotal = successful + failed;
      const hours = elapsedSeconds / 3600;

      points.push({
        sequence: bucket[bucket.length - 1].sequence,
        closedAt: bucket[bucket.length - 1].closedAt,
        transactions,
        operations,
        successRate: knownTotal > 0 ? (successful / knownTotal) * 100 : null,
        transactionsPerHour: transactions / hours,
        operationsPerHour: operations / hours,
        windowMinutes: elapsedSeconds / 60,
      });
    }

    const actualWindowHours = fullWindowSeconds / 3600;

    return { windowHours: Number(actualWindowHours.toFixed(2)), points, error: null };
  } catch (error) {
    return {
      windowHours: 24,
      points: [],
      error: error instanceof Error ? error.message : "Unable to load historical Pi Mainnet activity",
    };
  }
}
