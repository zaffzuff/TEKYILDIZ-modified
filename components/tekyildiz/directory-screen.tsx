"use client";

import { useMemo, useState } from "react";
import {
  SORTS,
  filterEntities,
  sortEntities,
  type ConfidenceId,
  type Dataset,
  type Entity,
  type SortId,
  type StatusId,
} from "@/lib/tekyildiz/data";
import { Card, Chip, EmptyState, cx } from "./ui";
import { EntityCard } from "./entity-card";
import { EntityFilterBar } from "./filter-bar";
import { EntityDetail } from "./entity-detail";
import { IconApps, IconProjects, IconSearch } from "./icons";

export function DirectoryScreen({
  kind,
  data,
  sort,
  onSort,
}: {
  kind: "app" | "project";
  data: Dataset;
  sort: SortId;
  onSort: (s: SortId) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusId | "all">("all");
  const [confidence, setConfidence] = useState<ConfidenceId | "all">("all");
  const [selected, setSelected] = useState<Entity | null>(null);

  const source = kind === "app" ? data.apps : data.projects;
  const isApp = kind === "app";

  const results = useMemo(
    () => sortEntities(filterEntities(source, status, confidence, query), sort),
    [source, status, confidence, query, sort],
  );

  const updatesFor = (entity: Entity) =>
    data.activity.filter((a) => a.entityId === entity.id);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6">
      <header className="pt-5">
        <div className="flex items-center gap-2">
          {isApp ? (
            <IconApps className="text-ty-gold" width={22} height={22} />
          ) : (
            <IconProjects className="text-ty-gold" width={22} height={22} />
          )}
          <h1 className="text-xl font-bold text-foreground">{isApp ? "Apps" : "Projects"}</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          {isApp
            ? "Browse tracked Pi ecosystem applications. Read-only."
            : "Browse tracked ecosystem projects — initiatives, research, tooling and infrastructure. Read-only."}
        </p>
      </header>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3">
        <IconSearch width={17} height={17} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isApp ? "Search apps" : "Search projects"}
          className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          enterKeyHint="search"
        />
      </div>

      {/* Independent filters */}
      <div className="mt-4">
        <EntityFilterBar
          status={status}
          onStatus={setStatus}
          confidence={confidence}
          onConfidence={setConfidence}
        />
      </div>

      {/* Sort + count */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground ty-nums">
          {results.length} {results.length === 1 ? "result" : "results"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
          </span>
          <div className="flex gap-1.5">
            {SORTS.map((s) => (
              <Chip key={s.id} active={sort === s.id} onClick={() => onSort(s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div className={cx("mt-4 grid gap-3", "sm:grid-cols-2")}>
          {results.map((e) => (
            <EntityCard key={e.id} entity={e} onOpen={() => setSelected(e)} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Nothing matches those filters"
            message="Try clearing the status or confidence filter, or adjusting your search."
            icon={isApp ? <IconApps width={28} height={28} /> : <IconProjects width={28} height={28} />}
          />
        </div>
      )}

      <Card className="mt-5 p-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
          Displayed information comes from tracked sources and may be incomplete or not real-time.
          Items marked <span className="font-medium text-foreground">Demo</span> or{" "}
          <span className="font-medium text-foreground">Estimated</span> are not presented as fact.
        </p>
      </Card>

      <EntityDetail
        entity={selected}
        updates={selected ? updatesFor(selected) : []}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
