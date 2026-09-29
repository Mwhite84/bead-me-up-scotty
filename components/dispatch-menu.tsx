"use client";
import * as React from "react";
import { Icon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDispatch, useDispatchStatus } from "@/hooks/use-beads";
import type { Bead } from "@/lib/schema";

/** MC's violation shape isn't pinned down; accept a string or a {message|text|reason|rule} object. */
function violationText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["message", "text", "reason", "rule"]) if (typeof o[k] === "string") return o[k] as string;
  }
  return JSON.stringify(v);
}

/** Header menu that hands a bead (or epic) to omg-build or Krewe via Mission Control. */
export function DispatchMenu({ bead }: { bead: Bead }) {
  // Only query MC once the menu has been opened; a live Krewe run then keeps polling.
  const [touched, setTouched] = React.useState(false);
  const { data, isError, error } = useDispatchStatus(bead.id, touched);
  const dispatch = useDispatch();
  // `dispatch.data` is the last result; only an omg-build result carries sessionName.
  const session = dispatch.data?.sessionName ? dispatch.data : null;
  const readiness = data?.omgBuild.readiness;
  const violation = readiness?.ok === false ? readiness.violations[0] : undefined;
  const run = data?.krewe.run;

  return (
    <DropdownMenu onOpenChange={(o) => o && setTouched(true)}>
      <DropdownMenuTrigger
        title="Dispatch"
        aria-label="Dispatch"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus:outline-none"
      >
        <Icon name="rocket" size={15} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        {isError ? (
          <DropdownMenuItem disabled>
            Couldn&apos;t load dispatch options{error instanceof Error && error.message ? `: ${error.message}` : "."}
          </DropdownMenuItem>
        ) : !data ? (
          <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
        ) : !data.configured ? (
          <DropdownMenuItem disabled>Dispatch unavailable: MC token not configured</DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              className="flex-col items-start"
              onClick={() => dispatch.mutate({ id: bead.id, target: "omg-build" })}
            >
              <span className="font-medium">Build with omg-build</span>
              <span className="break-all font-mono text-[11px] opacity-70">{data.omgBuild.command}</span>
              {violation !== undefined && (
                <span className="text-[11px] text-[#f59e0b]">{violationText(violation)}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex-col items-start"
              disabled={!data.krewe.eligible}
              onClick={() => dispatch.mutate({ id: bead.id, target: "krewe" })}
            >
              <span className="font-medium">{data.isEpic ? "Run epic on Krewe" : "Run on Krewe"}</span>
              {!data.krewe.eligible && data.krewe.reason && (
                <span className="text-[11px] opacity-70">{data.krewe.reason}</span>
              )}
            </DropdownMenuItem>
            {run && (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-1.5 py-1 text-[12px] text-[var(--text-2)]">
                  <span>Krewe: {run.status ?? "unknown"}</span>
                  {data.krewe.runUrl && (
                    <a
                      href={data.krewe.runUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--brand)] hover:underline"
                    >
                      View run
                    </a>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {session && (
          <>
            <DropdownMenuSeparator />
            <div className="px-1.5 py-1 text-[12px] text-[var(--text-2)]">
              <div>
                Session: <span className="font-mono">{session.sessionName}</span>
              </div>
              {session.warning && <div className="text-[#f59e0b]">{session.warning}</div>}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
