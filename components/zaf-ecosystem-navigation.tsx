"use client";

import type { Locale } from "@/lib/zaf/i18n";

export type ZafSection = "overview" | "apps" | "node" | "intelligence";

export const ZAF_SECTION_TABS: Record<ZafSection, readonly string[]> = {
  overview: ["Ecosystem", "Network", "Tools"],
  apps: ["App Directory", "App Health"],
  node: ["Node", "Node History", "SoloHost", "Compute", "Infrastructure"],
  intelligence: ["Radar", "Activity Signals", "Explorer", "Wallet"],
};

const labels: Record<string, [string, string]> = {
  Overview: ["Overview", "Genel Bakış"], Network: ["Network", "Ağ"], Ecosystem: ["Ecosystem", "Ekosistem"], Tools: ["Tools", "Araçlar"],
  Apps: ["Apps", "Uygulamalar"], "App Directory": ["App Directory", "Uygulama Dizini"], "App Health": ["App Health", "Uygulama Sağlığı"],
  "Node & Compute": ["Node & Compute", "Node & Compute"], Node: ["Node", "Node"], "Node History": ["Node History", "Node Geçmişi"],
  SoloHost: ["SoloHost", "SoloHost"], Compute: ["Compute", "Hesaplama"], Infrastructure: ["Infrastructure", "Altyapı"],
  Intelligence: ["Intelligence", "İstihbarat"], Radar: ["Radar", "Radar"], "Activity Signals": ["Activity Signals", "Aktivite Sinyalleri"], Explorer: ["Explorer", "Explorer"], Wallet: ["Wallet", "Cüzdan"],
};

function label(value: string, locale: Locale) {
  const pair = labels[value] ?? [value, value];
  return locale === "tr" ? pair[1] : pair[0];
}

export function ZafEcosystemNavigation({ locale, section, subtab, onSectionChange, onSubtabChange }: {
  locale: Locale; section: ZafSection; subtab: string; onSectionChange: (section: ZafSection) => void; onSubtabChange: (subtab: string) => void;
}) {
  const sections: Array<[ZafSection, string]> = [["overview", "Overview"], ["apps", "Apps"], ["node", "Node & Compute"], ["intelligence", "Intelligence"]];
  const subtabs = ZAF_SECTION_TABS[section];
  return <nav className="mt-4 border-t border-border pt-3" aria-label={locale === "tr" ? "Ekosistem bölümleri" : "Ecosystem sections"}>
    <div className="overflow-x-auto ty-no-scrollbar"><div className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1 sm:min-w-0 sm:flex-wrap">
      {sections.map(([id, title]) => <button key={id} type="button" onClick={() => { onSectionChange(id); onSubtabChange(ZAF_SECTION_TABS[id][0]); }} className={"min-h-9 shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors " + (section === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{label(title, locale)}</button>)}
    </div></div>
    {subtabs.length ? <div className="mt-2 overflow-x-auto ty-no-scrollbar"><div className="flex min-w-max gap-1 pb-1 sm:min-w-0 sm:flex-wrap">
      {subtabs.map(item => <button key={item} type="button" onClick={() => onSubtabChange(item)} className={"shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-colors " + (subtab === item ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{label(item, locale)}</button>)}
    </div></div> : null}
  </nav>;
}
