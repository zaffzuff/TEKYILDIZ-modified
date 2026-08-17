// TEKYILDIZ data layer.
//
// This module is the single source of truth for the app's content and is
// deliberately built behind a clean, typed interface so a trusted external API
// can be plugged in later without touching the UI. Everything the UI renders
// flows through `getDataset()`.
//
// IMPORTANT (per product requirements):
// - The two labelling dimensions — Data Confidence and Functional Status — are
//   modelled as fully independent fields. Their vocabularies never overlap.
// - No data here is presented as official, real-time, or fact. The bundled
//   content is sample/interface data and is labelled with the "demo" confidence
//   (or "estimated"/"unavailable" where appropriate), never invented as fact.

export const APP_NAME = "TEKYILDIZ";
export const APP_TAGLINE = "Pi ecosystem activity tracker";

// ---- Persisted settings (the only per-user data) -------------------------

export const KEY_SETTINGS = "tekyildiz.settings";

// ---- Sections -------------------------------------------------------------

export type TabId = "overview" | "activity" | "apps" | "projects" | "trends" | "about";

export interface TabDef {
  id: TabId;
  label: string;
}

export const TABS: TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "apps", label: "Apps" },
  { id: "projects", label: "Projects" },
  { id: "trends", label: "Trends" },
  { id: "about", label: "About" },
];

// ---- Data Confidence (certainty about the information) --------------------

export type ConfidenceId = "verified" | "demo" | "estimated" | "unavailable";

export interface ConfidenceDef {
  id: ConfidenceId;
  label: string;
  blurb: string;
}

export const CONFIDENCE: ConfidenceDef[] = [
  { id: "verified", label: "Verified", blurb: "Confirmed from a trusted, documented source." },
  { id: "demo", label: "Demo", blurb: "Placeholder or sample data shown to demonstrate the interface." },
  { id: "estimated", label: "Estimated", blurb: "Derived or partial information, clearly marked as such." },
  { id: "unavailable", label: "Unavailable", blurb: "A known gap. Shown as a neutral placeholder, never as fact." },
];

export const CONFIDENCE_MAP: Record<ConfidenceId, ConfidenceDef> = CONFIDENCE.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<ConfidenceId, ConfidenceDef>,
);

export const CONFIDENCE_ID_SET = new Set<ConfidenceId>(CONFIDENCE.map((c) => c.id));

export function isConfidenceId(v: unknown): v is ConfidenceId {
  return typeof v === "string" && CONFIDENCE_ID_SET.has(v as ConfidenceId);
}

export function confidenceLabel(id: ConfidenceId): string {
  return CONFIDENCE_MAP[id]?.label ?? "Unavailable";
}

// ---- Functional Status (state of the app/project itself) ------------------

export type StatusId = "active" | "beta" | "paused" | "unknown";

export interface StatusDef {
  id: StatusId;
  label: string;
  blurb: string;
}

export const STATUS: StatusDef[] = [
  { id: "active", label: "Active", blurb: "Currently maintained and available." },
  { id: "beta", label: "Beta", blurb: "Available for testing; still evolving." },
  { id: "paused", label: "Paused", blurb: "Development or availability is on hold." },
  { id: "unknown", label: "Unknown", blurb: "State not confirmed from a tracked source." },
];

export const STATUS_MAP: Record<StatusId, StatusDef> = STATUS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<StatusId, StatusDef>,
);

export const STATUS_ID_SET = new Set<StatusId>(STATUS.map((s) => s.id));

export function isStatusId(v: unknown): v is StatusId {
  return typeof v === "string" && STATUS_ID_SET.has(v as StatusId);
}

export function statusLabel(id: StatusId): string {
  return STATUS_MAP[id]?.label ?? "Unknown";
}

// ---- Entities (Apps + Projects share one shape) ---------------------------

export type EntityKind = "app" | "project";

export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  category: string;
  description: string;
  status: StatusId;
  confidence: ConfidenceId;
  source: string;
  updatedAt: number; // epoch ms, or 0 when unavailable
}

// ---- Activity feed --------------------------------------------------------

export type EventType = "update" | "signal" | "announcement" | "status_change";

export interface EventTypeDef {
  id: EventType;
  label: string;
}

export const EVENT_TYPES: EventTypeDef[] = [
  { id: "update", label: "Update" },
  { id: "signal", label: "Signal" },
  { id: "announcement", label: "Announcement" },
  { id: "status_change", label: "Status change" },
];

export const EVENT_TYPE_MAP: Record<EventType, EventTypeDef> = EVENT_TYPES.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<EventType, EventTypeDef>,
);

export function eventTypeLabel(id: EventType): string {
  return EVENT_TYPE_MAP[id]?.label ?? "Update";
}

export interface ActivityItem {
  id: string;
  type: EventType;
  title: string;
  detail: string;
  entityId: string | null;
  entityName: string;
  source: string;
  confidence: ConfidenceId;
  status: StatusId | null; // only when relevant (e.g. status_change)
  updatedAt: number;
}

// ---- Trends ---------------------------------------------------------------

export type TrendPeriod = "weekly" | "monthly";

export interface TrendPoint {
  label: string; // e.g. "W1", "Jan"
  updates: number;
  newApps: number;
  signals: number;
}

export interface TrendSeries {
  period: TrendPeriod;
  confidence: ConfidenceId;
  note: string;
  points: TrendPoint[];
}

// ---- Sorting --------------------------------------------------------------

export type SortId = "name" | "updated";

export interface SortDef {
  id: SortId;
  label: string;
}

export const SORTS: SortDef[] = [
  { id: "updated", label: "Last updated" },
  { id: "name", label: "Name" },
];

export const SORT_ID_SET = new Set<SortId>(SORTS.map((s) => s.id));

export function isSortId(v: unknown): v is SortId {
  return typeof v === "string" && SORT_ID_SET.has(v as SortId);
}

// ---- Time helpers ---------------------------------------------------------

const DAY = 86_400_000;

/** Build a stable epoch offset from "now" so timestamps look plausible without
 *  ever claiming to be live. Computed once at module load. */
const NOW = Date.now();

function daysAgo(d: number): number {
  return NOW - d * DAY;
}

export function formatDate(ts: number): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function timeAgo(ts: number): string {
  if (!ts) return "Unavailable";
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ---- Bundled sample dataset ----------------------------------------------
//
// All entries carry honest confidence labels. Because none of this is drawn
// from a live/official source yet, the default confidence is "demo" — with a
// few "estimated" and "unavailable" entries to exercise those states.

const APPS: Entity[] = [
  {
    id: "app-brainstorm",
    kind: "app",
    name: "Brainstorm Hub",
    category: "Productivity",
    description: "A directory-style workspace for organising community ideas and proposals.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(2),
  },
  {
    id: "app-fireside",
    kind: "app",
    name: "Fireside Forum",
    category: "Community",
    description: "Threaded discussion space focused on ecosystem topics and announcements.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(4),
  },
  {
    id: "app-atlas",
    kind: "app",
    name: "Atlas Explorer",
    category: "Utilities",
    description: "Reference tool for browsing public ecosystem listings and metadata.",
    status: "beta",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(1),
  },
  {
    id: "app-ledgerlens",
    kind: "app",
    name: "LedgerLens",
    category: "Analytics",
    description: "Read-only viewer for publicly documented activity summaries.",
    status: "beta",
    confidence: "estimated",
    source: "Partial index",
    updatedAt: daysAgo(6),
  },
  {
    id: "app-marketplace",
    kind: "app",
    name: "Corner Market",
    category: "Commerce",
    description: "Neutral catalogue interface for browsing listed goods and services.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(9),
  },
  {
    id: "app-quill",
    kind: "app",
    name: "Quill Notes",
    category: "Productivity",
    description: "Lightweight note interface intended for personal, on-device drafts.",
    status: "paused",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(21),
  },
  {
    id: "app-beacon",
    kind: "app",
    name: "Beacon Directory",
    category: "Community",
    description: "Listing surface for community groups and regional meet-ups.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(3),
  },
  {
    id: "app-orbit",
    kind: "app",
    name: "Orbit Planner",
    category: "Utilities",
    description: "Scheduling helper for events across the ecosystem calendar.",
    status: "beta",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(11),
  },
  {
    id: "app-relay",
    kind: "app",
    name: "Relay Reader",
    category: "Media",
    description: "Aggregated reading list of publicly available ecosystem posts.",
    status: "unknown",
    confidence: "unavailable",
    source: "No source reporting",
    updatedAt: 0,
  },
  {
    id: "app-tally",
    kind: "app",
    name: "Tally Board",
    category: "Analytics",
    description: "Simple counters and summaries derived from tracked public listings.",
    status: "active",
    confidence: "estimated",
    source: "Partial index",
    updatedAt: daysAgo(7),
  },
];

const PROJECTS: Entity[] = [
  {
    id: "proj-opendocs",
    kind: "project",
    name: "Open Docs Initiative",
    category: "Documentation",
    description: "Community effort to organise and index publicly available guides.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(2),
  },
  {
    id: "proj-toolkit",
    kind: "project",
    name: "Builder Toolkit",
    category: "Tooling",
    description: "Collection of open interface components maintained by contributors.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(5),
  },
  {
    id: "proj-research",
    kind: "project",
    name: "Ecosystem Research Notes",
    category: "Research",
    description: "Ongoing write-ups summarising observed ecosystem activity patterns.",
    status: "beta",
    confidence: "estimated",
    source: "Partial index",
    updatedAt: daysAgo(8),
  },
  {
    id: "proj-localization",
    kind: "project",
    name: "Localization Circle",
    category: "Community",
    description: "Volunteer translation of public community resources into more languages.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(4),
  },
  {
    id: "proj-infra",
    kind: "project",
    name: "Mirror Infrastructure",
    category: "Infrastructure",
    description: "Community-run mirrors of publicly documented reference material.",
    status: "paused",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(19),
  },
  {
    id: "proj-signals",
    kind: "project",
    name: "Signal Watch",
    category: "Monitoring",
    description: "Effort to catalogue only documented, measurable ecosystem signals.",
    status: "beta",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(6),
  },
  {
    id: "proj-education",
    kind: "project",
    name: "Learn Together",
    category: "Education",
    description: "Curated set of neutral learning resources for newcomers.",
    status: "active",
    confidence: "demo",
    source: "Sample dataset",
    updatedAt: daysAgo(12),
  },
  {
    id: "proj-archive",
    kind: "project",
    name: "Community Archive",
    category: "Documentation",
    description: "Preservation of public announcements and their timestamps.",
    status: "unknown",
    confidence: "unavailable",
    source: "No source reporting",
    updatedAt: 0,
  },
];

const ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    type: "update",
    title: "Atlas Explorer refreshed its listing view",
    detail: "A new browsing layout was noted in the sample dataset.",
    entityId: "app-atlas",
    entityName: "Atlas Explorer",
    source: "Sample dataset",
    confidence: "demo",
    status: "beta",
    updatedAt: daysAgo(1),
  },
  {
    id: "act-2",
    type: "signal",
    title: "Documented activity summary observed",
    detail: "A partial, documented summary was recorded. Coverage is incomplete.",
    entityId: "app-ledgerlens",
    entityName: "LedgerLens",
    source: "Partial index",
    confidence: "estimated",
    status: null,
    updatedAt: daysAgo(1),
  },
  {
    id: "act-3",
    type: "announcement",
    title: "Open Docs Initiative shared a progress note",
    detail: "Contributors posted a public update about indexing progress.",
    entityId: "proj-opendocs",
    entityName: "Open Docs Initiative",
    source: "Sample dataset",
    confidence: "demo",
    status: "active",
    updatedAt: daysAgo(2),
  },
  {
    id: "act-4",
    type: "status_change",
    title: "Quill Notes moved to Paused",
    detail: "The tracked status changed from Active to Paused.",
    entityId: "app-quill",
    entityName: "Quill Notes",
    source: "Sample dataset",
    confidence: "demo",
    status: "paused",
    updatedAt: daysAgo(3),
  },
  {
    id: "act-5",
    type: "update",
    title: "Beacon Directory added new regional groups",
    detail: "Additional community listings appeared in the sample dataset.",
    entityId: "app-beacon",
    entityName: "Beacon Directory",
    source: "Sample dataset",
    confidence: "demo",
    status: "active",
    updatedAt: daysAgo(3),
  },
  {
    id: "act-6",
    type: "update",
    title: "Builder Toolkit component set updated",
    detail: "New interface components were noted by contributors.",
    entityId: "proj-toolkit",
    entityName: "Builder Toolkit",
    source: "Sample dataset",
    confidence: "demo",
    status: "active",
    updatedAt: daysAgo(5),
  },
  {
    id: "act-7",
    type: "signal",
    title: "Signal Watch recorded a documented data point",
    detail: "Only measurable, documented information was catalogued.",
    entityId: "proj-signals",
    entityName: "Signal Watch",
    source: "Sample dataset",
    confidence: "demo",
    status: "beta",
    updatedAt: daysAgo(6),
  },
  {
    id: "act-8",
    type: "announcement",
    title: "Research Notes published a new summary",
    detail: "A partial summary of observed patterns was shared.",
    entityId: "proj-research",
    entityName: "Ecosystem Research Notes",
    source: "Partial index",
    confidence: "estimated",
    status: "beta",
    updatedAt: daysAgo(8),
  },
  {
    id: "act-9",
    type: "signal",
    title: "Network measurement unavailable for this period",
    detail: "No documented source reported a value. Shown as a neutral gap.",
    entityId: null,
    entityName: "Network signals",
    source: "No source reporting",
    confidence: "unavailable",
    status: null,
    updatedAt: 0,
  },
  {
    id: "act-10",
    type: "update",
    title: "Corner Market catalogue reorganised",
    detail: "Category grouping changed in the sample dataset.",
    entityId: "app-marketplace",
    entityName: "Corner Market",
    source: "Sample dataset",
    confidence: "demo",
    status: "active",
    updatedAt: daysAgo(9),
  },
  {
    id: "act-11",
    type: "status_change",
    title: "Mirror Infrastructure marked Paused",
    detail: "The tracked status changed to Paused pending contributor availability.",
    entityId: "proj-infra",
    entityName: "Mirror Infrastructure",
    source: "Sample dataset",
    confidence: "demo",
    status: "paused",
    updatedAt: daysAgo(19),
  },
  {
    id: "act-12",
    type: "update",
    title: "Learn Together added starter resources",
    detail: "A new set of neutral learning links was noted.",
    entityId: "proj-education",
    entityName: "Learn Together",
    source: "Sample dataset",
    confidence: "demo",
    status: "active",
    updatedAt: daysAgo(12),
  },
];

const TRENDS: TrendSeries[] = [
  {
    period: "weekly",
    confidence: "demo",
    note: "Sample activity counts shown to demonstrate the interface.",
    points: [
      { label: "W1", updates: 6, newApps: 1, signals: 2 },
      { label: "W2", updates: 9, newApps: 2, signals: 3 },
      { label: "W3", updates: 5, newApps: 0, signals: 1 },
      { label: "W4", updates: 11, newApps: 1, signals: 4 },
      { label: "W5", updates: 8, newApps: 2, signals: 2 },
      { label: "W6", updates: 13, newApps: 3, signals: 5 },
    ],
  },
  {
    period: "monthly",
    confidence: "estimated",
    note: "Derived from partial coverage. Treat as an approximate pattern, not fact.",
    points: [
      { label: "Jan", updates: 24, newApps: 4, signals: 9 },
      { label: "Feb", updates: 31, newApps: 5, signals: 12 },
      { label: "Mar", updates: 28, newApps: 3, signals: 8 },
      { label: "Apr", updates: 37, newApps: 6, signals: 14 },
      { label: "May", updates: 33, newApps: 4, signals: 11 },
    ],
  },
];

// ---- Dataset accessor (the pluggable interface) ---------------------------

export interface Dataset {
  apps: Entity[];
  projects: Entity[];
  activity: ActivityItem[];
  trends: TrendSeries[];
  generatedAt: number;
  sourceLabel: string;
}

/**
 * Returns the current dataset. Today this resolves the bundled sample data;
 * a future implementation can fetch from a trusted external API and return the
 * same shape without any UI changes.
 */
export function getDataset(): Dataset {
  return {
    apps: APPS,
    projects: PROJECTS,
    activity: [...ACTIVITY].sort((a, b) => b.updatedAt - a.updatedAt),
    trends: TRENDS,
    generatedAt: NOW,
    sourceLabel: "Bundled sample data",
  };
}

// ---- Derived counters -----------------------------------------------------

export interface OverviewCounters {
  totalApps: number;
  activeProjects: number;
  recentUpdates: number; // in last 14 days
  networkSignals: number | null; // null until a trusted source reports a measurement
}

export function overviewCounters(d: Dataset): OverviewCounters {
  const recentCutoff = NOW - 14 * DAY;
  return {
    totalApps: d.apps.length,
    activeProjects: d.projects.filter((p) => p.status === "active").length,
    recentUpdates: d.activity.filter((a) => a.updatedAt >= recentCutoff && a.updatedAt > 0).length,
    // Bundled sample/demo signals are not network measurements. Keep the
    // overview unavailable until a trusted, documented source is connected.
    networkSignals: null,
  };
}

// ---- Filtering / sorting helpers ------------------------------------------

export function filterEntities(
  list: Entity[],
  statusFilter: StatusId | "all",
  confidenceFilter: ConfidenceId | "all",
  query: string,
): Entity[] {
  const q = query.trim().toLowerCase();
  return list.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (confidenceFilter !== "all" && e.confidence !== confidenceFilter) return false;
    if (q) {
      const hay = `${e.name} ${e.description} ${e.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortEntities(list: Entity[], sort: SortId): Entity[] {
  const copy = [...list];
  if (sort === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return copy;
}

// ---- Settings (persisted) -------------------------------------------------

export interface Settings {
  activeTab: TabId;
  appSort: SortId;
  projectSort: SortId;
}

export const DEFAULT_SETTINGS: Settings = {
  activeTab: "overview",
  appSort: "updated",
  projectSort: "updated",
};

const TAB_ID_SET = new Set<TabId>(TABS.map((t) => t.id));

/** Sanitize loaded settings — untrusted input. Falls back to defaults. */
export function sanitizeSettings(raw: unknown): Settings {
  const obj =
    raw && typeof raw === "object" && "blob" in (raw as Record<string, unknown>)
      ? (raw as { blob: unknown }).blob
      : raw;
  const r = (obj && typeof obj === "object" ? obj : {}) as Record<string, unknown>;
  const activeTab = TAB_ID_SET.has(r.activeTab as TabId)
    ? (r.activeTab as TabId)
    : DEFAULT_SETTINGS.activeTab;
  const appSort = isSortId(r.appSort) ? r.appSort : DEFAULT_SETTINGS.appSort;
  const projectSort = isSortId(r.projectSort) ? r.projectSort : DEFAULT_SETTINGS.projectSort;
  return { activeTab, appSort, projectSort };
}

export function settingsToBlob(s: Settings): Record<string, unknown> {
  return { activeTab: s.activeTab, appSort: s.appSort, projectSort: s.projectSort };
}
