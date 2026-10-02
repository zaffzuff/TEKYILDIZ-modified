  });
  const sentence = protectedValue.toLocaleLowerCase("es-ES").replace(/^./, char => char.toLocaleUpperCase("es-ES"));
  return sentence.replace(/@@(\d+)@@/g, (_, index) => tokens[Number(index)]);
}

export function intlLocale(locale: Locale): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "es") return "es-ES";
  if (locale === "zh") return "zh-CN";
  if (locale === "it") return "it-IT";
  if (locale === "fr") return "fr-FR";
  if (locale === "de") return "de-DE";
  if (locale === "pt") return "pt-PT";
  if (locale === "ru") return "ru-RU";
  return "en-US";
}

export function t(locale: Locale, key: string, trText?: string): string {
  if (locale === "tr") return trText ?? translations.tr[key] ?? key;
  if (locale === "es") return spanishCopy(translations.es[key] ?? key);
  if (locale === "zh") return translations.zh[key] ?? key;
  if (locale === "it") return translations.it[key] ?? key;
  if (locale === "fr") return translations.fr[key] ?? key;
  if (locale === "de") return translations.de[key] ?? key;
  if (locale === "pt") return translations.pt[key] ?? key;
  if (locale === "ru") return translations.ru[key] ?? key;
  return key;
}

export const translate = t;