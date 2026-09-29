"use client";

import type { Locale } from "@/lib/zaf/i18n";

export type ZafSection = "overview" | "apps" | "defi" | "node" | "pioneer" | "intelligence";

export const ZAF_SECTION_TABS: Record<ZafSection, readonly string[]> = {
  overview: [],
  apps: ["App Directory", "Newly Observed", "Official Context"],
  defi: ["Launchpad", "Tokens", "DEX", "Liquidity", "Trading Activity"],
  node: ["Node", "Node History", "SoloHost", "Compute", "Infrastructure"],
  pioneer: ["KYC", "Migration", "Pi Browser", "Pi Sign-in", "PiVerify"],
  intelligence: ["Ecosystem Radar", "Activity Signals", "Trends", "Explorer", "Signal History", "Ecosystem Graph"],
};

const labels: Record<string, [string, string]> = {
  Overview: ["Overview", "Genel Bakış"],
  Apps: ["Apps", "Uygulamalar"],
  DeFi: ["DeFi", "DeFi"],
  "Node & Compute": ["Node & Compute", "Node & Compute"],
  Pioneer: ["Pioneer", "Pioneer"],
  Intelligence: ["Intelligence", "İstihbarat"],
  "App Directory": ["App Directory", "Uygulama Dizini"],
  "Newly Observed": ["Newly Observed", "Yeni Gözlemlenenler"],
  "Official Context": ["Official Context", "Resmi Bağlam"],
  Launchpad: ["Launchpad", "Launchpad"],
  Tokens: ["Tokens", "Tokenlar"],
  DEX: ["DEX", "DEX"],
  Liquidity: ["Liquidity", "Likidite"],
  "Trading Activity": ["Trading Activity", "Trading Aktivitesi"],
  Node: ["Node", "Node"],
  "Node History": ["Node History", "Node Geçmişi"],
  SoloHost: ["SoloHost", "SoloHost"],
  Compute: ["Compute", "Hesaplama"],
  Infrastructure: ["Infrastructure", "Altyapı"],
  KYC: ["KYC", "KYC"],
  Migration: ["Migration", "Migrasyon"],
  "Pi Browser": ["Pi Browser", "Pi Browser"],
  "Pi Sign-in": ["Pi Sign-in", "Pi Sign-in"],
  PiVerify: ["PiVerify", "PiVerify"],
  "Ecosystem Radar": ["Ecosystem Radar", "Ekosistem Radarı"],
  "Activity Signals": ["Activity Signals", "Aktivite Sinyalleri"],
  Trends: ["Trends", "Trendler"],
  Explorer: ["Explorer", "Explorer"],
  "Signal History": ["Signal History", "Sinyal Geçmişi"],
  "Ecosystem Graph": ["Ecosystem Graph", "Ekosistem Grafiği"],
};

function label(value: string, locale: Locale) {
  const pair = labels[value] ?? [value, value];
  return locale === "tr" ? pair[1] : pair[0];
}

export function ZafEcosystemNavigation({
  locale,
  section,
  subtab,
  onSectionChange,
  onSubtabChange,
}: {
  locale: Locale;
  section: ZafSection;
  subtab: string;
  onSectionChange: (section: ZafSection) => void;
  onSubtabChange: (subtab: string) => void;
}) {
  const sections: Array<[ZafSection, string]> = [
    ["overview", "Overview"],
    ["apps", "Apps"],
    ["defi", "DeFi"],
    ["node", "Node & Compute"],
    ["pioneer", "Pioneer"],
    ["intelligence", "Intelligence"],
  ];
  const subtabs = ZAF_SECTION_TABS[section];

  return (
    <nav className="mt-4 border-t border-border pt-3" aria-label={locale === "tr" ? "Ekosistem bölümleri" : "Ecosystem sections"}>
      <div className="overflow-x-auto ty-no-scrollbar">
        <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1 sm:min-w-0 sm:flex-wrap">
          {sections.map(([id, title]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSectionChange(id);
                const first = ZAF_SECTION_TABS[id][0];
                if (first) onSubtabChange(first);
              }}
              className={"min-h-9 shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors " + (section === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              aria-current={section === id ? "page" : undefined}
            >
              {label(title, locale)}
            </button>
          ))}
        </div>
      </div>
      {subtabs.length ? (
        <div className="mt-2 overflow-x-auto ty-no-scrollbar">
          <div className="flex min-w-max gap-1 pb-1 sm:min-w-0 sm:flex-wrap">
            {subtabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSubtabChange(item)}
                className={"shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-colors " + (subtab === item ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}
              >
                {label(item, locale)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
