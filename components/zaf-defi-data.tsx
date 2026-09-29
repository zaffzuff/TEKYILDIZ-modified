"use client";

import { useEffect, useState } from "react";
import type { EcosystemSnapshot } from "@/lib/zaf/ecosystem";
import type { Locale } from "@/lib/zaf/i18n";

function text(locale: Locale, en: string, tr: string) {
  return locale === "tr" ? tr : en;
}

function selectedDetail(locale: Locale, subtab: string) {
  const details: Record<string, [string, string]> = {
    Launchpad: [
      "Pi Launchpad is currently a Testnet product. Official updates describe it as a mechanism for testing ecosystem-token launches, participation, liquidity, and utility before a Mainnet version.",
      "Pi Launchpad şu anda Testnet ürünüdür. Resmi güncellemeler, Mainnet sürümünden önce ekosistem token lansmanları, katılım, likidite ve faydayı test eden bir mekanizma olarak tanımlıyor.",
    ],
    "DEX & AMM": [
      "Pi DEX and AMM liquidity pools are currently documented as Testnet functionality. Official updates cover liquidity organization, domain verification, token ranking by liquidity, and swap mechanics.",
      "Pi DEX ve AMM likidite havuzları şu anda Testnet işlevleri olarak belgeleniyor. Resmi güncellemeler likidite düzeni, domain doğrulama, likiditeye göre token sıralaması ve swap mekaniklerini kapsıyor.",
    ],
    "Official Context": [
      "This section keeps DeFi interpretation tied to official Pi sources. ZAF TECH does not turn Testnet activity into Mainnet market data and does not infer prices, volume, liquidity balances, or market capitalization.",
      "Bu bölüm DeFi yorumunu resmi Pi kaynaklarıyla sınırlar. ZAF TECH Testnet aktivitesini Mainnet piyasa verisine dönüştürmez; fiyat, hacim, likidite bakiyesi veya piyasa değeri tahmin etmez.",
    ],
  };
  const pair = details[subtab] ?? details.Launchpad;
  return text(locale, pair[0], pair[1]);
}

export function ZafDefiData({ locale, subtab }: { locale: Locale; subtab: string }) {
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/zaf/ecosystem", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const next = (await response.json()) as EcosystemSnapshot;
        if (active) setSnapshot(next);
      } catch {
        if (active) setSnapshot(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 5 * 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (loading) return <section className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">{text(locale, "Loading DeFi intelligence…", "DeFi zekâ verisi yükleniyor…")}</section>;
  if (!snapshot) return <section className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">{text(locale, "Official DeFi sources are temporarily unavailable.", "Resmi DeFi kaynakları şu anda erişilemiyor.")}</section>;

  const d = snapshot.defi;
  const cards = subtab === "Launchpad"
    ? [
        [text(locale, "Launchpad status", "Launchpad durumu"), text(locale, "Testnet", "Testnet"), d.launchpad.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
        [text(locale, "Purpose", "Amaç"), text(locale, "Product testing", "Ürün testi"), text(locale, "Testing token launches, participation, and utility before Mainnet.", "Mainnet öncesinde token lansmanı, katılım ve faydayı test etmek.")],
        [text(locale, "Latest official update", "Son resmi güncelleme"), d.launchpad.latestUpdate?.title ?? "—", text(locale, "Source-backed update", "Kaynak destekli güncelleme")],
      ] as const
    : subtab === "DEX & AMM"
      ? [
          [text(locale, "DEX status", "DEX durumu"), text(locale, "Testnet", "Testnet"), d.dex.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
          [text(locale, "AMM status", "AMM durumu"), text(locale, "Testnet", "Testnet"), d.amm.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
          [text(locale, "Mainnet trading", "Mainnet işlemleri"), text(locale, "Restricted", "Kısıtlı"), d.mainnetTrading.detail],
        ] as const
      : [
          [text(locale, "Network", "Ağ"), text(locale, "Testnet", "Testnet"), text(locale, "Current official DeFi functionality is documented on Testnet.", "Mevcut resmi DeFi işlevleri Testnet üzerinde belgeleniyor.")],
          [text(locale, "Live market data", "Canlı piyasa verisi"), "—", text(locale, "No reliable public machine-readable source is exposed to ZAF TECH for price, volume, or liquidity balances.", "ZAF TECH için fiyat, hacim veya likidite bakiyelerine ilişkin güvenilir herkese açık makine-okunabilir kaynak bulunmuyor.")],
          [text(locale, "Mainnet trading", "Mainnet işlemleri"), text(locale, "Restricted", "Kısıtlı"), d.mainnetTrading.detail],
        ] as const;

  return (
    <section className="mt-5 sm:mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{subtab}</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {text(locale, "DeFi status is separated by network and limited to officially observable information.", "DeFi durumu ağ bazında ayrılır ve yalnızca resmi olarak gözlemlenebilen bilgilerle sınırlıdır.")}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map(([label, status, detail]) => (
          <div key={label} className="rounded-xl border border-border p-3">
            <div className="text-xs font-medium text-foreground">{label}</div>
            <div className="mt-1 text-[11px] font-semibold text-foreground">{status}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
        {text(locale, "No price, volume, liquidity amount, market-cap, or Mainnet trading figures are inferred from Testnet documentation. When an official machine-readable source exposes these fields, this module can surface them directly.", "Testnet belgelerinden fiyat, hacim, likidite miktarı, piyasa değeri veya Mainnet işlem rakamları çıkarılmaz. Resmi makine-okunabilir kaynak bu alanları sunduğunda modül doğrudan gösterebilir.")}
      </div>
      <div className="mt-4 text-[10px] text-muted-foreground">
        {text(locale, "Official sources: Pi Launchpad, Pi DEX/AMM documentation and Pi Network updates.", "Resmi kaynaklar: Pi Launchpad, Pi DEX/AMM belgeleri ve Pi Network güncellemeleri.")}
      </div>
    </section>
  );
}
