"use client";
import { DescriptionContent } from "@/components/description-content";
import { fmtDate } from "@/lib/beads-view";
import type { Comment } from "@/lib/schema";
import { Avatar } from "./Avatar";
import { OriginIcon } from "./OriginIcon";

/**
 * One comment in the full thread. Human bubbles are brand-tinted, agent bubbles
 * white; both have the 4px tail corner toward the avatar. `origin` comes from the
 * caller's attribution check (lib/attribution originOf) so the allowlist logic
 * stays in one place.
 */
export function CommentBubble({
  comment, origin, projectId,
}: { comment: Comment; origin: "human" | "agent"; projectId: string }) {
  const human = origin === "human";
  return (
    <div className="flex items-start gap-2.5">
      <Avatar name={comment.author} size={30} />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-text">{comment.author || "unknown"}</span>
          <OriginIcon origin={origin} size={13} />
          <span className="text-text-3">{origin} · {fmtDate(comment.created_at)}</span>
        </span>
        <div
          className={`rounded-[4px_14px_14px_14px] border px-3 py-2.5 text-sm leading-[1.5] text-text [overflow-wrap:anywhere] ${
            human ? "border-[rgba(109,94,240,.35)] bg-[#efedfd]" : "border-border bg-surface"
          }`}
        >
          <DescriptionContent text={comment.text} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
