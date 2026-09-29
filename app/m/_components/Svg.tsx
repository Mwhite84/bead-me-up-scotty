import type { ReactNode } from "react";

/** Shared stroke-icon wrapper: 24x24 viewBox, round caps, never emoji. */
export function Svg({
  size, stroke = 1.75, color = "currentColor", children,
}: { size: number; stroke?: number; color?: string; children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className="block shrink-0"
    >
      {children}
    </svg>
  );
}
