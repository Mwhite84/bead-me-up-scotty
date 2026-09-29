import { isBlocked } from "./beads-view";
import type { Bead } from "./schema";

/**
 * Focus derivation shared by the desktop Focus view and the mobile Focus screen:
 *   In flight — in_progress or hooked
 *   Blocked   — blocked status, or open with an unresolved blocking dep
 *   Next up   — open, unblocked, P0/P1
 *   Recently finished — closed, newest completion first
 * Archived beads are always excluded.
 */
export const ARCHIVED = "archived";
export const RECENT_LIMIT = 7;

export function completionDate(bead: Bead): string | undefined {
  // Invalid/missing completion dates fall back to the last known update.
  const closed = Date.parse(bead.closed_at || "");
  if (Number.isFinite(closed)) return bead.closed_at || undefined;
  const updated = Date.parse(bead.updated_at || "");
  return Number.isFinite(updated) ? bead.updated_at : undefined;
}

export function completionTime(bead: Bead): number {
  return Date.parse(completionDate(bead) || "") || 0;
}

export function laneOf(b: Bead, prefix: string): string | null {
  const l = (b.labels ?? []).find((x) => x.startsWith(prefix));
  return l ? l.slice(prefix.length) : null;
}

export type FocusColumn = { id: string; title: string; hint: string; items: Bead[] };

function assigneeKey(bead: Bead): string {
  // Prefix real names so no name can collide with the blank-assignee sentinel.
  return bead.assignee?.trim() ? `person:${bead.assignee.trim()}` : "none";
}

/** Regroup columns by assignee; unassigned last, then groups with in-flight work first. */
export function assigneeGroups(columns: FocusColumn[]) {
  const groups = new Map<string, { key: string; label: string; columns: FocusColumn[]; active: boolean }>();
  for (const [columnIndex, column] of columns.entries()) {
    for (const bead of column.items) {
      const key = assigneeKey(bead);
      let group = groups.get(key);
      if (!group) {
        group = { key, label: bead.assignee?.trim() || "No assignee",
          columns: columns.map(c => ({ ...c, items: [] })), active: false };
        groups.set(key, group);
      }
      group.columns[columnIndex].items.push(bead);
      group.active ||= column.id === "flight";
    }
  }
  return [...groups.values()].sort((a, b) =>
    Number(a.key === "none") - Number(b.key === "none") ||
    Number(b.active) - Number(a.active) || a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
}

/** `beads` may include archived ones; `index` must cover every bead (dependency lookups). */
export function focusBuckets(beads: Bead[], index: Map<string, Bead>, inLane: (b: Bead) => boolean = () => true) {
  const active = beads.filter((b) => !(b.labels ?? []).includes(ARCHIVED) && inLane(b));
  return {
    inFlight: active.filter((b) => b.status === "in_progress" || b.status === "hooked"),
    blocked: active.filter((b) => isBlocked(b, index)),
    nextUp: active.filter((b) => b.status === "open" && b.priority <= 1 && !isBlocked(b, index)),
    recentlyFinished: active.filter((b) => b.status === "closed")
      .sort((a, b) => completionTime(b) - completionTime(a) || a.id.localeCompare(b.id)),
  };
}
