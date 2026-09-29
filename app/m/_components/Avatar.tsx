// Palette from the mockups; brand/status tokens are referenced, not duplicated.
const PALETTE = ["var(--st-done)", "var(--brand)", "var(--st-ready)", "var(--av-orange)", "var(--av-violet)"];

/** Deterministic: the same actor name always lands on the same color. */
export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "").slice(0, 2);
  return s.toUpperCase();
}

/** `name` empty/undefined renders the unassigned "?" avatar. */
export function Avatar({ name, size = 18 }: { name?: string; size?: number }) {
  const assigned = !!name?.trim();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-[0.02em]"
      style={{
        width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.44)),
        background: assigned ? avatarColor(name!) : "var(--surface-3)",
        color: assigned ? "#ffffff" : "var(--text-3)",
      }}
    >
      {assigned ? initials(name!) : "?"}
    </span>
  );
}
