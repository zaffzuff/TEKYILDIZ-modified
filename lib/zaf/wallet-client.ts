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

type HorizonResponse = Record<string, unknown>;
type HorizonRecord = Record<string, unknown>;

const BASE = "https://api.mainnet.minepi.com";
const HORIZON_TIMEOUT_MS = 10_000;

async function horizon(path: string): Promise<HorizonResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HORIZON_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Pi Horizon request failed: ${response.status}`);
    return response.json() as Promise<HorizonResponse>;
  } finally {
    clearTimeout(timeout);
  }
}

function nativeBalance(account: HorizonResponse): number {
  const balances = account.balances;
  if (!Array.isArray(balances)) return 0;

  const balance = balances.find(
    (item): item is HorizonRecord =>
      Boolean(item) &&
      typeof item === "object" &&
      (item as HorizonRecord).asset_type === "native",
  );

  return Number(balance?.balance ?? 0);
}

function predicateUnlockAt(predicate: unknown, createdAt: string | null): string | null {
  if (!predicate || typeof predicate !== "object") return null;

  const record = predicate as HorizonRecord;
  const absolute = record.abs_before;
  if (typeof absolute === "string" && absolute) return absolute;

  const relative = Number(record.rel_before);
  if (Number.isFinite(relative) && createdAt) {
    const createdAtMs = Date.parse(createdAt);
    if (!Number.isFinite(createdAtMs)) return null;
    return new Date(createdAtMs + relative * 1000).toISOString();
  }

  return null;
}

function canClaim(predicate: unknown, createdAt: string | null): boolean {
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

  const embedded = claimablePage._embedded;
  const records = embedded && typeof embedded === "object" && Array.isArray((embedded as HorizonRecord).records)
    ? ((embedded as HorizonRecord).records as unknown[]).filter(
        (record): record is HorizonRecord => Boolean(record) && typeof record === "object",
      )
    : [];

  const lockups = records
    .filter((record) => record.asset === "native" || record.asset_type === "native")
    .map((record) => {
      const createdAt = typeof record.created_at === "string" ? record.created_at : null;
      const predicate = record.predicate ?? null;
      const claimants = Array.isArray(record.claimants)
        ? record.claimants.map((claimant) => {
            if (claimant && typeof claimant === "object") {
              return String((claimant as HorizonRecord).destination ?? "");
            }
            return String(claimant ?? "");
          })
        : [];

      return {
        id: String(record.id ?? record.balance_id ?? ""),
        amountPi: Number(record.amount ?? 0),
        claimants,
        canClaimNow: canClaim(predicate, createdAt),
        createdAt,
        unlockAt: predicateUnlockAt(predicate, createdAt),
        predicate,
      } satisfies ZafWalletLockup;
    });

  const availablePi = nativeBalance(account);
  const claimablePi = lockups.reduce((sum: number, item: ZafWalletLockup) => sum + item.amountPi, 0);

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
