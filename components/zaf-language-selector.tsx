"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/zaf/i18n";
import { localeLabels } from "@/lib/zaf/i18n";

const locales: Locale[] = ["en", "es", "tr"];

function FlagIcon({ locale }: { locale: Locale }) {
  if (locale === "tr") {
    return (
      <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden="true">
        <rect width="20" height="14" fill="#e30a17" />
        <circle cx="8.2" cy="7" r="3.2" fill="#fff" />
        <circle cx="9.1" cy="7" r="2.55" fill="#e30a17" />
        <path d="M12.1 7l2.1-1.4-.8 2.45 2.05 1.45-2.55-.05-.8 2.4-.75-2.4-2.55.05 2.05-1.45-.8-2.45z" fill="#fff" />
      </svg>
    );
  }

  if (locale === "es") {
    return (
      <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden="true">
        <rect width="20" height="14" fill="#aa151b" />
        <rect y="3.5" width="20" height="7" fill="#f1bf00" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden="true">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="3" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="5" />
      <path d="M10 0v14M0 7h20" stroke="#c8102e" strokeWidth="2.8" />
    </svg>
  );
}

export function LanguageSelector({
  locale,
  onChange,
  className = "",
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const ordered = [...locales].sort((a, b) => localeLabels[a].localeCompare(localeLabels[b], "en"));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground"
      >
        <FlagIcon locale={locale} />
        <span>{localeLabels[locale]}</span>
        <span className="ml-0.5 text-[10px]">⌄</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {ordered.map(option => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={locale === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs ${locale === option ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted"}`}
            >
              <FlagIcon locale={option} />
              <span>{localeLabels[option]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
