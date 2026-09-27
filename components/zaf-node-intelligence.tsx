"use client";

import { useEffect, useState } from "react";
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

function NodeMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold ty-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium text-foreground">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

export function ZafNodeIntelligence({ locale, data }: { locale: Locale; data: ZafSnapshot | null }) {
  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;
  const [publicKey, setPublicKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(NODE_KEY_STORAGE);
    if (stored) setPublicKey(stored);
  }, []);

  function saveIdentity() {
    const value = publicKey.trim();
    if (!value) {
      window.localStorage.removeItem(NODE_KEY_STORAGE);
      setSaved(false);
      return;
    }
    window.localStorage.setItem(NODE_KEY_STORAGE, value);
    setSaved(true);
  }

  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{tr("Node Intelligence", "Node İstihbaratı")}</h2>
        <p className="text-[11px] text-muted-foreground">
          {tr(
            "A node-operator workspace built around Pi's published ranking signals and real Mainnet observations.",
            "Pi'nin yayımladığı Node sıralama sinyalleri ve gerçek Mainnet gözlemleri üzerine kurulu Node operatörü çalışma alanı."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NodeMetric
          label={tr("Pi Node operators", "Pi Node operatörleri")}
          value="420,000+"
          detail={tr("Pi-published figure from June 2026", "Pi'nin Haziran 2026'da yayımladığı sayı")}
        />
        <NodeMetric
          label={tr("Published ranking", "Yayımlanan sıralama")}
          value="Top 5,000"
          detail={tr("Ranking page published by Pi Blockexplorer", "Pi Blockexplorer tarafından yayımlanan sıralama")}
        />
        <NodeMetric
          label={tr("Ranking refresh", "Sıralama yenileme")}
          value="24h"
          detail={tr("Pi says rankings refresh every 24 hours", "Pi sıralamanın 24 saatte bir yenilendiğini belirtiyor")}
        />
        <NodeMetric
          label={tr("Observed Mainnet protocol", "Gözlemlenen Mainnet protokolü")}
          value={data?.metrics.latestProtocolVersion != null ? `v${data.metrics.latestProtocolVersion}` : "—"}
          detail={tr("Read directly from the latest observed Mainnet ledger", "Son gözlemlenen Mainnet ledger'ından doğrudan okunur")}
        />
        <NodeMetric
          label={tr("Observed ledger window", "Gözlemlenen ledger penceresi")}
          value={formatNumber(data?.metrics.recentLedgerCount ?? null)}
          detail={tr("Current ZAF TECH Mainnet observation window", "ZAF TECH'in mevcut Mainnet gözlem penceresi")}
        />
        <NodeMetric
          label={tr("Node data mode", "Node veri modu")}
          value={tr("Public", "Herkese açık")}
          detail={tr("No private node credentials are requested", "Özel Node kimlik bilgileri istenmez")}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{tr("My Node identity", "Node kimliğim")}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {tr(
                "Save your Node public key locally so ZAF TECH can use it for future ranking and identity features. The key is stored only in this browser.",
                "Node public key'inizi yerel olarak saklayın; ZAF TECH bunu gelecekteki sıralama ve kimlik özelliklerinde kullanabilir. Anahtar yalnızca bu tarayıcıda saklanır."
              )}
            </p>
          </div>
          <a
            href="https://blockexplorer.minepi.com/mainnet/nodes"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {tr("Open Pi Node ranking", "Pi Node sıralamasını aç")}
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={publicKey}
            onChange={(event) => {
              setPublicKey(event.target.value.trim());
              setSaved(false);
            }}
            placeholder="G..."
            aria-label={tr("Node public key", "Node public key")}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={saveIdentity}
            className="rounded-lg border border-border bg-foreground px-4 py-2 text-xs font-medium text-background"
          >
            {saved ? tr("Saved", "Kaydedildi") : tr("Save identity", "Kimliği kaydet")}
          </button>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          {tr(
            "Pi says the public key shown in Pi Desktop's Node section can be used to identify a Node in the public ranking page.",
            "Pi, Pi Desktop'ın Node bölümünde gösterilen public key'in herkese açık sıralama sayfasında bir Node'u tanımlamak için kullanılabileceğini belirtiyor."
          )}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">{tr("Published Node signals", "Yayımlanan Node sinyalleri")}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {tr(
              "These are the metrics Pi says its Node ranking uses. ZAF TECH does not invent values when the public source is unavailable.",
              "Bunlar Pi'nin Node sıralamasında kullandığını belirttiği metriklerdir. Herkese açık kaynak erişilebilir değilse ZAF TECH değer uydurmaz."
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Reliability", "Güvenilirlik"],
            ["Availability", "Erişilebilirlik"],
            ["Open ports", "Açık portlar"],
            ["Total active days", "Toplam aktif gün"],
            ["CPU performance", "CPU performansı"],
          ].map(([en, trText]) => (
            <div key={en} className="rounded-lg border border-border px-3 py-3">
              <div className="text-xs font-medium text-foreground">{tr(en, trText)}</div>
              <div className="mt-1 text-sm font-semibold text-muted-foreground">—</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{tr("Public ranking value not imported yet", "Herkese açık sıralama değeri henüz içe aktarılmadı")}</div>
            </div>
          ))}
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
              <span className="text-muted-foreground">{tr("Planned", "Planlandı")}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {tr(
            "A web app cannot safely read your Pi Desktop or Docker state by itself. The next diagnostic layer will use an explicit local connector rather than pretending the browser can see the machine.",
            "Bir web uygulaması Pi Desktop veya Docker durumunuzu kendi başına güvenli şekilde okuyamaz. Sonraki teşhis katmanı, tarayıcının makineyi görebildiğini varsaymak yerine açık bir yerel bağlantı katmanı kullanacaktır."
          )}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{tr("Data boundary", "Veri sınırı")}: </span>
        {tr(
          "ZAF TECH does not display a fabricated global map of individual Node computers. A complete official public geolocation feed for all Nodes was not verified, so location data is not inferred from IP addresses.",
          "ZAF TECH tek tek Node bilgisayarlarını gösteren uydurma bir küresel harita sunmaz. Tüm Node'lar için eksiksiz resmi bir herkese açık konum akışı doğrulanmadığı için IP adreslerinden konum çıkarımı yapılmaz."
        )}
      </div>
    </section>
  );
}
