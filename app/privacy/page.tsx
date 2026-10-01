"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Locale = "en" | "es" | "tr";

const copy = {
  en: {
    back: "← Back To ZAF TECH", title: "Privacy", subtitle: "ZAF TECH Pi Ecosystem Observatory",
    scope: "Data Scope", scopeText: "ZAF TECH is an independent, read-only technology layer. It reads observable public Pi ecosystem, Network, Mainnet/Testnet and Node-related sources, and may run public URL checks requested by the user. The Wallet Intelligence feature only uses a public Pi wallet address for observable blockchain data.",
    wallet: "No Wallet Access", walletText: "The Developer Tools address inspector performs local format validation only. Wallet Intelligence does not access private keys, seed phrases or wallet credentials, does not connect to a user wallet, and does not sign blockchain transactions. Wallet lookups are based on publicly observable blockchain data.",
    local: "Local Preferences", localText: "Language and theme preferences may be stored locally in the browser. They are used to preserve the user's interface settings.",
    public: "Public Sources", publicText: "Network, ecosystem, Node and wallet observations are derived from public or explicitly observable sources. ZAF TECH distinguishes observed data from unverified claims and does not claim that its observations represent the entire Pi Network. Where a source does not directly expose a value, ZAF TECH does not infer it as fact; for example, private Pi lockup commitments are not presented as publicly verified locked balances.",
    boundary: "Important Boundary", boundaryText: "ZAF TECH is an independent community-developed project and is not an official Pi Core Team product.",
  },
  es: {
    back: "← Volver A ZAF TECH", title: "Privacidad", subtitle: "Observatorio Del Ecosistema Pi De ZAF TECH",
    scope: "Alcance De Datos", scopeText: "ZAF TECH es una capa tecnológica independiente y de solo lectura. Lee fuentes públicas y observables del ecosistema Pi, la Red, Mainnet/Testnet y Node, y puede ejecutar comprobaciones de URL públicas solicitadas por el usuario. La función de observación de billetera solo utiliza una dirección pública de billetera Pi para obtener datos observables de blockchain.",
    wallet: "Sin Acceso A La Billetera", walletText: "El inspector de direcciones de Developer Tools solo realiza validación local del formato. El Observatorio De Billetera no accede a claves privadas, frases semilla ni credenciales de billetera, no conecta una billetera de usuario y no firma transacciones blockchain. Las consultas de billetera se basan en datos de blockchain públicamente observables.",
    local: "Preferencias Locales", localText: "Las preferencias de idioma y tema pueden almacenarse localmente en el navegador. Se utilizan para conservar la configuración de la interfaz del usuario.",
    public: "Fuentes Públicas", publicText: "Las observaciones de Red, ecosistema, Node y billetera se derivan de fuentes públicas o explícitamente observables. ZAF TECH distingue los datos observados de las afirmaciones no verificadas y no afirma que sus observaciones representen toda la red Pi. Cuando una fuente no expone directamente un valor, ZAF TECH no lo presenta como un hecho; por ejemplo, los compromisos privados de lockup de Pi no se muestran como saldos bloqueados verificados públicamente.",
    boundary: "Límite Importante", boundaryText: "ZAF TECH es un proyecto independiente desarrollado por la comunidad y no es un producto oficial de Pi Core Team.",
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



  const t = copy[locale];
  const changeLocale = (next: Locale) => {
    setLocale(next);
    
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xs underline underline-offset-2">{t.back}</Link>
          <select value={locale} onChange={(e) => changeLocale(e.target.value as Locale)} aria-label="Language" className="rounded-md border bg-background px-2 py-1 text-xs">
            {(["en", "es", "tr"] as Locale[]).sort((a, b) => ({ en: "English", es: "Español", tr: "Türkçe" }[a]).localeCompare(({ en: "English", es: "Español", tr: "Türkçe" }[b]), "en")).map((item) => (
              <option key={item} value={item}>{({ en: "🇬🇧", es: "🇪🇸", tr: "🇹🇷" }[item])} {({ en: "English", es: "Español", tr: "Türkçe" }[item])}</option>
            ))}
          </select>
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
