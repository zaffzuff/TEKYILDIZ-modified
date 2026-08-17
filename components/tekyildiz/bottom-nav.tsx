"use client";

import type { ComponentType } from "react";
import { TABS, type TabId } from "@/lib/tekyildiz/data";
import { cx } from "./ui";
import {
  IconAbout,
  IconActivity,
  IconApps,
  IconOverview,
  IconProjects,
  IconTrends,
  type IconProps,
} from "./icons";

const TAB_ICON: Record<TabId, ComponentType<IconProps>> = {
  overview: IconOverview,
  activity: IconActivity,
  apps: IconApps,
  projects: IconProjects,
  trends: IconTrends,
  about: IconAbout,
};

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav className="ty-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {TABS.map((tab) => {
          const Icon = TAB_ICON[tab.id];
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cx(
                "ty-press relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-ty-gold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive ? (
                <span
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-ty-gold"
                  aria-hidden
                />
              ) : null}
              <Icon width={20} height={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
