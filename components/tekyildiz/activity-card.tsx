"use client";

import {
  eventTypeLabel,
  formatDate,
  timeAgo,
  type ActivityItem,
  type EventType,
} from "@/lib/tekyildiz/data";
import { Card, ConfidenceBadge, Pill, StatusBadge } from "./ui";
import {
  IconActivity,
  IconBell,
  IconClock,
  IconMegaphone,
  IconSource,
  IconSwap,
  type IconProps,
} from "./icons";
import type { ComponentType } from "react";

const EVENT_ICON: Record<EventType, ComponentType<IconProps>> = {
  update: IconActivity,
  signal: IconBell,
  announcement: IconMegaphone,
  status_change: IconSwap,
};

export function ActivityCard({ item }: { item: ActivityItem }) {
  const Icon = EVENT_ICON[item.type];
  return (
    <Card className="ty-fade-up p-4">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-ty-silver">
          <Icon width={17} height={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug text-foreground text-pretty">
              {item.title}
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Pill>{eventTypeLabel(item.type)}</Pill>
            <Pill>{item.entityName}</Pill>
            {item.status ? <StatusBadge status={item.status} /> : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <div className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconSource width={13} height={13} className="shrink-0" />
                <span className="truncate">{item.source}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconClock width={13} height={13} className="shrink-0" />
                <span className="ty-nums">
                  {item.updatedAt ? `${formatDate(item.updatedAt)} · ${timeAgo(item.updatedAt)}` : "No timestamp"}
                </span>
              </span>
            </div>
            <ConfidenceBadge confidence={item.confidence} className="shrink-0" />
          </div>
        </div>
      </div>
    </Card>
  );
}
