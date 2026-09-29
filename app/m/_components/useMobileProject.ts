"use client";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";

/**
 * Which project the mobile screens show: `?project=<id>`, else the most recently
 * opened real project, else the first one listed (the built-in demo). The
 * Project picker sheet (later bead) writes the param.
 */
export function useMobileProject(): { projectId?: string; name?: string } {
  const param = useSearchParams().get("project");
  const { data } = useProjects();
  const projects = data?.projects ?? [];
  const recent = projects
    .filter((p) => p.id !== "demo")
    .sort((a, b) => (b.lastOpened ?? "").localeCompare(a.lastOpened ?? ""))[0];
  const pick = projects.find((p) => p.id === param) ?? recent ?? projects[0];
  return { projectId: pick?.id, name: pick?.name };
}
