"use client";
import * as React from "react";
import { Avatar } from "./Avatar";
import { Svg } from "./Svg";

/**
 * Sticky bottom composer shared by Detail and Comments. Focus turns the border
 * brand-purple (the mockup's active state; the caret is brand-colored too) and the
 * send button fills once there is text to send.
 */
export function CommentComposer({
  actor, disabled, pending, onSend,
}: { actor: string; disabled?: boolean; pending?: boolean; onSend: (text: string) => Promise<unknown> }) {
  const [text, setText] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !pending && text.trim().length > 0;

  // Grow with content up to ~5 lines.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const send = () => {
    if (!canSend) return;
    onSend(text.trim()).then(() => setText(""), () => {}); // errors already toasted; keep the draft
  };

  return (
    <div
      className="flex shrink-0 items-end gap-2.5 border-t border-border bg-surface px-4 pt-2.5"
      style={{ paddingBottom: "calc(34px + env(safe-area-inset-bottom))" }}
    >
      <span className="flex h-11 items-center"><Avatar name={actor} size={32} /></span>
      <textarea
        ref={ref} rows={1} value={text} disabled={disabled} aria-label="Comment"
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? "Read-only" : `Comment as ${actor}…`}
        className="min-h-11 min-w-0 flex-1 resize-none rounded-[22px] border border-border bg-surface-2 px-3.5 py-[11px] text-sm leading-[1.4] text-text caret-brand outline-none placeholder:text-text-3 focus:border-brand disabled:opacity-60"
      />
      <button
        type="button" aria-label="Send comment" disabled={!canSend} onClick={send}
        className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${canSend ? "bg-brand" : "text-text-3"}`}
      >
        <Svg size={canSend ? 20 : 22} stroke={canSend ? 2 : 1.75} color={canSend ? "#ffffff" : "currentColor"}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
        </Svg>
      </button>
    </div>
  );
}
