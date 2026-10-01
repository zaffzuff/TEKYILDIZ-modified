"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Locale = "en" | "tr";

const copy = {
  en: {
    back: "← Back To ZAF TECH",
    title: "About ZAF TECH",
    subtitle: "Pi Ecosystem Observatory",
    what: "What It Is",
    whatText: "ZAF TECH is an independent, read-only technology layer for discovering, checking and observing public Pi Network ecosystem data.",
    scope: "Current Scope",
    scopeText: "The current release includes the Pi Ecosystem Observatory, App Directory, App Details, App URL Checker, Network view, Developer Tools, Node & Compute observations and Wallet Intelligence, with English and Turkish interface support.",
    verification: "Verification Principle",
    verificationText: "ZAF TECH separates observed facts from unverified claims. Pi-specific capabilities are not marked as verified unless an observable check supports them.",
    future: "Future Direction",
    futureText: "The next planned phase extends ZAF TECH with Wallet Intelligence: public Pi wallet address lookup, Mainnet/Testnet selection, observable balances and claimable balances, account metadata, recent public transactions and operations, and explorer navigation. Private wallet access, signing and authentication are outside this scope.",
  },
  tr: {
    back: "← ZAF TECH'e Dön",
    title: "ZAF TECH Hakkında",
    subtitle: "Pi Ekosistem Gözlem Merkezi",
    what: "Nedir?",
    whatText: "ZAF TECH, herkese açık Pi Network ekosistem verilerini keşfetmek, kontrol etmek ve gözlemlemek için geliştirilmiş bağımsız, salt-okunur bir teknoloji katmanıdır.",
    scope: "Mevcut Kapsam",
    scopeText: "Mevcut sürüm; Pi Ekosistem Gözlem Merkezi, App Directory, App Details, App URL Checker, Network görünümü, Developer Tools, Node & Compute gözlemleri ve Wallet Intelligence bölümlerini İngilizce ve Türkçe arayüz desteğiyle içerir.",
    verification: "Doğrulama İlkesi",
    verificationText: "ZAF TECH, gözlemlenen gerçekleri doğrulanmamış iddialardan ayırır. Gözlemlenebilir bir kontrol desteklemedikçe Pi'ye özgü yetenekler doğrulanmış olarak işaretlenmez.",
    future: "Gelecek Yönü",
    futureText: "Sonraki planlanan aşama Wallet Intelligence kapsamını genişletir: herkese açık Pi cüzdan adresi sorgulama, Mainnet/Testnet seçimi, gözlemlenebilir bakiyeler ve claimable bakiyeler, hesap meta verileri, son herkese açık işlemler ve operasyonlar ile explorer bağlantıları. Özel cüzdan erişimi, imzalama ve kimlik doğrulama bu kapsamın dışındadır.",
  },
};

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("zaf-tech-locale-v1");
    if (saved === "tr" || saved === "en") setLocale(saved);
  }, []);

  const t = copy[locale];

  const changeLocale = (next: Locale) => {
    setLocale(next);
    window.localStorage.setItem("zaf-tech-locale-v1", next);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xs underline underline-offset-2">{t.back}</Link>
          <div className="flex gap-1 rounded-md border p-1 text-xs">
            {(["en", "tr"] as Locale[]).map((item) => (
              <button key={item} onClick={() => changeLocale(item)} className={`rounded px-2 py-1 ${locale === item ? "bg-foreground text-background" : ""}`}>
                {locale === "en" ? "English" : "Türkçe"}
              </button>
            ))}
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section><h2 className="font-semibold text-foreground">{t.what}</h2><p className="mt-2">{t.whatText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.scope}</h2><p className="mt-2">{t.scopeText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.verification}</h2><p className="mt-2">{t.verificationText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.future}</h2><p className="mt-2">{t.futureText}</p></section>
        </div>
      </article>
    </main>
  );
}
