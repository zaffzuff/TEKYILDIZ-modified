"use client";

import {
  CONFIDENCE,
  STATUS,
  type ConfidenceId,
  type StatusId,
} from "@/lib/tekyildiz/data";
import { Chip } from "./ui";

/**
 * Two independent filter groups. Selecting a functional status never constrains
 * the confidence options, and vice-versa — they are rendered and handled as
 * fully separate controls.
 */
export function EntityFilterBar({
  status,
  onStatus,
  confidence,
  onConfidence,
}: {
  status: StatusId | "all";
  onStatus: (v: StatusId | "all") => void;
  confidence: ConfidenceId | "all";
  onConfidence: (v: ConfidenceId | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Functional status
        </p>
        <div className="ty-no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={status === "all"} onClick={() => onStatus("all")}>
            All
          </Chip>
          {STATUS.map((s) => (
            <Chip key={s.id} active={status === s.id} onClick={() => onStatus(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Data confidence
        </p>
        <div className="ty-no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={confidence === "all"} onClick={() => onConfidence("all")}>
            All
          </Chip>
          {CONFIDENCE.map((c) => (
            <Chip
              key={c.id}
              active={confidence === c.id}
              onClick={() => onConfidence(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
