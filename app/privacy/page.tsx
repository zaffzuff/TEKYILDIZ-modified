"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Locale = "en" | "tr";

const copy = {
  en: {
    back: "← Back To ZAF TECH", title: "Privacy", subtitle: "ZAF TECH Pi Ecosystem Observatory",
    scope: "Data Scope", scopeText: "ZAF TECH is an independent, read-only technology layer. It reads observable public Pi ecosystem, Network, Mainnet/Testnet and Node-related sources, and may run public URL checks requested by the user. The Wallet Intelligence feature only uses a public Pi wallet address for observable blockchain data.",
    wallet: "No Wallet Access", walletText: "The Developer Tools address inspector performs local format validation only. Wallet Intelligence does not access private keys, seed phrases or wallet credentials, does not connect to a user wallet, and does not sign blockchain transactions. Wallet lookups are based on publicly observable blockchain data.",
    local: "Local Preferences", localText: "Language and theme preferences may be stored locally in the browser. They are used to preserve the user's interface settings.",
    public: "Public Sources", publicText: "Network, ecosystem, Node and wallet observations are derived from public or explicitly observable sources. ZAF TECH distinguishes observed data from unverified claims and does not claim that its observations represent the entire Pi Network. Where a source does not directly expose a value, ZAF TECH does not infer it as fact; for example, private Pi lockup commitments are not presented as publicly verified locked balances.",
    boundary: "Important Boundary", boundaryText: "ZAF TECH is an independent community-developed project and is not an official Pi Core Team product.",
  },
  tr: {
    back: "← ZAF TECH'e Dön", title: "Gizlilik", subtitle: "ZAF TECH Pi Ekosistem Gözlem Merkezi",
    scope: "Veri Kapsamı", scopeText: "ZAF TECH bağımsız, salt-okunur bir teknoloji katmanıdır. Gözlemlenebilir herkese açık Pi ekosistemi, Network, Mainnet/Testnet ve Node kaynaklarını okur ve kullanıcı tarafından istenen herkese açık URL kontrollerini çalıştırabilir. Wallet Intelligence özelliği yalnızca herkese açık Pi cüzdan adresi üzerinden gözlemlenebilir blockchain verilerini kullanır.",
    wallet: "Cüzdan Erişimi Yok", walletText: "Developer Tools adres denetleyicisi yalnızca yerel format doğrulaması yapar. Wallet Intelligence özel anahtarlara, seed phrase'lere veya cüzdan kimlik bilgilerine erişmez; kullanıcı cüzdanına bağlanmaz ve blockchain işlemlerini imzalamaz. Cüzdan sorguları herkese açık olarak gözlemlenebilir blockchain verilerine dayanır.",
    local: "Yerel Tercihler", localText: "Dil ve tema tercihleri tarayıcıda yerel olarak saklanabilir. Bunlar kullanıcı arayüzü ayarlarını korumak için kullanılır.",
    public: "Herkese Açık Kaynaklar", publicText: "Network, ekosistem, Node ve cüzdan gözlemleri herkese açık veya açıkça gözlemlenebilir kaynaklardan elde edilir. ZAF TECH, gözlemlenen verileri doğrulanmamış iddialardan ayırır ve gözlemlerinin Pi Network'ün tamamını temsil ettiğini iddia etmez. Bir kaynak bir değeri doğrudan sunmuyorsa ZAF TECH bunu gerçekmiş gibi çıkarmaz; örneğin özel Pi lockup taahhütleri herkese açık olarak doğrulanmış kilitli bakiye şeklinde sunulmaz.",
    boundary: "Önemli Sınır", boundaryText: "ZAF TECH bağımsız, topluluk tarafından geliştirilen bir projedir ve resmi Pi Core Team ürünü değildir.",
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
                {locale === "en" ? "English" : "Türkçe"}
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
