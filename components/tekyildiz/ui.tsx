"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  confidenceLabel,
  statusLabel,
  type ConfidenceId,
  type StatusId,
} from "@/lib/tekyildiz/data";
import { IconInbox } from "./icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ---- Button ----------------------------------------------------------------

type ButtonVariant = "primary" | "outline" | "ghost" | "soft";

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-ty-gold text-primary-foreground hover:opacity-90 border border-transparent",
    outline: "bg-transparent text-foreground border border-border hover:bg-accent",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
    soft: "bg-secondary text-secondary-foreground hover:bg-accent border border-transparent",
  };
  return (
    <button
      className={cx(
        "ty-press inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  "aria-label": ariaLabel,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={ariaLabel}
      className={cx(
        "ty-press inline-flex items-center justify-center rounded-lg h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---- Card / section --------------------------------------------------------

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-base font-semibold text-foreground text-balance">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

// ---- Functional Status badge -----------------------------------------------
// Shape: solid rounded PILL. One color family. Never shares styling with
// confidence tags.

const STATUS_STYLE: Record<StatusId, { bg: string; fg: string; dot: string }> = {
  active: { bg: "bg-ty-active-soft", fg: "text-ty-active", dot: "bg-ty-active" },
  beta: { bg: "bg-ty-beta-soft", fg: "text-ty-beta", dot: "bg-ty-beta" },
  paused: { bg: "bg-ty-paused-soft", fg: "text-ty-paused", dot: "bg-ty-paused" },
  unknown: { bg: "bg-ty-unknown-soft", fg: "text-ty-unknown", dot: "bg-ty-unknown" },
};

export function StatusBadge({ status, className }: { status: StatusId; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        s.bg,
        s.fg,
        className,
      )}
    >
      {/* Unknown gets a hollow ring marker to distinguish it from Paused
          without using an alarm color. */}
      {status === "unknown" ? (
        <span className={cx("h-2 w-2 rounded-full border", "border-ty-unknown")} aria-hidden />
      ) : (
        <span className={cx("h-2 w-2 rounded-full", s.dot)} aria-hidden />
      )}
      {statusLabel(status)}
    </span>
  );
}

// ---- Data Confidence badge -------------------------------------------------
// Shape: BORDERED tag (rectangular, outlined). Distinct color family. Verified
// uses a small check-diamond marker; Unavailable uses a dashed outline.

const CONFIDENCE_STYLE: Record<
  ConfidenceId,
  { border: string; fg: string; extra?: string }
> = {
  verified: { border: "border-ty-verified/50", fg: "text-ty-verified", extra: "bg-ty-verified-soft/40" },
  demo: { border: "border-ty-demo/50", fg: "text-ty-demo", extra: "bg-ty-demo-soft/40" },
  estimated: { border: "border-ty-estimated/50", fg: "text-ty-estimated", extra: "bg-ty-estimated-soft/40" },
  unavailable: { border: "border-ty-unavailable/60 border-dashed", fg: "text-ty-unavailable", extra: "" },
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: ConfidenceId;
  className?: string;
}) {
  const c = CONFIDENCE_STYLE[confidence];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-1 text-[11px] font-medium leading-none uppercase tracking-wide",
        c.border,
        c.fg,
        c.extra,
        className,
      )}
    >
      {confidence === "verified" ? (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M6 1l1.6 1.2 2-.1.5 1.9L11.5 6l-1.4 1.5-.5 1.9-2-.1L6 11 4.4 9.2l-2 .1-.5-1.9L.5 6l1.4-1.5.5-1.9 2 .1z"
            fill="currentColor"
            opacity="0.25"
          />
          <path d="M4 6l1.5 1.5L8.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span
          className={cx(
            "h-1.5 w-1.5",
            confidence === "unavailable" ? "rounded-full border border-current" : "rounded-[1px] bg-current",
          )}
          aria-hidden
        />
      )}
      {confidenceLabel(confidence)}
    </span>
  );
}

// ---- Neutral pill (for categories, event types, etc.) ----------------------

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---- Filter chip -----------------------------------------------------------

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "ty-press whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-ty-gold/60 bg-ty-gold-soft text-ty-gold"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ---- Empty state -----------------------------------------------------------

export function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <IconInbox width={28} height={28} />}</div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground text-pretty">{message}</p>
    </div>
  );
}
