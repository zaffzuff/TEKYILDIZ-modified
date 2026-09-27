import type { ZafLedger, ZafOperation, ZafSnapshot, ZafTransaction } from "./types";

const BASE = "https://api.mainnet.minepi.com";

async function horizon(path: string): Promise<any> {
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Pi Horizon request failed: ${response.status}`);
  }
  return response.json();
}

function stroopsToPi(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n / 10_000_000 : null;
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
    transactionCount: Number(raw.transaction_count ?? 0),
    operationCount: Number(raw.operation_count ?? 0),
    successfulTransactionCount: numberOrNull(raw.successful_transaction_count),
    successfulOperationCount: numberOrNull(raw.successful_operation_count),
    protocolVersion: numberOrNull(raw.protocol_version),
    baseFeePi: stroopsToPi(raw.base_fee_in_stroops),
  };
}

function mapTransaction(raw: any): ZafTransaction {
  return {
    hash: String(raw.hash ?? raw.id ?? ""),
    ledger: raw.ledger != null ? String(raw.ledger) : null,
    createdAt: raw.created_at != null ? String(raw.created_at) : null,
    successful: typeof raw.successful === "boolean" ? raw.successful : null,
    sourceAccount: raw.source_account != null ? String(raw.source_account) : null,
    feePi: stroopsToPi(raw.fee_charged),
    operationCount: numberOrNull(raw.operation_count),
    memo: raw.memo != null ? String(raw.memo) : null,
  };
}

function mapOperation(raw: any): ZafOperation {
  return {
    id: String(raw.id ?? ""),
    ledger: raw.ledger != null ? String(raw.ledger) : null,
    createdAt: raw.created_at != null ? String(raw.created_at) : null,
    type: String(raw.type ?? "unknown"),
    successful: typeof raw.transaction_successful === "boolean" ? raw.transaction_successful : null,
    sourceAccount: raw.source_account != null ? String(raw.source_account) : null,
    transactionHash: raw.transaction_hash != null ? String(raw.transaction_hash) : null,
    amountPi: stroopsToPi(raw.amount),
    from: raw.from != null ? String(raw.from) : null,
    to: raw.to != null ? String(raw.to) : null,
  };
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export async function getZafSnapshot(): Promise<ZafSnapshot> {
  const generatedAt = new Date().toISOString();

  try {
    const [ledgerPage, transactionPage, operationPage] = await Promise.all([
      horizon("/ledgers?order=desc&limit=100"),
      horizon("/transactions?order=desc&limit=20"),
      horizon("/operations?order=desc&limit=20"),
    ]);

    const recentLedgers = (ledgerPage?._embedded?.records ?? []).map(mapLedger);
    const transactions = (transactionPage?._embedded?.records ?? []).map(mapTransaction);
    const operations = (operationPage?._embedded?.records ?? []).map(mapOperation);

    const closeTimes = recentLedgers
      .map((ledger) => Date.parse(ledger.closedAt))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < closeTimes.length; i++) {
      intervals.push((closeTimes[i] - closeTimes[i - 1]) / 1000);
    }

    const txTotal = recentLedgers.reduce((sum, l) => sum + l.transactionCount, 0);
    const opTotal = recentLedgers.reduce((sum, l) => sum + l.operationCount, 0);

    return {
      network: "Pi Network",
      source: "Pi Mainnet Horizon",
      generatedAt,
      latestLedger: recentLedgers[0] ?? null,
      recentLedgers,
      transactions,
      operations,
      metrics: {
        recentLedgerCount: recentLedgers.length,
        recentTransactions: txTotal,
        recentOperations: opTotal,
        avgTransactionsPerLedger: recentLedgers.length ? txTotal / recentLedgers.length : null,
        avgOperationsPerLedger: recentLedgers.length ? opTotal / recentLedgers.length : null,
        avgLedgerCloseSeconds: average(intervals),
        latestProtocolVersion: recentLedgers[0]?.protocolVersion ?? null,
      },
      error: null,
    };
  } catch (error) {
    return {
      network: "Pi Network",
      source: "Pi Mainnet Horizon",
      generatedAt,
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
      },
      error: error instanceof Error ? error.message : "Unknown Pi Mainnet error",
    };
  }
}
