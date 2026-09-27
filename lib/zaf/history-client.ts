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
    const averageIntervalSeconds = times.length > 1
      ? (times[times.length - 1] - times[0]) / 1000 / (times.length - 1)
      : 5;

    const latestSequence = Number(recent[0].sequence);
    const ledgersPerTwoHours = Math.max(1, Math.round((2 * 60 * 60) / averageIntervalSeconds));
    const sequences = Array.from({ length: 12 }, (_, index) =>
      Math.max(1, latestSequence - index * ledgersPerTwoHours)
    );

    const sampled = await Promise.all(
      sequences.map(async (sequence) => {
        const raw = await horizon(`/ledgers/${sequence}`);
        return mapLedger(raw);
      })
    );

    const points = sampled
      .sort((a, b) => Number(a.sequence) - Number(b.sequence))
      .map((ledger) => {
        const successful = ledger.successfulTransactionCount ?? 0;
        const failed = ledger.failedTransactionCount ?? 0;
        const total = successful + failed;
        return {
          sequence: ledger.sequence,
          closedAt: ledger.closedAt,
          transactions: total,
          operations: ledger.operationCount,
          successRate: total ? (successful / total) * 100 : null,
        };
      });

    return { windowHours: 24, points, error: null };
  } catch (error) {
    return {
      windowHours: 24,
      points: [],
      error: error instanceof Error ? error.message : "Unable to load historical Pi Mainnet activity",
    };
  }
}
