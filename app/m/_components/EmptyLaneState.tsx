import { STATUS, type StatusKey } from "./StatusChip";
import { Svg } from "./Svg";

const HEADLINE: Record<StatusKey, string> = {
  backlog: "Backlog is empty",
  ready: "Nothing is ready",
  in_progress: "Nothing in progress",
  blocked: "Nothing is blocked",
  done: "Nothing done yet",
};

const ICON: Partial<Record<StatusKey, React.ReactNode>> = {
  backlog: <path d="M21 13A8 8 0 1 1 11 3a6.5 6.5 0 0 0 10 10z" />,
  blocked: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

/** Shown when the selected lane has no beads. Buttons jump to another lane via `onSelect`. */
export function EmptyLaneState({
  lane, counts, onSelect,
}: { lane: StatusKey; counts: Record<StatusKey, number>; onSelect: (s: StatusKey) => void }) {
  const open = counts.backlog + counts.ready + counts.in_progress + counts.blocked;
  const copy =
    lane === "ready"
      ? `All ${open} open beads are either deferred or waiting on a blocker. Pull one out of Backlog, or clear what is blocking.`
      : `No beads are ${STATUS[lane].label.toLowerCase()} right now. ${open} open across the board.`;
  const targets: StatusKey[] = lane === "ready" ? ["backlog", "blocked"] : (["ready", "backlog"] as StatusKey[]).filter((t) => t !== lane);
  const label = (t: StatusKey) =>
    t === "backlog" ? "Browse Backlog" : t === "blocked" ? "See what is blocked" : `Go to ${STATUS[t].label}`;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-[60px] text-center">
      <svg width="140" height="90" viewBox="0 0 140 90" fill="none" aria-hidden="true">
        <path d="M10 60 C 40 20, 60 20, 70 45 S 100 80, 130 30" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
        <circle cx="10" cy="60" r="7" fill="var(--st-backlog)" />
        <circle cx="70" cy="45" r="9" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2" />
        <circle cx="130" cy="30" r="7" fill="var(--st-blocked)" />
      </svg>
      <div className="text-xl font-bold tracking-[-0.02em]">{HEADLINE[lane]}</div>
      <div className="text-sm leading-normal text-text-2 [text-wrap:pretty]">{copy}</div>
      <div className="mt-1.5 flex w-full flex-col gap-2.5">
        {targets.map((t, i) => (
          <button
            key={t} type="button" onClick={() => onSelect(t)}
            className={`inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] px-[18px] text-[15px] font-semibold ${
              i === 0 ? "bg-brand text-white" : "border border-border-strong bg-surface-2 text-text"
            }`}
          >
            <Svg size={18} stroke={2}>{ICON[t] ?? <circle cx="12" cy="12" r="9" />}</Svg>
            {label(t)} · {counts[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
