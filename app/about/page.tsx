"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Locale = "en" | "tr";

const copy = {
  en: {
    back: "← Back to ZAF TECH",
    title: "About ZAF TECH",
    subtitle: "Pi Ecosystem Intelligence",
    what: "What it is",
    whatText: "ZAF TECH is an independent, read-only technology layer for discovering, checking and observing public Pi Network ecosystem data.",
    scope: "Current scope",
    scopeText: "The v0.1.0 scope includes the ecosystem dashboard, App Directory, App Details, App URL Checker, Mainnet Network view and Developer Tools, with English and Turkish interface support.",
    verification: "Verification principle",
    verificationText: "ZAF TECH separates observed facts from unverified claims. Pi-specific capabilities are not marked as verified unless an observable check supports them.",
    future: "Future direction",
    futureText: "Future phases may add Pi SDK integration, authentication, richer data collection, historical monitoring, APIs and AI analysis. These are not required for the initial release.",
  },
  tr: {
    back: "← ZAF TECH'e dön",
    title: "ZAF TECH Hakkında",
    subtitle: "Pi Ekosistem İstihbaratı",
    what: "Nedir?",
    whatText: "ZAF TECH, herkese açık Pi Network ekosistem verilerini keşfetmek, kontrol etmek ve gözlemlemek için geliştirilmiş bağımsız, salt-okunur bir teknoloji katmanıdır.",
    scope: "Mevcut kapsam",
    scopeText: "v0.1.0 kapsamı; ekosistem panosu, App Directory, App Details, App URL Checker, Mainnet Network görünümü ve Developer Tools bölümlerini İngilizce ve Türkçe arayüz desteğiyle içerir.",
    verification: "Doğrulama ilkesi",
    verificationText: "ZAF TECH, gözlemlenen gerçekleri doğrulanmamış iddialardan ayırır. Gözlemlenebilir bir kontrol desteklemedikçe Pi'ye özgü yetenekler doğrulanmış olarak işaretlenmez.",
    future: "Gelecek yönü",
    futureText: "Gelecek aşamalarda Pi SDK entegrasyonu, kimlik doğrulama, daha zengin veri toplama, geçmiş izleme, API'ler ve AI analizi eklenebilir. Bunlar ilk sürüm için gerekli değildir.",
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
                {item.toUpperCase()}
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
