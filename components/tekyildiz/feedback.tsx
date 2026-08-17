"use client";

import { useEffect, type ReactNode } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/tekyildiz/data";
import { cx } from "./ui";
import { IconClose, IconSpinner, Logo } from "./icons";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="ty-fade-in flex flex-col items-center">
        <Logo width={56} height={56} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight ty-brand-text">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        <IconSpinner className="ty-spin mt-6 text-ty-gold" width={22} height={22} />
      </div>
    </div>
  );
}

export function StorageNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-2 ty-safe-top">
      <div className="ty-fade-up rounded-lg border border-ty-beta/40 bg-ty-beta-soft px-3 py-2 text-xs font-medium text-ty-beta shadow-lg">
        Saving again — your preferences are safe.
      </div>
    </div>
  );
}

export function Overlay({
  open,
  onClose,
  title,
  children,
  headerRight,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background ty-fade-in">
      <header className="ty-safe-top sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={onClose}
          aria-label="Close"
          className="ty-press -ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconClose width={20} height={20} />
        </button>
        <h2 className={cx("flex-1 truncate text-base font-semibold text-foreground")}>{title}</h2>
        {headerRight}
      </header>
      <div className="ty-safe-bottom flex-1 overflow-y-auto ty-no-scrollbar">{children}</div>
    </div>
  );
}
