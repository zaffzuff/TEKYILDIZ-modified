"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageSelector } from "@/components/zaf-language-selector";

type Locale = "en" | "es" | "tr";

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
  es: {
    back: "← Volver A ZAF TECH", title: "Acerca De ZAF TECH", subtitle: "Observatorio Del Ecosistema Pi",
    what: "Qué Es", whatText: "ZAF TECH es una capa tecnológica independiente y de solo lectura para descubrir, comprobar y observar datos públicos del ecosistema Pi Network.",
    scope: "Alcance Actual", scopeText: "La versión actual incluye el Observatorio Del Ecosistema Pi, el Directorio De Aplicaciones, los Detalles De Aplicaciones, el Comprobador De URL, la vista de Red, las Herramientas Para Desarrolladores, las observaciones de Node Y Cómputo y el Observatorio De Billetera, con soporte de interfaz en inglés, español y turco.",
    verification: "Principio De Verificación", verificationText: "ZAF TECH separa los hechos observados de las afirmaciones no verificadas. Las capacidades específicas de Pi no se marcan como verificadas a menos que una comprobación observable las respalde.",
    future: "Dirección Futura", futureText: "La siguiente fase planificada amplía ZAF TECH con observaciones de billeteras Pi públicas, selección de Mainnet/Testnet, saldos observables y reclamables, metadatos de cuenta, transacciones y operaciones públicas recientes y navegación al explorador. El acceso privado a la billetera, la firma y la autenticación están fuera de este alcance.",
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



  const t = copy[locale];

  const changeLocale = (next: Locale) => {
    setLocale(next);
    
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xs underline underline-offset-2">{t.back}</Link>
          <LanguageSelector locale={locale} onChange={changeLocale} />
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
