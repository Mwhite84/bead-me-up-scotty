import type { Bead } from "@/lib/schema";
import { Avatar } from "./Avatar";
import { PriorityBadge } from "./PriorityBadge";
import { StatusDot, statusKey, type StatusKey } from "./StatusChip";
import { Svg } from "./Svg";
import { TypeIcon, typeLabel } from "./TypeIcon";

const Count = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-[3px] text-xs text-text-3">
    <Svg size={13} color="var(--text-3)">{children}</Svg>
    {n}
  </span>
);

/**
 * Bead card. `status` overrides the derived column (pass it when you know the
 * bead is dependency-blocked); `epic` is the parent epic's title for the tag;
 * `origin` shows the human/agent glyph (the mockups' header-right icon).
 */
export function Card({
  bead, status, epic, origin,
}: { bead: Bead; status?: StatusKey; epic?: string; origin?: "human" | "agent" }) {
  const deps = bead.dependency_count ?? 0;
  const comments = bead.comment_count ?? bead.comments.length;
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface px-3.5 py-3 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2">
        <StatusDot status={status ?? statusKey(bead)} />
        <span className="whitespace-nowrap font-mono text-xs text-text-2">{bead.id}</span>
        <span className="flex-1" />
        <PriorityBadge priority={bead.priority} />
        {origin === "agent" ? (
          <Svg size={14} color="var(--brand)"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none" /></Svg>
        ) : origin === "human" ? (
          <Svg size={14} color="var(--text-3)"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Svg>
        ) : null}
      </div>
      <div className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-text [text-wrap:pretty]">
        {bead.title}
      </div>
      <div className="flex min-h-5 items-center gap-2.5">
        <span
          className="inline-flex items-center gap-[5px] text-xs"
          style={{ color: bead.issue_type === "bug" ? "var(--st-blocked)" : "var(--text-2)" }}
        >
          <TypeIcon type={bead.issue_type} color="currentColor" />
          {typeLabel(bead.issue_type)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
          <Avatar name={bead.assignee} size={18} />
          {bead.assignee}
        </span>
        <span className="flex-1" />
        {deps > 0 && (
          <Count n={deps}>
            <path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 5.6" />
            <path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" />
          </Count>
        )}
        {comments > 0 && (
          <Count n={comments}><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" /></Count>
        )}
        {epic && (
          <span className="min-w-0 max-w-[45%] truncate whitespace-nowrap rounded-md bg-brand-weak px-[7px] py-[3px] text-[11px] text-brand">{epic}</span>
        )}
      </div>
    </div>
  );
}
