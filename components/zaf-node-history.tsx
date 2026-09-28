"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";

type Sample = {
  observedAt: string;
  available: boolean;
  healthy: boolean;
  ledgerAge?: number | null;
  authenticated?: number | null;
  inbound?: number | null;
  outbound?: number | null;
  pending?: number | null;
  quorumPhase?: string | null;
};

type Payload = {
  version?: string;
  windowDays?: number;
  sampleIntervalSeconds?: number;
  samples?: Sample[];
  error?: string;
};

type WindowHours = 24 | 168 | 720;

function avg(values: Array<number | null | undefined>) {
  const v = values.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function pct(samples: Sample[], key: "available" | "healthy") {
  return samples.length ? (samples.filter((s) => s[key]).length / samples.length) * 100 : null;
}

export function ZafNodeHistory({ locale }: { locale: Locale }) {
  const tr = (en: string, trText: string) => locale === "tr" ? trText : en;
  const [payload, setPayload] = useState<Payload | null>(null);
  const [windowHours, setWindowHours] = useState<WindowHours>(24);

  async function load() {
    try {
      const r = await fetch("http://127.0.0.1:39100/history", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setPayload(await r.json());
    } catch {
      setPayload(null);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const samples = useMemo(() => {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    return (payload?.samples ?? [])
      .filter((s) => Date.parse(s.observedAt) >= cutoff)
      .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  }, [payload, windowHours]);

  const stats = useMemo(() => ({
    availability: pct(samples, "available"),
    health: pct(samples, "healthy"),
    inbound: avg(samples.map((s) => s.inbound)),
    outbound: avg(samples.map((s) => s.outbound)),
    maxInbound: Math.max(0, ...samples.map((s) => s.inbound ?? 0)),
    maxOutbound: Math.max(0, ...samples.map((s) => s.outbound ?? 0)),
  }), [samples]);

  const chart = samples.slice(-60);
  const maxPeers = Math.max(8, ...chart.flatMap((s) => [s.inbound ?? 0, s.outbound ?? 0]));

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{tr("Node performance history", "Node performans geçmişi")}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {tr("Local read-only observations stored by the Connector on this Windows computer.", "Connector tarafından bu Windows bilgisayarda saklanan yerel salt-okunur gözlemler.")}
          </p>
        </div>
        <div className="flex gap-1">
          {([24, 168, 720] as WindowHours[]).map((hours) => (
            <button key={hours} type="button" onClick={() => setWindowHours(hours)}
              className={`rounded-md border px-2.5 py-1.5 text-[10px] font-medium ${windowHours === hours ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-muted"}`}>
              {hours === 24 ? tr("24h", "24s") : hours === 168 ? tr("7d", "7g") : tr("30d", "30g")}
            </button>
          ))}
        </div>
      </div>

      {!payload ? (
        <div className="mt-4 rounded-lg border border-border px-3 py-4 text-[11px] text-muted-foreground">
          {tr("Install and run Connector v0.3.0 to start collecting Node history.", "Node geçmişini toplamaya başlamak için Connector v0.3.0 kurup çalıştırın.")}
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              [tr("Availability", "Erişilebilirlik"), stats.availability == null ? "—" : `${stats.availability.toFixed(2)}%`],
              [tr("Healthy", "Sağlıklı"), stats.health == null ? "—" : `${stats.health.toFixed(2)}%`],
              [tr("Avg incoming", "Ort. gelen"), stats.inbound == null ? "—" : stats.inbound.toFixed(1)],
              [tr("Avg outgoing", "Ort. giden"), stats.outbound == null ? "—" : stats.outbound.toFixed(1)],
              [tr("Samples", "Örnek"), samples.length.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border px-3 py-3">
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-border p-3">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{tr("Incoming / outgoing peer history", "Gelen / giden peer geçmişi")}</span>
              <span>{tr("Max", "Maks.")}: {stats.maxInbound} / {stats.maxOutbound}</span>
            </div>
            {chart.length > 1 ? (
              <svg viewBox="0 0 600 180" className="mt-2 h-44 w-full" role="img" aria-label={tr("Peer history chart", "Peer geçmişi grafiği")}>
                <line x1="0" y1="160" x2="600" y2="160" stroke="currentColor" strokeOpacity="0.12" />
                <polyline fill="none" stroke="currentColor" strokeWidth="2"
                  points={chart.map((s, i) => `${(i / (chart.length - 1)) * 600},${160 - ((s.inbound ?? 0) / maxPeers) * 140}`).join(" ")} />
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" strokeOpacity="0.5"
                  points={chart.map((s, i) => `${(i / (chart.length - 1)) * 600},${160 - ((s.outbound ?? 0) / maxPeers) * 140}`).join(" ")} />
              </svg>
            ) : (
              <div className="flex h-44 items-center justify-center text-[11px] text-muted-foreground">
                {tr("Collecting enough observations for the chart…", "Grafik için yeterli gözlem toplanıyor…")}
              </div>
            )}
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span>— {tr("Incoming", "Gelen")}</span><span>-- {tr("Outgoing", "Giden")}</span>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-[10px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">{tr("Time", "Zaman")}</th>
                  <th className="px-3 py-2">{tr("Status", "Durum")}</th>
                  <th className="px-3 py-2">{tr("Incoming", "Gelen")}</th>
                  <th className="px-3 py-2">{tr("Outgoing", "Giden")}</th>
                  <th className="px-3 py-2">{tr("Pending", "Bekleyen")}</th>
                  <th className="px-3 py-2">{tr("Ledger age", "Ledger yaşı")}</th>
                  <th className="px-3 py-2">SCP</th>
                </tr>
              </thead>
              <tbody>
                {samples.slice(-8).reverse().map((s) => (
                  <tr key={s.observedAt} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(s.observedAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}</td>
                    <td className="px-3 py-2">{s.healthy ? tr("Healthy", "Sağlıklı") : s.available ? tr("Available", "Çalışıyor") : tr("Unavailable", "Kullanılamıyor")}</td>
                    <td className="px-3 py-2">{s.inbound ?? "—"}</td>
                    <td className="px-3 py-2">{s.outbound ?? "—"}</td>
                    <td className="px-3 py-2">{s.pending ?? "—"}</td>
                    <td className="px-3 py-2">{s.ledgerAge != null ? `${s.ledgerAge}s` : "—"}</td>
                    <td className="px-3 py-2">{s.quorumPhase || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            {tr(
              "Availability is based on Connector observations. Healthy follows Stellar Core's documented indicators: Synced!, ledger age under 10 seconds, at least 8 authenticated peers, EXTERNALIZE, and quorum intersection true.",
              "Erişilebilirlik Connector gözlemlerine dayanır. Sağlıklı durumu Stellar Core'un belgelenmiş göstergelerini izler: Synced!, 10 saniyenin altında ledger yaşı, en az 8 authenticated peer, EXTERNALIZE ve quorum intersection true."
            )}
          </p>
        </>
      )}
    </section>
  );
}
