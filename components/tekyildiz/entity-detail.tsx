"use client";

import {
  confidenceLabel,
  formatDate,
  timeAgo,
  type ActivityItem,
  type Entity,
} from "@/lib/tekyildiz/data";
import { CONFIDENCE_MAP, STATUS_MAP } from "@/lib/tekyildiz/data";
import { Card, ConfidenceBadge, Pill, StatusBadge } from "./ui";
import { Overlay } from "./feedback";
import { ActivityCard } from "./activity-card";
import { IconClock, IconSource } from "./icons";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ty-nums max-w-[60%] truncate text-right text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function EntityDetail({
  entity,
  updates,
  open,
  onClose,
}: {
  entity: Entity | null;
  updates: ActivityItem[];
  open: boolean;
  onClose: () => void;
}) {
  if (!entity) return null;
  const kindLabel = entity.kind === "app" ? "App" : "Project";

  return (
    <Overlay open={open} onClose={onClose} title={entity.name}>
      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Header block */}
        <div className="ty-hero-grad rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill>{kindLabel}</Pill>
                <Pill>{entity.category}</Pill>
              </div>
              <h1 className="mt-2 text-xl font-bold text-foreground text-balance">{entity.name}</h1>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            {entity.description}
          </p>

          {/* Two distinct labelling dimensions, clearly separated */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-card/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Functional status
              </p>
              <div className="mt-2">
                <StatusBadge status={entity.status} />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {STATUS_MAP[entity.status].blurb}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data confidence
              </p>
              <div className="mt-2">
                <ConfidenceBadge confidence={entity.confidence} />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {CONFIDENCE_MAP[entity.confidence].blurb}
              </p>
            </div>
          </div>
        </div>

        {/* Tracked details */}
        <Card className="mt-4 px-4 py-1">
          <div className="divide-y divide-border">
            <InfoRow label="Type" value={kindLabel} />
            <InfoRow label="Category" value={entity.category} />
            <InfoRow label="Functional status" value={STATUS_MAP[entity.status].label} />
            <InfoRow label="Data confidence" value={confidenceLabel(entity.confidence)} />
            <InfoRow label="Source" value={entity.source} />
            <InfoRow
              label="Last updated"
              value={entity.updatedAt ? `${formatDate(entity.updatedAt)} · ${timeAgo(entity.updatedAt)}` : "Unavailable"}
            />
          </div>
        </Card>

        {/* Provenance note */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <IconSource width={14} height={14} className="mt-0.5 shrink-0" />
          <span>
            This information comes from the source shown above and may be incomplete or not
            real-time. It is never presented as official Pi Core Team data.
          </span>
        </div>

        {/* Known updates from the Activity feed */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <IconClock width={15} height={15} className="text-ty-silver" />
            <h3 className="text-sm font-semibold text-foreground">Known updates</h3>
          </div>
          {updates.length > 0 ? (
            <div className="flex flex-col gap-3">
              {updates.map((u) => (
                <ActivityCard key={u.id} item={u} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center text-xs text-muted-foreground">
              No tracked updates for this {kindLabel.toLowerCase()} yet.
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
}
