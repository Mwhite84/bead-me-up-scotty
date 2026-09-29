"use client";
import { originOf } from "@/lib/attribution";
import { CommentBubble } from "./CommentBubble";
import { CommentComposer } from "./CommentComposer";
import { ScreenHeader } from "./ScreenHeader";
import { useBeadScreen } from "./useBeadScreen";

export function CommentsScreen({ id }: { id: string }) {
  const s = useBeadScreen(id);
  const { bead, actions } = s;
  const comments = bead?.comments ?? [];
  const detail = s.href(`/m/board/${encodeURIComponent(id)}`);
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader backHref={detail} backLabel={id} title="Comments" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 flex-col gap-0.5 px-4 pt-2.5">
          <span className="text-[13px] text-text-3">on</span>
          <span className="text-[15px] font-semibold">{bead?.title ?? (s.notFound ? `${id} not found` : "…")}</span>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
          {comments.map((c, i) => (
            <CommentBubble key={c.id ?? i} comment={c} projectId={s.projectId} origin={originOf(c.author, s.humanAllowlist)} />
          ))}
          <div className="flex justify-center">
            <span className="font-mono text-[11px] text-text-3">
              {comments.length} {comments.length === 1 ? "comment" : "comments"} · newest last
            </span>
          </div>
        </div>
      </div>
      <CommentComposer
        actor={s.actor} disabled={s.readOnly || !bead} pending={actions.addComment.isPending}
        onSend={(text) => actions.addComment.mutateAsync(text)}
      />
    </div>
  );
}
