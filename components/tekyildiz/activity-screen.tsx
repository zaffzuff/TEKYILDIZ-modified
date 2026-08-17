"use client";

import { useMemo, useState } from "react";
import {
  EVENT_TYPES,
  type ConfidenceId,
  type Dataset,
  type EventType,
  type StatusId,
} from "@/lib/tekyildiz/data";
import { ActivityCard } from "./activity-card";
import { EntityFilterBar } from "./filter-bar";
import { Card, Chip, EmptyState } from "./ui";
import { IconActivity } from "./icons";

export function ActivityScreen({ data }: { data: Dataset }) {
  const [eventType, setEventType] = useState<EventType | "all">("all");
  const [status, setStatus] = useState<StatusId | "all">("all");
  const [confidence, setConfidence] = useState<ConfidenceId | "all">("all");

  const items = useMemo(() => {
    return data.activity.filter((a) => {
      if (eventType !== "all" && a.type !== eventType) return false;
      if (confidence !== "all" && a.confidence !== confidence) return false;
      // status filter only affects items that carry a status; an item without a
      // status is excluded when a specific status is selected.
      if (status !== "all" && a.status !== status) return false;
      return true;
    });
  }, [data.activity, eventType, status, confidence]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6">
      <header className="pt-5">
        <div className="flex items-center gap-2">
          <IconActivity className="text-ty-gold" width={22} height={22} />
          <h1 className="text-xl font-bold text-foreground">Activity</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          A chronological feed of tracked ecosystem events. Read-only.
        </p>
      </header>

      {/* Event type filter */}
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Event type
        </p>
        <div className="ty-no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={eventType === "all"} onClick={() => setEventType("all")}>
            All
          </Chip>
          {EVENT_TYPES.map((e) => (
            <Chip key={e.id} active={eventType === e.id} onClick={() => setEventType(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Independent status + confidence filters */}
      <div className="mt-4">
        <EntityFilterBar
          status={status}
          onStatus={setStatus}
          confidence={confidence}
          onConfidence={setConfidence}
        />
      </div>

      <div className="mt-4">
        <span className="text-xs text-muted-foreground ty-nums">
          {items.length} {items.length === 1 ? "event" : "events"}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No matching events"
            message="Try clearing the event type, status, or confidence filter."
            icon={<IconActivity width={28} height={28} />}
          />
        </div>
      )}

      <Card className="mt-5 p-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
          Network signals appear only when a documented source reports them. Gaps are shown as{" "}
          <span className="font-medium text-foreground">Unavailable</span>, never inferred or
          estimated into a number.
        </p>
      </Card>
    </div>
  );
}
