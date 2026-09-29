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
      "Launchpad is currently represented here by official Testnet status and release updates. Participation, allocation, and token mechanics are not treated as live Mainnet market data.",
      "Launchpad burada resmi Testnet durumu ve yayın güncellemeleriyle temsil edilir. Katılım, dağıtım ve token mekanikleri canlı Mainnet piyasa verisi olarak yorumlanmaz.",
    ],
    Tokens: [
      "Token-level balances, prices, market caps, and holders require a public machine-readable source. ZAF TECH does not infer them from documentation or page text.",
      "Token bazlı bakiye, fiyat, piyasa değeri ve holder verileri herkese açık makine-okunabilir kaynak gerektirir. ZAF TECH bunları belge veya sayfa metninden tahmin etmez.",
    ],
    DEX: [
      "The official DEX/AMM material currently documents Testnet functionality. Mainnet trading figures are therefore not presented here.",
      "Resmi DEX/AMM materyali mevcut durumda Testnet işlevlerini belgeliyor. Bu nedenle Mainnet işlem rakamları burada gösterilmez.",
    ],
    Liquidity: [
      "Liquidity-pool mechanics and official updates can be tracked, but live pool balances are not exposed through the current ZAF TECH source layer.",
      "Likidite havuzu mekanikleri ve resmi güncellemeler izlenebilir; ancak canlı havuz bakiyeleri mevcut ZAF TECH kaynak katmanında açığa çıkmıyor.",
    ],
    "Trading Activity": [
      "Observed Pi Mainnet blockchain activity is available under Intelligence → Explorer. It should not be interpreted as DEX-specific trading volume.",
      "Gözlemlenen Pi Mainnet blockchain aktivitesi Intelligence → Explorer altında bulunur. Bu veri DEX'e özel işlem hacmi olarak yorumlanmamalıdır.",
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
  const cards = [
    [text(locale, "Launchpad", "Launchpad"), text(locale, "Testnet", "Testnet"), d.launchpad.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
    [text(locale, "DEX", "DEX"), text(locale, "Testnet", "Testnet"), d.dex.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
    [text(locale, "AMM & Liquidity", "AMM ve Likidite"), text(locale, "Testnet", "Testnet"), d.amm.latestUpdate?.title ?? text(locale, "Official status source", "Resmi durum kaynağı")],
    [text(locale, "Mainnet Trading", "Mainnet İşlemleri"), text(locale, "Restricted", "Kısıtlı"), d.mainnetTrading.detail],
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
