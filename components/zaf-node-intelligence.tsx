"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import type { ZafSnapshot } from "@/lib/zaf/types";

const NODE_KEY_STORAGE = "zaf-tech-node-public-key-v1";

function formatNumber(value: number | null, digits = 0) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function shortenKey(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function isPiPublicKey(value: string) {
  return /^G[A-Z2-7]{55}$/.test(value);
}

function NodeMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold ty-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium text-foreground">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function SignalCard({
  label,
  trLabel,
  description,
  trDescription,
}: {
  label: string;
  trLabel: string;
  description: string;
  trDescription: string;
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <div className="text-xs font-medium text-foreground">{label === "Reliability" ? trLabel : trLabel}</div>
      <div className="mt-1 text-sm font-semibold text-muted-foreground">—</div>
      <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        {description}
      </div>
      <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        {trDescription}
      </div>
    </div>
  );
}

export function ZafNodeIntelligence({ locale, data }: { locale: Locale; data: ZafSnapshot | null }) {
  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;
  const [publicKey, setPublicKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(NODE_KEY_STORAGE);
    if (stored) {
      setPublicKey(stored);
      setSaved(true);
    }
  }, []);

  const keyValid = useMemo(() => isPiPublicKey(publicKey.trim()), [publicKey]);

  function saveIdentity() {
    const value = publicKey.trim();
    if (!value) {
      window.localStorage.removeItem(NODE_KEY_STORAGE);
      setSaved(false);
      return;
    }
    if (!isPiPublicKey(value)) {
      setSaved(false);
      return;
    }
    window.localStorage.setItem(NODE_KEY_STORAGE, value);
    setSaved(true);
  }

  async function copyIdentity() {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{tr("Node Intelligence", "Node İstihbaratı")}</h2>
        <p className="text-[11px] text-muted-foreground">
          {tr(
            "A node-operator workspace combining Pi's published ranking signals with real Mainnet observations.",
            "Pi'nin yayımladığı Node sıralama sinyallerini gerçek Mainnet gözlemleriyle birleştiren Node operatörü çalışma alanı."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NodeMetric
          label={tr("Pi Node runners", "Pi Node çalıştıranlar")}
          value="420,000+"
          detail={tr("Pi-published June 2026 figure for Node runners", "Pi'nin Haziran 2026'da yayımladığı Node çalıştıranları sayısı")}
        />
        <NodeMetric
          label={tr("Published ranking", "Yayımlanan sıralama")}
          value="Top 5,000"
          detail={tr("Pi Blockexplorer's published Node ranking", "Pi Blockexplorer'ın yayımladığı Node sıralaması")}
        />
        <NodeMetric
          label={tr("Ranking refresh", "Sıralama yenileme")}
          value="24h"
          detail={tr("Pi says the ranking refreshes every 24 hours", "Pi sıralamanın 24 saatte bir yenilendiğini belirtiyor")}
        />
        <NodeMetric
          label={tr("Observed Mainnet protocol", "Gözlemlenen Mainnet protokolü")}
          value={data?.metrics.latestProtocolVersion != null ? `v${data.metrics.latestProtocolVersion}` : "—"}
          detail={tr("Read from the latest observed Mainnet ledger", "Son gözlemlenen Mainnet ledger'ından okunur")}
        />
        <NodeMetric
          label={tr("Observed ledger window", "Gözlemlenen ledger penceresi")}
          value={formatNumber(data?.metrics.recentLedgerCount ?? null)}
          detail={tr("Current ZAF TECH Mainnet observation window", "ZAF TECH'in mevcut Mainnet gözlem penceresi")}
        />
        <NodeMetric
          label={tr("Data boundary", "Veri sınırı")}
          value={tr("Public + local", "Herkese açık + yerel")}
          detail={tr("Public ranking data plus optional local diagnostics", "Herkese açık sıralama verisi ve isteğe bağlı yerel teşhis")}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{tr("My Node identity", "Node kimliğim")}</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              {tr(
                "Enter the public key shown in Pi Desktop. ZAF TECH keeps it only in this browser and uses it as the identity for future Node intelligence features.",
                "Pi Desktop'ta gösterilen public key'i girin. ZAF TECH bunu yalnızca bu tarayıcıda saklar ve gelecekteki Node istihbaratı özellikleri için kimlik olarak kullanır."
              )}
            </p>
          </div>
          <a
            href="https://blockexplorer.minepi.com/mainnet/nodes"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {tr("Open official Node ranking", "Resmi Node sıralamasını aç")}
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={publicKey}
            onChange={(event) => {
              setPublicKey(event.target.value.trim().toUpperCase());
              setSaved(false);
              setCopied(false);
            }}
            placeholder="G..."
            aria-label={tr("Node public key", "Node public key")}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={saveIdentity}
            disabled={!keyValid}
            className="rounded-lg border border-border bg-foreground px-4 py-2 text-xs font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? tr("Identity saved", "Kimlik kaydedildi") : tr("Save identity", "Kimliği kaydet")}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          <span className={keyValid ? "text-foreground" : "text-muted-foreground"}>
            {keyValid
              ? tr("Valid Pi public-key format", "Geçerli Pi public key formatı")
              : tr("Expected format: G + 55 characters", "Beklenen format: G + 55 karakter")}
          </span>
          {saved && keyValid ? (
            <>
              <span className="text-muted-foreground">
                {tr("Stored locally", "Yerel olarak saklandı")}: <span className="font-mono">{shortenKey(publicKey)}</span>
              </span>
              <button type="button" onClick={copyIdentity} className="text-foreground underline underline-offset-2">
                {copied ? tr("Copied", "Kopyalandı") : tr("Copy key", "Anahtarı kopyala")}
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{tr("What saving does now", "Kaydetmenin şu an yaptığı")}: </span>
          {tr(
            "It creates a persistent Node identity for this ZAF TECH installation. The public Blockexplorer ranking is still the authoritative place for the published Node ranking; ZAF TECH will not invent ranking values when a machine-readable public feed is unavailable.",
            "Bu işlem bu ZAF TECH kurulumu için kalıcı bir Node kimliği oluşturur. Yayımlanan Node sıralaması için yetkili kaynak hâlâ Blockexplorer'dır; makine tarafından okunabilen herkese açık bir akış yoksa ZAF TECH sıralama değerleri uydurmaz."
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">{tr("Published Node signals", "Yayımlanan Node sinyalleri")}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {tr(
              "Pi's ranking page uses five published performance signals. Their current per-Node values are not exposed to ZAF TECH through a verified machine-readable public API, so these cards remain source-aware rather than fabricated.",
              "Pi'nin sıralama sayfası beş yayımlanmış performans sinyali kullanır. Güncel Node bazlı değerler ZAF TECH'e doğrulanmış makine tarafından okunabilir bir public API üzerinden sunulmadığı için bu kartlar uydurma değer yerine kaynak durumunu gösterir."
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <SignalCard
            label="Reliability"
            trLabel={tr("Reliability", "Güvenilirlik")}
            description={tr("Reflects functional uptime/reliability signals.", "İşlevsel çalışma süresi ve güvenilirlik sinyallerini ifade eder.")}
            trDescription={tr("Pi's published ranking metric.", "Pi'nin yayımladığı sıralama metriği.")}
          />
          <SignalCard
            label="Availability"
            trLabel={tr("Availability", "Erişilebilirlik")}
            description={tr("Indicates how consistently the Node is available.", "Node'un ne kadar düzenli erişilebilir olduğunu ifade eder.")}
            trDescription={tr("Published by Pi's ranking system.", "Pi'nin sıralama sisteminde yayımlanır.")}
          />
          <SignalCard
            label="Open ports"
            trLabel={tr("Open ports", "Açık portlar")}
            description={tr("Tracks network reachability through Node ports.", "Node portları üzerinden ağ erişilebilirliğini izler.")}
            trDescription={tr("Pi documents ports 31400–31409 for Node connectivity.", "Pi Node bağlantısı için 31400–31409 portlarını belgeler.")}
          />
          <SignalCard
            label="Total active days"
            trLabel={tr("Total active days", "Toplam aktif gün")}
            description={tr("Represents accumulated Node activity history.", "Biriken Node çalışma geçmişini ifade eder.")}
            trDescription={tr("Longer history is part of Pi's published ranking signals.", "Daha uzun geçmiş Pi'nin yayımladığı sıralama sinyallerindendir.")}
          />
          <SignalCard
            label="CPU performance"
            trLabel={tr("CPU performance", "CPU performansı")}
            description={tr("Represents the computer's available processing contribution.", "Bilgisayarın sağladığı işlem kapasitesi katkısını ifade eder.")}
            trDescription={tr("Pi also describes CPU as a Node performance factor.", "Pi CPU'yu ayrıca Node performans faktörü olarak açıklar.")}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{tr("Node diagnostics", "Node teşhisi")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            ["Local Node connection", "Yerel Node bağlantısı"],
            ["Port reachability", "Port erişilebilirliği"],
            ["Sync status", "Senkronizasyon durumu"],
            ["Node uptime history", "Node çalışma geçmişi"],
          ].map(([en, trText]) => (
            <div key={en} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-[11px]">
              <span className="text-foreground">{tr(en, trText)}</span>
              <span className="text-muted-foreground">{tr("Local connector required", "Yerel bağlantı gerekli")}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {tr(
            "The next layer can read Pi Desktop/Docker state only through an explicit local connector. That keeps ZAF TECH honest about what a normal web browser can and cannot access.",
            "Sonraki katman Pi Desktop/Docker durumunu yalnızca açık bir yerel bağlantı üzerinden okuyabilir. Böylece ZAF TECH normal bir web tarayıcısının erişebileceği ve erişemeyeceği sınırları doğru şekilde korur."
          )}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{tr("Why your Node matters", "Node'unuz neden önemli")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Blockchain contribution", "Blockchain katkısı")}</div>
            <div className="mt-1">{tr("Pi describes Nodes as computers that verify blockchain validity and support the distributed ledger.", "Pi, Node'ları blockchain geçerliliğini doğrulayan ve dağıtık ledger'a katkı sağlayan bilgisayarlar olarak tanımlar.")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Connectivity", "Bağlantı")}</div>
            <div className="mt-1">{tr("Pi's published Node metrics include availability and open-port signals, making connectivity an observable part of Node performance.", "Pi'nin yayımladığı Node metrikleri arasında erişilebilirlik ve açık port sinyalleri bulunur; bağlantı Node performansının gözlemlenebilir bir parçasıdır.")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Future compute utility", "Gelecekteki hesaplama kullanımı")}</div>
            <div className="mt-1">{tr("Pi is also developing Node-based distributed computing use cases through SoloHost.", "Pi ayrıca SoloHost üzerinden Node tabanlı dağıtık hesaplama kullanım alanları geliştiriyor.")}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{tr("Data boundary", "Veri sınırı")}: </span>
        {tr(
          "ZAF TECH does not infer individual Node location from IP addresses or display a fabricated global Node map. It only presents data that can be tied to a documented public source or an explicit local connector.",
          "ZAF TECH IP adreslerinden tek tek Node konumu çıkarmaz ve uydurma küresel Node haritası göstermez. Yalnızca belgelenmiş herkese açık bir kaynağa veya açık bir yerel bağlantıya bağlanabilen verileri sunar."
        )}
      </div>
    </section>
  );
}
