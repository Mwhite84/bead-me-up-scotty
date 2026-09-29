import Link from "next/link";
import type { Bead } from "@/lib/schema";
import { Avatar } from "./Avatar";
import { PriorityBadge } from "./PriorityBadge";
import { Svg } from "./Svg";

export type FocusKind = "flight" | "blocked" | "next" | "done";

export const FOCUS_COLOR: Record<FocusKind, string> = {
  flight: "var(--st-progress)",
  blocked: "var(--st-blocked)",
  next: "var(--st-ready)",
  done: "var(--st-done)",
};

const Count = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-[3px] text-[11px] text-text-3">
    <Svg size={12} color="var(--text-3)">{children}</Svg>
    {n}
  </span>
);

/** Compact Focus row: status dot, title, id + priority + counts, assignee avatar. Links to the Detail screen. */
export function FocusRow({ bead, kind, href }: { bead: Bead; kind: FocusKind; href: string }) {
  const deps = bead.dependency_count ?? 0;
  const comments = bead.comment_count ?? bead.comments.length;
  return (
    <Link href={href} className="flex min-h-14 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: FOCUS_COLOR[kind] }} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-sm font-semibold text-text">{bead.title}</span>
        <span className="flex items-center gap-2">
          <span className="whitespace-nowrap font-mono text-[11px] text-text-3">{bead.id}</span>
          <PriorityBadge priority={bead.priority} />
          {deps > 0 && (
            <Count n={deps}>
              <path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 5.6" />
              <path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" />
            </Count>
          )}
          {comments > 0 && <Count n={comments}><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" /></Count>}
        </span>
      </span>
      <Avatar name={bead.assignee} size={24} />
    </Link>
  );
}
