"use client";

import Image from "next/image";
import Link from "next/link";
import type { DirectoryApp } from "@/lib/zaf/app-directory";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import { localeLabels, translate } from "@/lib/zaf/i18n";

function displayStatus(value: string | null | undefined) {
  if (!value) return "—";
  if (value === "unknown") return "Not Checked";
  return value.replace(/[_-]+/g, " ").trim().toLowerCase().replace(/^./, char => char.toUpperCase());
}
function verification(value: DirectoryApp["piAuthentication"]) {
  if (value === "verified") return "Verified";
  return "Not Verified";
}

export function AppDetails({ app }: { app: DirectoryApp }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { const saved = window.localStorage.getItem("zaf-tech-locale-v1"); if (saved === "en" || saved === "es" || saved === "tr") setLocale(saved as Locale); }, []);
  const tr = (en: string, trText: string) => translate(locale, en, trText);
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 pb-10">
        <header className="border-b border-border pb-5 pt-7">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">{tr("← Back To ZAF TECH", "← ZAF TECH'e Dön")}</Link>
            <select value={locale} onChange={e => { const next = e.target.value as Locale; setLocale(next);  }} aria-label={tr("Language", "Dil")} className="rounded-md border bg-background px-2 py-1 text-[10px] text-foreground">
              {(["en", "es", "tr"] as Locale[]).sort((a, b) => localeLabels[a].localeCompare(localeLabels[b], "en")).map(option => <option key={option} value={option}>({ en: "🇬🇧", es: "🇪🇸", tr: "🇹🇷" }[option])} {localeLabels[option]}</option>)}
            </select>
            <Image src="/zaf-tech-logo.png" alt="ZAF TECH" width={38} height={38} className="h-9 w-9 object-contain" priority />
          </div>
          <div className="mt-6">
            <div className="text-[10px] tracking-wider text-muted-foreground">{tr("Pi App Directory", "Pi Uygulama Dizini")}</div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">{app.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">{app.category}</span>
              <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">{displayStatus(app.network)}</span>
              <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">{displayStatus(app.status)}</span>
            </div>
          </div>
        </header>

        <section className="mt-5 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold text-foreground">{tr("Application", "Uygulama")}</div>
            <p className="mt-2 break-all text-[11px] text-muted-foreground">{app.url}</p>
            <a href={app.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-foreground px-3 py-2 text-[11px] font-medium text-background">{tr("Open Application", "Uygulamayı Aç")}</a>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              [tr("Pi Authentication", "Pi Kimlik Doğrulama"), verification(app.piAuthentication)],
              [tr("Pi Payments", "Pi Ödemeleri"), verification(app.piPayments)],
              ["PiNet", verification(app.piNet)],
              [tr("Network", "Ağ"), displayStatus(app.network)],
              [tr("Status", "Durum"), displayStatus(app.status)],
              [tr("Last Checked", "Son Kontrol"), new Date(app.lastChecked).toLocaleString(locale === "es" ? "es-ES" : locale === "tr" ? "tr-TR" : "en-GB")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3">
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className="mt-1 text-xs font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold text-foreground">{tr("Verification Boundary", "Doğrulama Sınırı")}</div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              {tr("ZAF TECH does not claim Pi Authentication, Pi Payments, PiNet, Mainnet/Testnet status or application health until the relevant property has been independently verified by an observable check. Category is a ZAF TECH classification based on the public name/URL signal and is not an official Pi category.", "ZAF TECH, ilgili özellik gözlemlenebilir bir kontrolle bağımsız olarak doğrulanmadıkça Pi Kimlik Doğrulama, Pi Ödemeleri, PiNet, Mainnet/Testnet durumu veya uygulama sağlığı hakkında doğrulanmış bir iddiada bulunmaz. Kategori, herkese açık ad/URL sinyaline dayalı bir ZAF TECH sınıflandırmasıdır ve resmi Pi kategorisi değildir.")}
            </p>
          </div>
        </section>

        <footer className="mt-8 border-t border-border pt-4 text-[10px] text-muted-foreground">
          ZAF TECH · {tr("Independent Community-Developed Technology Project", "Bağımsız Topluluk Geliştirmeli Teknoloji Projesi")}
        </footer>
      </div>
    </main>
  );
}
