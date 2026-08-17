import type { ImgHTMLAttributes, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconOverview(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconActivity(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 12h4l2.5 7 5-16 2.5 9H21" />
    </svg>
  );
}

export function IconApps(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function IconProjects(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

export function IconTrends(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect x="7" y="11" width="3" height="5" rx="0.6" />
      <rect x="12" y="8" width="3" height="8" rx="0.6" />
      <rect x="17" y="13" width="3" height="3" rx="0.6" />
    </svg>
  );
}

export function IconAbout(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function IconStar(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.2l2.4 5.3 5.8.6-4.3 3.9 1.2 5.7L12 16.9 6.9 18.7l1.2-5.7L3.8 9.1l5.8-.6z" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconEye(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconBack(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconSource(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h10" />
    </svg>
  );
}

export function IconInbox(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 13l3-8h12l3 8" />
      <path d="M3 13h5l1.5 3h5L16 13h5v6H3z" />
    </svg>
  );
}

export function IconSpinner(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function IconTag(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 12.5 12 4h6.5V10.5L10 19z" />
      <circle cx="15" cy="8" r="1.2" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a2 2 0 0 0 3 0" />
    </svg>
  );
}

export function IconMegaphone(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 10v4h3l7 4V6l-7 4z" />
      <path d="M17 9a3 3 0 0 1 0 6" />
    </svg>
  );
}

export function IconSwap(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M7 4 4 7l3 3" />
      <path d="M4 7h13" />
      <path d="m17 20 3-3-3-3" />
      <path d="M20 17H7" />
    </svg>
  );
}

export function IconInfo(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// TEKYILDIZ brand mark. The text wordmark is rendered separately by the screens.
export function Logo({
  width = 28,
  height = 28,
  alt = "TEKYILDIZ",
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/tekyildiz-mark.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  );
}
