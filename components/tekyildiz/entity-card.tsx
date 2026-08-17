"use client";

import { type Entity, formatDate } from "@/lib/tekyildiz/data";
import { Card, ConfidenceBadge, Pill, StatusBadge, cx } from "./ui";
import { IconChevronRight, IconClock, IconSource } from "./icons";

export function EntityCard({ entity, onOpen }: { entity: Entity; onOpen: () => void }) {
  return (
    <Card className="ty-fade-up overflow-hidden">
      <button
        onClick={onOpen}
        className="ty-press w-full text-left"
        aria-label={`Open ${entity.name}`}
      >
        <div className="p-4">
          {/* Title row: name + functional status pill (top-right, its own zone) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="ty-clamp-1 text-sm font-semibold text-foreground">{entity.name}</h3>
              <Pill className="mt-1.5">{entity.category}</Pill>
            </div>
            <StatusBadge status={entity.status} />
          </div>

          <p className="ty-clamp-2 mt-3 text-xs leading-relaxed text-muted-foreground">
            {entity.description}
          </p>

          {/* Footer: source + timestamp on the left, confidence tag in its own
              distinct position on the right. */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconSource width={13} height={13} className="shrink-0" />
                <span className="truncate">{entity.source}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconClock width={13} height={13} className="shrink-0" />
                <span className="ty-nums">
                  {entity.updatedAt ? formatDate(entity.updatedAt) : "No timestamp"}
                </span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <ConfidenceBadge confidence={entity.confidence} />
              <IconChevronRight
                width={16}
                height={16}
                className={cx("text-muted-foreground")}
              />
            </div>
          </div>
        </div>
      </button>
    </Card>
  );
}
