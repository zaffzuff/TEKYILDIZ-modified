"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";

type PioneerCard = {
  title: string;
  status: string;
  detail: string;
  sourceUrl: string;
  sourceLabel: string;
};

const SOURCES = {
  kyc: "https://minepi.com/blog/kyc-mainnet-migration-9-26/",
  migration: "https://minepi.com/blog/second-migrations/",
  browser: "https://minepi.com/pi-browser/",
  identity: "https://minepi.com/blog/pi2day2026/",
} as const;

const copy = {
  en: {
    KYC: {
      title: "KYC",
      status: "Active process",
      detail: "Pi's latest official update describes additional KYC processing improvements, including duplicate-account corner-case resolution, liveness-check changes, and resubmission paths for affected users.",
      sourceLabel: "Official KYC & Migration Update",
    },
    Migration: {
      title: "Migration",
      status: "Ongoing rollout",
      detail: "Mainnet migration continues through first and second migration processes. Pi's March 2026 update described second migrations as a gradual rollout and retained first migrations as the priority queue.",
      sourceLabel: "Official Second Migrations Update",
    },
    "Pi Browser": {
      title: "Pi Browser",
      status: "Ecosystem gateway",
      detail: "Pi describes Pi Browser as the gateway for Pi Web3 experiences and the place where users access Pi ecosystem applications and services.",
      sourceLabel: "Official Pi Browser",
    },
    "Pi Sign-in": {
      title: "Pi Sign-in",
      status: "Released",
      detail: "Pi Sign-in allows supported third-party websites and apps to offer Pi account sign-in or sign-up, with information sharing requiring user consent.",
      sourceLabel: "Official Pi2Day 2026",
    },
    PiVerify: {
      title: "PiVerify",
      status: "Released",
      detail: "PiVerify exposes Pi's real-human KYC and identity verification capabilities to supported third-party clients for identity and anti-duplicate workflows.",
      sourceLabel: "Official Pi2Day 2026",
    },
  },
  tr: {
    KYC: {
      title: "KYC",
      status: "Aktif süreç",
      detail: "Pi'nin son resmi güncellemesi; yinelenen hesap köşe durumları, canlılık kontrolü değişiklikleri ve etkilenen kullanıcılar için yeniden başvuru yolları dahil KYC süreç iyileştirmelerini açıklıyor.",
      sourceLabel: "Resmi KYC ve Migrasyon Güncellemesi",
    },
    Migration: {
      title: "Migrasyon",
      status: "Devam eden dağıtım",
      detail: "Mainnet migrasyonu birinci ve ikinci migrasyon süreçleri üzerinden devam ediyor. Pi'nin Mart 2026 güncellemesi ikinci migrasyonları kademeli dağıtım olarak tanımlarken birinci migrasyonları öncelikli kuyruk olarak belirtiyor.",
      sourceLabel: "Resmi Second Migrations Güncellemesi",
    },
    "Pi Browser": {
      title: "Pi Browser",
      status: "Ekosistem geçidi",
      detail: "Pi, Pi Browser'ı Pi Web3 deneyimleri için geçit ve Pi ekosistem uygulamalarına ve servislerine erişim noktası olarak tanımlıyor.",
      sourceLabel: "Resmi Pi Browser",
    },
    "Pi Sign-in": {
      title: "Pi Sign-in",
      status: "Yayınlandı",
      detail: "Pi Sign-in, desteklenen üçüncü taraf web siteleri ve uygulamalarında Pi hesabıyla giriş veya kayıt olmayı sağlar; paylaşılan bilgiler için kullanıcı onayı gerekir.",
      sourceLabel: "Resmi Pi2Day 2026",
    },
    PiVerify: {
      title: "PiVerify",
      status: "Yayınlandı",
      detail: "PiVerify, Pi'nin gerçek-insan KYC ve kimlik doğrulama yeteneklerini desteklenen üçüncü taraf istemcilere kimlik ve yinelenen hesap önleme iş akışları için sunar.",
      sourceLabel: "Resmi Pi2Day 2026",
    },
  },
} as const;

export function ZafPioneerData({ locale, subtab }: { locale: Locale; subtab: string }) {
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = window.setInterval(() => setLastRefresh(new Date().toISOString()), 300_000);
    return () => window.clearInterval(timer);
  }, []);

  const key = subtab in copy.en ? subtab as keyof typeof copy.en : "KYC";
  const item = copy[locale][key];
  const sourceUrl = key === "KYC" ? SOURCES.kyc : key === "Migration" ? SOURCES.migration : key === "Pi Browser" ? SOURCES.browser : SOURCES.identity;

  return (
    <section className="mt-4 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-foreground">{item.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {locale === "tr" ? "Resmi Pi kaynaklarından durum özeti" : "Status summary from official Pi sources"}
            </div>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-foreground">{item.status}</span>
        </div>

        <p className="mt-4 text-sm leading-6 text-foreground">{item.detail}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="rounded-full border border-border px-2.5 py-1">
            {locale === "tr" ? "Salt okunur" : "Read-only"}
          </span>
          <span>
            {locale === "tr" ? "Son yerel yenileme:" : "Last local refresh:"}{" "}
            {new Date(lastRefresh).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US")}
          </span>
        </div>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-foreground hover:bg-muted"
        >
          {item.sourceLabel} ↗
        </a>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-5 text-muted-foreground">
        {locale === "tr"
          ? "ZAF TECH özel KYC veya migrasyon hesabı, kişisel durum, başvuru kuyruğu ya da kullanıcı verisi okumaz. Buradaki içerik resmi Pi açıklamalarından türetilen ekosistem seviyesinde bağlamdır."
          : "ZAF TECH does not read private KYC or migration accounts, personal status, application queues, or user data. This module provides ecosystem-level context derived from official Pi publications."}
      </div>
    </section>
  );
}
