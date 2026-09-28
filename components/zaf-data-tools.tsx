"use client";

import { useEffect, useState } from "react";
import { countStoredLedgers, getStoredLedgers, getStoredLedgerStats, saveLedgers, type StoredLedgerStats } from "@/lib/zaf/history-db";
import type { Locale } from "@/lib/zaf/i18n";

interface WalletData {
  address: string;
  availablePi: number;
  claimablePi: number;
  totalObservedPi: number;
  lockups: Array<{ id: string; amountPi: number; canClaimNow: boolean; unlockAt: string | null }>;
  fetchedAt: string;
  error: string | null;
}

interface LedgerPage {
  ledgers: Array<{ sequence: string; closedAt: string; transactionCount: number; operationCount: number }>;
  nextCursor: string | null;
  hasMore: boolean;
}

export function ZafWalletIntelligence({ locale }: { locale: Locale }) {
  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  async function inspectWallet() {
    setWalletLoading(true);
    setWalletError("");
    try {
      const response = await fetch(`/api/zaf/wallet?address=${encodeURIComponent(address.trim())}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Wallet request failed");
      setWallet(payload);
    } catch (error) {
      setWallet(null);
      setWalletError(error instanceof Error ? error.message : "Wallet request failed");
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="zaf-heading text-sm font-semibold text-foreground">{tr("Wallet Intelligence", "Cüzdan İstihbaratı")}</h2>
        <p className="text-[11px] text-muted-foreground">
          {tr("Inspect public Pi Mainnet balance and on-chain claimable balances for a wallet address.", "Bir cüzdan adresinin herkese açık Pi Mainnet bakiyesini ve zincir üzerindeki claimable bakiyelerini inceleyin.")}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value.toUpperCase())}
            onKeyDown={(event) => { if (event.key === "Enter") void inspectWallet(); }}
            placeholder="G..."
            aria-label={tr("Pi wallet address", "Pi cüzdan adresi")}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-foreground"
          />
          <button
            type="button"
            disabled={walletLoading || !address.trim()}
            onClick={() => void inspectWallet()}
            className="rounded-lg border border-border bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50"
          >
            {walletLoading ? tr("Reading…", "Okunuyor…") : tr("Inspect wallet", "Cüzdanı incele")}
          </button>
        </div>

        {walletError ? <p className="mt-3 text-xs text-destructive">{walletError}</p> : null}

        {wallet ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label={tr("Available Pi", "Kullanılabilir Pi")} value={wallet.availablePi.toLocaleString("en-US", { maximumFractionDigits: 7 })} detail={tr("Native account balance", "Native hesap bakiyesi")} />
              <Metric label={tr("Claimable / locked", "Claimable / kilitli")} value={wallet.claimablePi.toLocaleString("en-US", { maximumFractionDigits: 7 })} detail={tr("Claimable balances observed on-chain", "Zincirde gözlenen claimable bakiyeler")} />
              <Metric label={tr("Observed total", "Gözlenen toplam")} value={wallet.totalObservedPi.toLocaleString("en-US", { maximumFractionDigits: 7 })} detail={tr("Available + claimable", "Kullanılabilir + claimable")} />
            </div>
            <div className="rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground">
              <div className="font-medium text-foreground">{tr("Wallet", "Cüzdan")}</div>
              <div className="mt-1 break-all font-mono">{wallet.address}</div>
            </div>
            {wallet.lockups.length ? (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-foreground">{tr("Claimable balances", "Claimable bakiyeler")}</div>
                {wallet.lockups.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-[11px]">
                    <span className="font-mono">{item.id.slice(0, 18)}…</span>
                    <span>{item.amountPi.toLocaleString("en-US", { maximumFractionDigits: 7 })} Pi</span>
                    <span className="text-muted-foreground">
                      {item.canClaimNow ? tr("Claimable now", "Şimdi alınabilir") : item.unlockAt ? new Date(item.unlockAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US") : tr("Predicate-based", "Predicate tabanlı")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">{tr("No claimable balances found for this address.", "Bu adres için claimable bakiye bulunamadı.")}</p>
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {tr("This is an on-chain observation. Claimable balances are not automatically assumed to be Pi Network mining lockups; ZAF TECH will classify lockup patterns separately as the historical engine expands.", "Bu bir zincir üstü gözlemdir. Claimable bakiyeler otomatik olarak Pi Network mining lockup kabul edilmez; tarihsel motor genişledikçe lockup kalıplarını ayrıca sınıflandıracağız.")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{detail}</div>
    </div>
  );
}

export function ZafHistoricalExplorer({ locale }: { locale: Locale }) {
  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;
  const [pages, setPages] = useState<LedgerPage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storedCount, setStoredCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [newLedgers, setNewLedgers] = useState(0);
  const [historicalStats, setHistoricalStats] = useState<StoredLedgerStats>({
    count: 0,
    transactionCount: 0,
    operationCount: 0,
    oldestClosedAt: null,
    newestClosedAt: null,
  });

  useEffect(() => {
    let active = true;
    void getStoredLedgers().then((rows) => {
      if (!active || !rows.length) return;
      const restored = rows.map((row) => ({
        sequence: row.sequence,
        closedAt: row.closedAt,
        transactionCount: row.transactionCount,
        operationCount: row.operationCount,
      }));
      setPages([{ ledgers: restored, nextCursor: null, hasMore: true }]);
      setCursor(null);
      return Promise.all([countStoredLedgers(), getStoredLedgerStats()]).then(([count, stats]) => {
        if (active) {
          setStoredCount(count);
          setHistoricalStats(stats);
        }
      });
    }).catch(() => undefined);
    void syncLatest();
    return () => { active = false; };
  }, []);

  async function syncLatest() {
    setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/zaf/historical?limit=200", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Historical sync failed");

      const existing = await getStoredLedgers(1);
      const newestStored = existing[0] ? Number(existing[0].sequence) : 0;
      const fresh = payload.ledgers.filter((ledger: LedgerPage["ledgers"][number]) => Number(ledger.sequence) > newestStored);

      await saveLedgers(payload.ledgers.map((ledger: LedgerPage["ledgers"][number]) => ({
        ...ledger,
        savedAt: new Date().toISOString(),
      })));

      const [count, stats] = await Promise.all([countStoredLedgers(), getStoredLedgerStats()]);
      setStoredCount(count);
      setHistoricalStats(stats);
      setNewLedgers(fresh.length);
      setLastSync(new Date().toISOString());
      setPages([payload]);
      setCursor(payload.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Historical sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function loadPage(reset = false) {
    setLoading(true);
    setError("");
    try {
      const currentCursor = reset ? null : cursor;
      const response = await fetch(`/api/zaf/historical?limit=200${currentCursor ? `&cursor=${encodeURIComponent(currentCursor)}` : ""}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Historical request failed");
      await saveLedgers(payload.ledgers.map((ledger: LedgerPage["ledgers"][number]) => ({
        ...ledger,
        savedAt: new Date().toISOString(),
      })));
      setPages((current) => reset ? [payload] : [...current, payload]);
      setCursor(payload.nextCursor);
      const [count, stats] = await Promise.all([countStoredLedgers(), getStoredLedgerStats()]);
      setStoredCount(count);
      setHistoricalStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Historical request failed";
      setError(message.includes("410")
        ? tr("Pi Horizon has no history available for the requested pagination cursor.", "Pi Horizon istenen sayfalama imlecinden önce erişilebilir geçmiş sunmuyor.")
        : message);
    } finally {
      setLoading(false);
    }
  }

  const all = pages.flatMap((page) => page.ledgers);
  const uniqueVisibleLedgers = Array.from(
    new Map(all.map((ledger) => [ledger.sequence, ledger])).values()
  );

  const elapsedHours = historicalStats.oldestClosedAt && historicalStats.newestClosedAt
    ? Math.max(0, (Date.parse(historicalStats.newestClosedAt) - Date.parse(historicalStats.oldestClosedAt)) / 3_600_000)
    : 0;
  const historicalTxPerHour = elapsedHours > 0 ? historicalStats.transactionCount / elapsedHours : null;
  const historicalOpsPerHour = elapsedHours > 0 ? historicalStats.operationCount / elapsedHours : null;
  const averageTxPerLedger = historicalStats.count ? historicalStats.transactionCount / historicalStats.count : null;
  const averageOpsPerLedger = historicalStats.count ? historicalStats.operationCount / historicalStats.count : null;

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="zaf-heading text-sm font-semibold text-foreground">{tr("Historical Data Engine", "Tarihsel Veri Motoru")}</h2>
          <p className="text-[11px] text-muted-foreground">{tr("Incremental Pi Mainnet ledger collection with persistent local storage.", "Kalıcı yerel depolama kullanan artımlı Pi Mainnet ledger toplama motoru.")}</p>
        </div>
        <button type="button" onClick={() => void syncLatest()} disabled={syncing} className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">
          {syncing ? tr("Syncing…", "Senkronize ediliyor…") : tr("Sync Mainnet", "Mainnet'i senkronize et")}
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        {all.length ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Metric label={tr("Loaded ledgers", "Yüklenen ledger")} value={uniqueVisibleLedgers.length.toLocaleString("en-US")} detail={tr("Unique real Mainnet records in this view", "Bu görünümdeki benzersiz gerçek Mainnet kayıtları")} />
              <Metric label={tr("Stored locally", "Yerelde saklanan")} value={storedCount.toLocaleString("en-US")} detail={tr("Persistent IndexedDB records on this device", "Bu cihazdaki kalıcı IndexedDB kayıtları")} />
              <Metric label={tr("New this sync", "Bu senkronizasyonda yeni")} value={newLedgers.toLocaleString("en-US")} detail={tr("Ledgers newer than the stored tip", "Yerel kayıtların en yeni ledger'ından sonraki kayıtlar")} />
              <Metric label={tr("Transactions", "İşlemler")} value={historicalStats.transactionCount.toLocaleString("en-US")} detail={tr("Sum across all stored unique ledgers", "Tüm saklanan benzersiz ledger'ların toplamı")} />
              <Metric label={tr("Operations", "Operasyonlar")} value={historicalStats.operationCount.toLocaleString("en-US")} detail={tr("Sum across all stored unique ledgers", "Tüm saklanan benzersiz ledger'ların toplamı")} />
              <Metric label={tr("Historical tx / hour", "Tarihsel işlem / saat")} value={historicalTxPerHour != null ? historicalTxPerHour.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "—"} detail={tr("Across the locally stored time span", "Yerelde saklanan zaman aralığı genelinde")} />
              <Metric label={tr("Historical ops / hour", "Tarihsel operasyon / saat")} value={historicalOpsPerHour != null ? historicalOpsPerHour.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "—"} detail={tr("Across the locally stored time span", "Yerelde saklanan zaman aralığı genelinde")} />
              <Metric label={tr("Average tx / ledger", "Ortalama işlem / ledger")} value={averageTxPerLedger != null ? averageTxPerLedger.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"} detail={tr("Stored ledger average", "Saklanan ledger ortalaması")} />
              <Metric label={tr("Average ops / ledger", "Ortalama operasyon / ledger")} value={averageOpsPerLedger != null ? averageOpsPerLedger.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"} detail={tr("Stored ledger average", "Saklanan ledger ortalaması")} />
            </div>
            {lastSync ? <p className="mt-3 text-[10px] text-muted-foreground">{tr("Last sync", "Son senkronizasyon")}: {new Date(lastSync).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}</p> : null}
            {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => void loadPage(false)} disabled={loading || !cursor} className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">
                {loading ? tr("Loading…", "Yükleniyor…") : cursor ? tr("Load older 200 ledgers", "200 daha eski ledger yükle") : tr("End of available history", "Mevcut geçmişin sonu")}
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-border px-3 py-3">
              <div className="text-[11px] font-medium text-foreground">{tr("Historical window", "Tarihsel pencere")}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {historicalStats.oldestClosedAt && historicalStats.newestClosedAt
                  ? `${new Date(historicalStats.oldestClosedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} → ${new Date(historicalStats.newestClosedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}`
                  : "—"}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {elapsedHours > 0 ? tr(`${elapsedHours.toFixed(1)} hours observed across all stored records`, `${elapsedHours.toFixed(1)} saat tüm saklanan kayıtlar genelinde`) : tr("Waiting for enough time-separated records", "Yeterli zaman ayrışmasına sahip kayıt bekleniyor")}
              </div>
            </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {tr("The engine does not pretend that one page equals the full Mainnet. Each ledger is keyed by its sequence in IndexedDB, so repeated pages are stored once and long-term metrics aggregate the complete locally stored history.", "Motor tek bir sayfanın tüm Mainnet olduğunu varsaymaz. Her ledger IndexedDB'de sequence değeriyle tekilleştirilir; tekrarlanan sayfalar bir kez saklanır ve uzun dönem metrikleri yerelde saklanan tüm geçmiş üzerinden hesaplanır.")}
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs text-muted-foreground">{tr("No historical pages loaded yet.", "Henüz tarihsel sayfa yüklenmedi.")}</p>
            <button type="button" onClick={() => void loadPage(true)} disabled={loading} className="mt-3 rounded-lg border border-border bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50">
              {loading ? tr("Loading…", "Yükleniyor…") : tr("Start historical scan", "Tarihsel taramayı başlat")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}