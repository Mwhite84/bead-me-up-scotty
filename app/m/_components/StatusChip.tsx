import type { Bead } from "@/lib/schema";

export type StatusKey = "backlog" | "ready" | "in_progress" | "blocked" | "done";

export const STATUS: Record<StatusKey, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "var(--st-backlog)" },
  ready: { label: "Ready", color: "var(--st-ready)" },
  in_progress: { label: "In progress", color: "var(--st-progress)" },
  blocked: { label: "Blocked", color: "var(--st-blocked)" },
  done: { label: "Done", color: "var(--st-done)" },
};

/**
 * Same mapping as lib/board-columns.ts, minus the dependency graph: pass
 * `blocked` (from isBlocked(bead, index)) when the caller has the index.
 */
export function statusKey(bead: Pick<Bead, "status">, blocked = false): StatusKey {
  if (bead.status === "closed") return "done";
  if (bead.status === "deferred") return "backlog";
  if (bead.status === "in_progress" || bead.status === "hooked") return "in_progress";
  return blocked || bead.status === "blocked" ? "blocked" : "ready";
}

export function StatusDot({ status, size = 8 }: { status: StatusKey; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: STATUS[status].color }}
    />
  );
}

/** Filter/lane chip: dot + label + optional count. `active` gets the brand outline. */
export function StatusChip({
  status, count, active = false,
}: { status: StatusKey; count?: number; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full border px-3 text-[13px] shadow-[var(--shadow)] ${
        active ? "border-brand bg-brand-weak font-semibold text-brand-2" : "border-border bg-surface font-medium text-text-2"
      }`}
    >
      <StatusDot status={status} size={7} />
      {STATUS[status].label}
      {count !== undefined && (
        <span className={`font-mono text-[11px] ${active ? "text-brand" : "text-text-3"}`}>{count}</span>
      )}
    </span>
  );
}
