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

    const windowStart = times[0];
    const windowEnd = times[times.length - 1];
    const latest = recent[0];

    const sampled = new Map<string, ZafLedger>();
    for (const ledger of recent) sampled.set(ledger.sequence, ledger);

    const checkpoints = Array.from({ length: 12 }, (_, index) => {
      const target = windowEnd - ((windowEnd - windowStart) * index) / 11;
      let closest = recent[0];
      let closestDistance = Math.abs(Date.parse(closest.closedAt) - target);
      for (const candidate of recent) {
        const distance = Math.abs(Date.parse(candidate.closedAt) - target);
        if (distance < closestDistance) {
          closest = candidate;
          closestDistance = distance;
        }
      }
      return closest.sequence;
    });

    for (const sequence of checkpoints) {
      if (sampled.has(sequence)) continue;
      try {
        const raw = await horizon(`/ledgers/${sequence}`);
        sampled.set(sequence, mapLedger(raw));
      } catch {
        // Keep the endpoint useful even if a single historical lookup is unavailable.
      }
    }

    const points = Array.from(sampled.values())
      .filter((ledger) => checkpoints.includes(ledger.sequence))
      .sort((a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt))
      .map((ledger) => {
        const successful = ledger.successfulTransactionCount;
        const failed = ledger.failedTransactionCount;
        const total = successful != null && failed != null
          ? successful + failed
          : ledger.transactionCount;
        return {
          sequence: ledger.sequence,
          closedAt: ledger.closedAt,
          transactions: total,
          operations: ledger.operationCount,
          successRate: successful != null && failed != null && total
            ? (successful / total) * 100
            : null,
        };
      });

    const actualWindowHours = latest.closedAt && windowStart
      ? Math.max(1, (Date.parse(latest.closedAt) - windowStart) / 1000 / 60 / 60)
      : 24;

    return { windowHours: Number(actualWindowHours.toFixed(1)), points, error: null };
  } catch (error) {
    return {
      windowHours: 24,
      points: [],
      error: error instanceof Error ? error.message : "Unable to load historical Pi Mainnet activity",
    };
  }
}
