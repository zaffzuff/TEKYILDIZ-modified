"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Locale = "en" | "tr";

const copy = {
  en: {
    back: "← Back to ZAF TECH", title: "Privacy", subtitle: "ZAF TECH Pi Intelligence v0.1.0",
    scope: "Data scope", scopeText: "ZAF TECH is designed as a read-only technology project. It reads public Pi ecosystem and Mainnet sources and may run public URL checks requested by the user.",
    wallet: "No wallet access", walletText: "The Developer Tools address inspector performs local format validation only. It does not access private keys, wallets, seed phrases or sign blockchain transactions.",
    local: "Local preferences", localText: "Language and theme preferences may be stored locally in the browser. They are used to preserve the user's interface settings.",
    public: "Public sources", publicText: "Network and ecosystem information is derived from public sources. ZAF TECH does not claim that its observations represent the entire Pi Network.",
    boundary: "Important boundary", boundaryText: "ZAF TECH is an independent community-developed project and is not an official Pi Core Team product.",
  },
  tr: {
    back: "← ZAF TECH'e dön", title: "Gizlilik", subtitle: "ZAF TECH Pi Intelligence v0.1.0",
    scope: "Veri kapsamı", scopeText: "ZAF TECH salt-okunur bir teknoloji projesi olarak tasarlanmıştır. Herkese açık Pi ekosistemi ve Mainnet kaynaklarını okur ve kullanıcı tarafından istenen herkese açık URL kontrollerini çalıştırabilir.",
    wallet: "Cüzdan erişimi yok", walletText: "Developer Tools adres denetleyicisi yalnızca yerel format doğrulaması yapar. Özel anahtarlara, cüzdanlara veya seed phrase'lere erişmez ve blockchain işlemlerini imzalamaz.",
    local: "Yerel tercihler", localText: "Dil ve tema tercihleri tarayıcıda yerel olarak saklanabilir. Bunlar kullanıcı arayüzü ayarlarını korumak için kullanılır.",
    public: "Herkese açık kaynaklar", publicText: "Ağ ve ekosistem bilgileri herkese açık kaynaklardan elde edilir. ZAF TECH, gözlemlerinin Pi Network'ün tamamını temsil ettiğini iddia etmez.",
    boundary: "Önemli sınır", boundaryText: "ZAF TECH bağımsız, topluluk tarafından geliştirilen bir projedir ve resmi Pi Core Team ürünü değildir.",
  },
};

export default function PrivacyPage() {
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
        <p className="mt-2 text-xs text-muted-foreground">{t.subtitle}</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section><h2 className="font-semibold text-foreground">{t.scope}</h2><p className="mt-2">{t.scopeText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.wallet}</h2><p className="mt-2">{t.walletText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.local}</h2><p className="mt-2">{t.localText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.public}</h2><p className="mt-2">{t.publicText}</p></section>
          <section><h2 className="font-semibold text-foreground">{t.boundary}</h2><p className="mt-2">{t.boundaryText}</p></section>
        </div>
      </article>
    </main>
  );
}
