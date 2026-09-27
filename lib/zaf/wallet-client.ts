export interface ZafWalletLockup {
  id: string;
  amountPi: number;
  claimants: string[];
  canClaimNow: boolean;
  createdAt: string | null;
  unlockAt: string | null;
  predicate: unknown;
}

export interface ZafWalletSnapshot {
  address: string;
  availablePi: number;
  claimablePi: number;
  totalObservedPi: number;
  lockups: ZafWalletLockup[];
  fetchedAt: string;
  source: "Pi Mainnet Horizon";
  error: string | null;
}

const BASE = "https://api.mainnet.minepi.com";
const HORIZON_TIMEOUT_MS = 10_000;

async function horizon(path: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HORIZON_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Pi Horizon request failed: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function nativeBalance(account: any): number {
  const balance = (account?.balances ?? []).find((item: any) => item.asset_type === "native");
  return Number(balance?.balance ?? 0);
}

function predicateUnlockAt(predicate: any, createdAt: string | null): string | null {
  const absolute = predicate?.abs_before;
  if (typeof absolute === "string" && absolute) return absolute;
  const relative = Number(predicate?.rel_before);
  if (Number.isFinite(relative) && createdAt) {
    return new Date(Date.parse(createdAt) + relative * 1000).toISOString();
  }
  return null;
}

function canClaim(predicate: any, createdAt: string | null): boolean {
  const unlockAt = predicateUnlockAt(predicate, createdAt);
  return unlockAt ? Date.now() >= Date.parse(unlockAt) : false;
}

export async function getZafWallet(address: string): Promise<ZafWalletSnapshot> {
  const normalized = address.trim();
  if (!/^G[A-Z2-7]{55}$/.test(normalized)) {
    throw new Error("Invalid Pi wallet address");
  }

  const [account, claimablePage] = await Promise.all([
    horizon(`/accounts/${encodeURIComponent(normalized)}`),
    horizon(`/claimable_balances?claimant=${encodeURIComponent(normalized)}&limit=200&order=desc`),
  ]);

  const records = claimablePage?._embedded?.records ?? [];
  const lockups = records
    .filter((record: any) => record.asset === "native" || record.asset_type === "native")
    .map((record: any) => {
      const createdAt = record.created_at ?? null;
      const predicate = record.predicate ?? null;
      return {
        id: String(record.id ?? record.balance_id ?? ""),
        amountPi: Number(record.amount ?? 0),
        claimants: (record.claimants ?? []).map((claimant: any) => String(claimant.destination ?? claimant)),
        canClaimNow: canClaim(predicate, createdAt),
        createdAt,
        unlockAt: predicateUnlockAt(predicate, createdAt),
        predicate,
      } satisfies ZafWalletLockup;
    });

  const availablePi = nativeBalance(account);
  const claimablePi = lockups.reduce((sum, item) => sum + item.amountPi, 0);

  return {
    address: normalized,
    availablePi,
    claimablePi,
    totalObservedPi: availablePi + claimablePi,
    lockups,
    fetchedAt: new Date().toISOString(),
    source: "Pi Mainnet Horizon",
    error: null,
  };
}
