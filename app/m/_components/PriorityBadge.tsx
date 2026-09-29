const LABELS = ["Critical", "High", "Medium", "Low", "Backlog"] as const;
const TONE: Record<number, { bg: string; fg: string }> = {
  0: { bg: "var(--pri-critical-bg)", fg: "var(--pri-critical)" },
  1: { bg: "var(--pri-high-bg)", fg: "var(--pri-high)" },
  2: { bg: "var(--pri-medium-bg)", fg: "var(--pri-medium)" },
};
const NEUTRAL = { bg: "var(--surface-3)", fg: "var(--text-3)" };

export const priorityLabel = (p: number) => LABELS[p] ?? LABELS[2];

export function PriorityBadge({ priority }: { priority: number }) {
  const t = TONE[priority] ?? NEUTRAL;
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-[5px] font-mono text-[11px] font-medium leading-none"
      style={{ background: t.bg, color: t.fg }}
    >
      {priorityLabel(priority)}
    </span>
  );
}
