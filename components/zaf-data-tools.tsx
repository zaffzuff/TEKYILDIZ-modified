"use client";

import { useEffect, useState } from "react";
import { countStoredLedgers, getStoredLedgers, saveLedgers } from "@/lib/zaf/history-db";
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
        <h2 className="text-sm font-semibold text-foreground">{tr("Wallet Intelligence", "Cüzdan İstihbaratı")}</h2>
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
      setPages([{ ledgers: restored, nextCursor: rows.length ? rows[rows.length - 1].sequence : null, hasMore: true }]);
      setCursor(rows.length ? rows[rows.length - 1].sequence : null);
      return countStoredLedgers().then((count) => {
        if (active) setStoredCount(count);
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
      setStoredCount(await countStoredLedgers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Historical request failed");
    } finally {
      setLoading(false);
    }
  }

  const all = pages.flatMap((page) => page.ledgers);
  const tx = all.reduce((sum, ledger) => sum + ledger.transactionCount, 0);
  const ops = all.reduce((sum, ledger) => sum + ledger.operationCount, 0);

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{tr("Historical Data Engine", "Tarihsel Veri Motoru")}</h2>
          <p className="text-[11px] text-muted-foreground">{tr("Paginated Pi Mainnet ledger history with persistent local storage. Each sync extends the observed dataset.", "Kalıcı yerel depolama kullanan sayfalanmış Pi Mainnet ledger geçmişi. Her senkronizasyon gözlenen veri kümesini genişletir.")}</p>
        </div>
        <button type="button" onClick={() => void loadPage(true)} disabled={loading} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">
          {loading ? tr("Loading…", "Yükleniyor…") : tr("Load latest", "En yeniyi yükle")}
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        {all.length ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Metric label={tr("Loaded ledgers", "Yüklenen ledger")} value={all.length.toLocaleString("en-US")} detail={tr("Real Mainnet records in this view", "Bu görünümdeki gerçek Mainnet kayıtları")} />
              <Metric label={tr("Stored locally", "Yerelde saklanan")} value={storedCount.toLocaleString("en-US")} detail={tr("Persistent IndexedDB records on this device", "Bu cihazdaki kalıcı IndexedDB kayıtları")} />
              <Metric label={tr("Transactions", "İşlemler")} value={tx.toLocaleString("en-US")} detail={tr("Sum of loaded ledger counters", "Yüklenen ledger sayaçlarının toplamı")} />
              <Metric label={tr("Operations", "Operasyonlar")} value={ops.toLocaleString("en-US")} detail={tr("Sum of loaded ledger counters", "Yüklenen ledger sayaçlarının toplamı")} />
            </div>
            {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => void loadPage(false)} disabled={loading || !cursor} className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">
                {loading ? tr("Loading…", "Yükleniyor…") : cursor ? tr("Load older 200 ledgers", "200 daha eski ledger yükle") : tr("End of available history", "Mevcut geçmişin sonu")}
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {tr("The engine does not pretend that one page equals the full Mainnet. It advances through Horizon pagination so the dataset can grow without loading the entire chain into the browser at once.", "Motor tek bir sayfanın tüm Mainnet olduğunu varsaymaz. Horizon pagination ile ilerleyerek tüm zinciri tarayıcıya tek seferde yüklemeden veri kümesini büyütür.")}
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
