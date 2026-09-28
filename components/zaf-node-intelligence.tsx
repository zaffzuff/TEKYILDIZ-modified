"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import type { ZafSnapshot } from "@/lib/zaf/types";
import { ZafNodeHistory } from "@/components/zaf-node-history";

const NODE_KEY_STORAGE = "zaf-tech-node-public-key-v1";
const MIN_CONNECTOR_VERSION = "1.6.0";

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

function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    const av = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

type LocalNodeData = {
  connector?: { connected?: boolean; docker?: boolean; core?: boolean; version?: string };
  node?: {
    containerName?: string;
    containerId?: string;
    state?: string;
    image?: string;
    protocol?: number | string | null;
    protocolSupport?: "supported" | "newer_or_unsupported" | "unknown";
    compatibility?: { supportedProtocols?: number[]; status?: string };
    sync?: string;
    startedAt?: string | null;
    restartCount?: number;
    health?: string | null;
    publishedPorts?: string;
    ledger?: { number?: number; age?: number; hash?: string; version?: number };
    peers?: { authenticated?: number; pending?: number; inbound?: number | null; outbound?: number | null; pendingInbound?: number | null; pendingOutbound?: number | null };
    quorum?: { node?: string; phase?: string; agree?: number; disagree?: number; missing?: number; lagMs?: number; intersection?: boolean; nodeCount?: number };
  } | null;
  ports?: Array<{ port: number; listeningLocally: boolean }>;
  observedAt?: string;
  error?: string;
};


function formatBytes(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
  return size.toFixed(size >= 10 || index === 0 ? 0 : 1) + " " + units[index];
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits) + "%";
}

type LocalResourcesData = {
  connector?: string;
  observedAt?: string;
  host?: { cpuPercent?: number | null; memory?: { totalBytes?: number | null; usedBytes?: number | null; usedPercent?: number | null }; disk?: { drive?: string; totalBytes?: number | null; usedBytes?: number | null; usedPercent?: number | null }; network?: { receivedBytes?: number | null; sentBytes?: number | null } } | null;
  docker?: { cpuPercent?: number | null; memory?: { usedBytes?: number | null; limitBytes?: number | null; usedPercent?: number | null }; network?: { receivedBytes?: number | null; sentBytes?: number | null }; blockIO?: { readBytes?: number | null; writeBytes?: number | null }; pids?: number | null } | null;
  wsl?: { available?: boolean; distributions?: Array<{ name?: string; state?: string; version?: number | null }>; status?: string | null } | null;
};

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
  const [localNode, setLocalNode] = useState<LocalNodeData | null>(null);
  const [localNodeLoading, setLocalNodeLoading] = useState(true);
  const [localNodeError, setLocalNodeError] = useState(false);
  const [localResources, setLocalResources] = useState<LocalResourcesData | null>(null);

  async function refreshLocalNode() {
    setLocalNodeLoading(true);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      const [nodeResponse, resourcesResponse] = await Promise.all([
        fetch("http://127.0.0.1:39100/node", { cache: "no-store", signal: controller.signal }),
        fetch("http://127.0.0.1:39100/resources", { cache: "no-store", signal: controller.signal }),
      ]);
      window.clearTimeout(timeout);
      if (!nodeResponse.ok) throw new Error("Local connector unavailable");
      setLocalNode((await nodeResponse.json()) as LocalNodeData);
      setLocalResources(resourcesResponse.ok ? ((await resourcesResponse.json()) as LocalResourcesData) : null);
      setLocalNodeError(false);
    } catch {
      setLocalNode(null);
      setLocalResources(null);
      setLocalNodeError(true);
    } finally {
      setLocalNodeLoading(false);
    }
  }

  useEffect(() => {
    void refreshLocalNode();
    const interval = window.setInterval(() => void refreshLocalNode(), 15000);
    return () => window.clearInterval(interval);
  }, []);

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
        <h2 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("Node Intelligence", "Node İstihbaratı")}</h2>
        <p className="text-[11px] text-muted-foreground">
          {tr(
            "A node-operator workspace combining Pi's published ranking signals with live local Node diagnostics.",
            "Pi'nin yayımladığı Node sıralama sinyallerini canlı yerel Node teşhisleriyle birleştiren Node operatörü çalışma alanı."
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
          label={tr("Observed network protocol", "Gözlemlenen ağ protokolü")}
          value={data?.metrics.latestProtocolVersion != null ? `v${data.metrics.latestProtocolVersion}` : "—"}
          detail={tr("Read from the latest observed ledger", "Son gözlemlenen ledger'dan okunur")}
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
            <h3 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("My Node Identity", "Node Kimliğim")}</h3>
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
          <h3 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("Published Node Signals", "Yayımlanan Node Sinyalleri")}</h3>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("ZAF TECH Node Connector", "ZAF TECH Node Connector")}</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              {tr(
                "Install the Windows companion to connect this browser to your own local Pi Node. It runs on localhost and reads Node diagnostics without exposing Docker remotely.",
                "Bu tarayıcıyı kendi yerel Pi Node'unuza bağlamak için Windows yardımcı uygulamasını kurun. Yalnızca localhost üzerinde çalışır ve Docker'ı uzaktan açmadan Node teşhislerini okur."
              )}
            </p>
          </div>
          <a
            href="https://github.com/zaffzuff/ZAF-TECH/releases/latest"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-border bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
          >
            {tr("Download for Windows", "Windows için indir")}
          </a>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Local-only", "Yalnızca yerel")}</div>
            <div className="mt-1">{tr("Listens on 127.0.0.1 only.", "Yalnızca 127.0.0.1 üzerinde dinler.")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Read-only diagnostics", "Salt-okunur teşhis")}</div>
            <div className="mt-1">{tr("Reads Docker and Stellar Core state; it does not control your Node.", "Docker ve Stellar Core durumunu okur; Node'unuzu yönetmez.")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
            <div className="font-medium text-foreground">{tr("Wallet-safe design", "Cüzdan güvenliği")}</div>
            <div className="mt-1">{tr("Never asks for a wallet passphrase, seed phrase, or private key.", "Cüzdan parolası, seed phrase veya private key istemez.")}</div>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          {tr("The download opens the official ZAF TECH GitHub Releases page.", "İndirme bağlantısı resmi ZAF TECH GitHub Releases sayfasını açar.")}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("Node Diagnostics", "Node Teşhisi")}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {tr(
                "Live local diagnostics from this computer. The connector is localhost-only and reads Docker state without exposing Docker remotely.",
                "Bu bilgisayardan canlı yerel teşhis verileri. Bağlantı yalnızca localhost üzerinde çalışır ve Docker durumunu uzaktan açmadan okur."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshLocalNode()}
            disabled={localNodeLoading}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {localNodeLoading ? tr("Checking…", "Kontrol ediliyor…") : tr("Refresh local Node", "Yerel Node'u yenile")}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              tr("Local connector", "Yerel bağlantı"),
              localNodeLoading
                ? tr("Checking…", "Kontrol ediliyor…")
                : localNodeError
                  ? tr("Not detected", "Bulunamadı")
                  : tr("Connected", "Bağlı"),
            ],
            [
              tr("Docker", "Docker"),
              localNode?.connector?.docker ? tr("Available", "Hazır") : tr("Unavailable", "Kullanılamıyor"),
            ],
            [
              tr("Node container", "Node container"),
              localNode?.node?.containerName || "—",
            ],
            [
              tr("Sync", "Senkronizasyon"),
              ["synced", "synced!"].includes(String(localNode?.node?.sync || "").toLowerCase())
                ? tr("Synced", "Senkronize")
                : localNode?.node?.sync === "catching_up"
                  ? tr("Catching up", "Yetişiyor")
                  : localNode?.node?.sync === "joining_scp"
                    ? "Joining SCP"
                    : localNode?.node?.sync === "error"
                      ? tr("Error", "Hata")
                      : "—",
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border px-3 py-3">
              <div className="text-[10px] text-muted-foreground">{label}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Protocol", "Protokol")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{localNode?.node?.protocol || "—"}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{localNode?.node?.image || tr("No Pi container detected", "Pi container bulunamadı")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Protocol support", "Protokol desteği")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.node?.protocolSupport === "supported"
                ? tr("Supported", "Destekleniyor")
                : localNode?.node?.protocolSupport === "newer_or_unsupported"
                  ? tr("Newer / unsupported", "Yeni / desteklenmiyor")
                  : "—"}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.compatibility?.supportedProtocols?.length
                ? tr(
                    "Connector supports v" + localNode.node.compatibility.supportedProtocols.join(" / v"),
                    "Connector v" + localNode.node.compatibility.supportedProtocols.join(" / v") + " destekliyor"
                  )
                : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Local ports", "Yerel portlar")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.ports ? localNode.ports.filter((item) => item.listeningLocally).length : 0}/10
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{tr("Listening on this computer; not an Internet reachability test", "Bu bilgisayarda dinleyen portlar; Internet erişilebilirlik testi değildir")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Started", "Başlangıç")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.node?.startedAt ? new Date(localNode.node.startedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US") : "—"}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{tr("Container start timestamp", "Container başlangıç zamanı")}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Restarts", "Yeniden başlatma")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{localNode?.node?.restartCount ?? "—"}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{tr("Docker restart count", "Docker yeniden başlatma sayısı")}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Ledger", "Ledger")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.node?.ledger?.number?.toLocaleString() || "—"}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.ledger?.age != null
                ? tr(`${localNode.node.ledger.age}s old`, `${localNode.node.ledger.age}s yaşında`)
                : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("Peers", "Peerler")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.node?.peers?.authenticated ?? "—"}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                {tr("authenticated", "doğrulanmış")}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.peers?.inbound != null && localNode?.node?.peers?.outbound != null
                ? tr(
                    `Incoming ${localNode.node.peers.inbound} / Outgoing ${localNode.node.peers.outbound}`,
                    `Gelen ${localNode.node.peers.inbound} / Giden ${localNode.node.peers.outbound}`
                  )
                : tr("Direction data unavailable", "Yön verisi kullanılamıyor")}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.peers?.pending != null
                ? tr(`${localNode.node.peers.pending} pending`, `${localNode.node.peers.pending} beklemede`)
                : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("SCP quorum", "SCP quorum")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{localNode?.node?.quorum?.phase || "—"}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.quorum
                ? `${localNode.node.quorum.agree ?? 0} agree / ${localNode.node.quorum.missing ?? 0} missing`
                : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <div className="text-[10px] text-muted-foreground">{tr("SCP lag", "SCP gecikmesi")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {localNode?.node?.quorum?.lagMs != null ? `${localNode.node.quorum.lagMs} ms` : "—"}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {localNode?.node?.quorum?.intersection === true
                ? tr("Intersection: true", "Intersection: true")
                : tr("Intersection: —", "Intersection: —")}
            </div>
          </div>
        </div>


        <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3">
          <div className="mb-2">
            <div className="text-xs font-semibold text-foreground">{tr("Host & Docker resources", "Host ve Docker kaynakları")}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{tr("Read-only live resource telemetry from the local Connector.", "Yerel Connector'dan salt-okunur canlı kaynak telemetrisi.")}</div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-[10px] text-muted-foreground">{tr("Host CPU", "Host CPU")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(localResources?.host?.cpuPercent)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{tr("RAM", "RAM")}: {formatPercent(localResources?.host?.memory?.usedPercent)} · {formatBytes(localResources?.host?.memory?.usedBytes)} / {formatBytes(localResources?.host?.memory?.totalBytes)}</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-[10px] text-muted-foreground">{tr("C: disk", "C: disk")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(localResources?.host?.disk?.usedPercent)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{formatBytes(localResources?.host?.disk?.usedBytes)} / {formatBytes(localResources?.host?.disk?.totalBytes)}</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-[10px] text-muted-foreground">{tr("Node container", "Node container")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(localResources?.docker?.cpuPercent)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{tr("RAM", "RAM")}: {formatPercent(localResources?.docker?.memory?.usedPercent)} · {formatBytes(localResources?.docker?.memory?.usedBytes)} / {formatBytes(localResources?.docker?.memory?.limitBytes)} · {tr("PIDs", "PID")}: {localResources?.docker?.pids ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-[10px] text-muted-foreground">{tr("Docker network", "Docker ağı")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">↓ {formatBytes(localResources?.docker?.network?.receivedBytes)} · ↑ {formatBytes(localResources?.docker?.network?.sentBytes)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{tr("WSL", "WSL")}: {localResources?.wsl?.available ? tr("Available", "Hazır") : tr("Unavailable", "Kullanılamıyor")}</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">{tr("Host network", "Host ağı")}: ↓ {formatBytes(localResources?.host?.network?.receivedBytes)} · ↑ {formatBytes(localResources?.host?.network?.sentBytes)} · {tr("Docker block I/O", "Docker block I/O")}: R {formatBytes(localResources?.docker?.blockIO?.readBytes)} / W {formatBytes(localResources?.docker?.blockIO?.writeBytes)}</div>
        </div>

        {!localNodeError && localNode?.connector?.version && compareVersions(localNode.connector.version, MIN_CONNECTOR_VERSION) < 0 ? (
          <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{tr("Connector update required", "Connector güncellemesi gerekli")}: </span>
            {tr(
              "This ZAF TECH version requires Connector v" + MIN_CONNECTOR_VERSION + " or newer. Your local Connector is v" + localNode.connector.version + ". Download the current Windows release before using local diagnostics.",
              "Bu ZAF TECH sürümü Connector v" + MIN_CONNECTOR_VERSION + " veya daha yenisini gerektiriyor. Yerel Connector sürümünüz v" + localNode.connector.version + ". Yerel teşhisleri kullanmadan önce güncel Windows sürümünü indirin."
            )}
          </div>
        ) : null}

        {localNodeError ? (
          <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3 text-[10px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{tr("Connector not detected", "Connector bulunamadı")}: </span>
            {tr(
              "Install and start ZAF TECH Node Connector on this Windows computer, then refresh the local Node diagnostics.",
              "Bu Windows bilgisayara ZAF TECH Node Connector'ı kurup çalıştırın, ardından yerel Node teşhislerini yenileyin."
            )}
          </div>
        ) : null}

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {tr(
            "This connector layer reports local Docker/container state and local port listeners. It deliberately does not label local port listeners as Internet-open ports and does not fabricate Pi ranking values.",
            "Bu bağlantı katmanı yerel Docker/container durumunu ve yerel port dinleyicilerini raporlar. Yerel portları kasıtlı olarak Internet'e açık port diye etiketlemez ve Pi sıralama değerleri uydurmaz."
          )}
        </p>
      </div>

      <ZafNodeHistory locale={locale} />

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <h3 className="zaf-heading zaf-heading text-sm font-semibold text-foreground">{tr("Why your Node matters", "Node'unuz neden önemli")}</h3>
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