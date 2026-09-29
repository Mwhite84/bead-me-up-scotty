import { Avatar } from "./Avatar";
import { FOCUS_COLOR, type FocusKind } from "./FocusRow";
import { OriginIcon } from "./OriginIcon";

/** Zero counts render a hollow gray dot and muted number, per the mockup. */
const Pill = ({ kind, n }: { kind: FocusKind; n: number }) => (
  <span className="inline-flex items-center gap-1 font-mono text-[11px]" style={{ color: n ? FOCUS_COLOR[kind] : "var(--text-3)" }}>
    <span className="size-1.5 rounded-full" style={{ background: n ? FOCUS_COLOR[kind] : "var(--surface-3)" }} />
    {n}
  </span>
);

/** Assignee section header: avatar, name, origin glyph (named assignees), then flight/blocked/next counts. */
export function AssigneeGroupHeader({ name, origin, counts }: {
  name?: string; origin?: "human" | "agent"; counts: [number, number, number];
}) {
  return (
    <div className="flex min-h-10 items-center gap-2.5 px-1 pb-1 pt-2.5">
      <Avatar name={name} size={26} />
      <span className="text-[15px] font-semibold text-text">{name || "No assignee"}</span>
      {name && origin && <OriginIcon origin={origin} />}
      <span className="flex-1" />
      <span className="inline-flex gap-1.5">
        <Pill kind="flight" n={counts[0]} />
        <Pill kind="blocked" n={counts[1]} />
        <Pill kind="next" n={counts[2]} />
      </span>
    </div>
  );
}
