"use client";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useProjects } from "@/hooks/use-projects";
import { useLocalPref, writeLocalPref } from "./useLocalPref";

const KEY = "bmus.mobile.project";

/** Remember the active project for this browser, so tab-bar links (which carry no `?project=`) stay on it. */
export const selectMobileProject = (id: string) => writeLocalPref(KEY, id);

/**
 * Which project the mobile screens show: `?project=<id>`, else the project last
 * picked/opened in this browser, else the most recently opened real project, else
 * the first one listed (the built-in demo). The Project picker sheet writes both
 * the param and the remembered id.
 */
export function useMobileProject(): { projectId?: string; name?: string } {
  const param = useSearchParams().get("project");
  const stored = useLocalPref(KEY);
  const { data } = useProjects();
  const projects = data?.projects ?? [];
  const recent = projects
    .filter((p) => p.id !== "demo")
    .sort((a, b) => (b.lastOpened ?? "").localeCompare(a.lastOpened ?? ""))[0];
  const pick = projects.find((p) => p.id === param) ?? projects.find((p) => p.id === stored) ?? recent ?? projects[0];
  // A deep link with ?project= becomes the remembered project, so dropping the param later doesn't switch it.
  React.useEffect(() => {
    if (param && pick?.id === param && stored !== param) selectMobileProject(param);
  }, [param, pick?.id, stored]);
  return { projectId: pick?.id, name: pick?.name };
}
