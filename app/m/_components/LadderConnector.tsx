import type { LadderEdge } from "@/lib/dep-ladder";

/**
 * Vertical line + relation pill joining two ladder rungs. A blocking relation
 * gets a solid colored line (red while it holds, green once resolved); every
 * other DepType gets a dashed gray one labelled with the relation itself.
 */
export function LadderConnector({ edge }: { edge: LadderEdge }) {
  const color = edge.resolved ? "var(--st-done)" : edge.blocking ? "var(--st-blocked)" : "var(--text-2)";
  return (
    <div
      className="flex min-h-7 items-center gap-2.5 py-0.5 pl-7"
      data-edge={edge.blocking ? "blocking" : "related"}
      data-edge-type={edge.type}
    >
      <span
        className="h-7 w-0.5 shrink-0"
        style={edge.blocking ? { background: color } : { borderLeft: `2px dashed ${color}` }}
      />
      <span
        className="whitespace-nowrap rounded-full px-2 py-[5px] font-mono text-[11px] font-medium leading-none"
        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      >
        {edge.label}
      </span>
    </div>
  );
}
