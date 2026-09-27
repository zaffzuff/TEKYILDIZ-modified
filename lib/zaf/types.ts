export interface ZafLedger {
  sequence: string;
  hash: string;
  closedAt: string;
  transactionCount: number;
  operationCount: number;
  successfulTransactionCount: number | null;
  failedTransactionCount: number | null;
  successfulOperationCount: number | null;
  protocolVersion: number | null;
  baseFeePi: number | null;
}

export interface ZafTransaction {
  hash: string;
  ledger: string | null;
  createdAt: string | null;
  successful: boolean | null;
  sourceAccount: string | null;
  feePi: number | null;
  operationCount: number | null;
  memo: string | null;
}

export interface ZafOperation {
  id: string;
  ledger: string | null;
  createdAt: string | null;
  type: string;
  successful: boolean | null;
  sourceAccount: string | null;
  transactionHash: string | null;
  amountPi: number | null;
  from: string | null;
  to: string | null;
}

export interface ZafSnapshot {
  network: "Pi Network";
  source: "Pi Mainnet Horizon";
  generatedAt: string;
  latestLedger: ZafLedger | null;
  recentLedgers: ZafLedger[];
  transactions: ZafTransaction[];
  operations: ZafOperation[];
  metrics: {
    recentLedgerCount: number;
    recentTransactions: number;
    recentOperations: number;
    avgTransactionsPerLedger: number | null;
    avgOperationsPerLedger: number | null;
    avgLedgerCloseSeconds: number | null;
    latestProtocolVersion: number | null;
    transactionSuccessRate: number | null;
    averageTransactionFeePi: number | null;
    averageOperationsPerTransaction: number | null;
    uniqueTransactionSources: number;
    uniqueOperationSources: number;
    topOperationType: string | null;
    topOperationTypeCount: number;
    transactionSampleWindowMinutes: number | null;
    operationSampleWindowMinutes: number | null;
    observedTransactionsPerHour: number | null;
    observedOperationsPerHour: number | null;
  };
  error: string | null;
}
