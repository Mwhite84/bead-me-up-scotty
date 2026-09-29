"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewerMode } from "@/hooks/use-viewer-mode";
import { CreateSheet } from "./CreateSheet";
import { ProjectPickerSheet } from "./ProjectPickerSheet";
import { selectMobileProject } from "./useMobileProject";

/**
 * Overlay host rendered by the shell layout. The tab bar's New button and the
 * header ProjectPill only set `?sheet=create` / `?picker=projects`; this reads
 * them, so a sheet is a URL state (back button and reload behave).
 */
export function Sheets() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const readOnly = useViewerMode().data?.readOnly ?? false;

  const close = (projectId?: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("sheet");
    next.delete("picker");
    if (projectId) {
      selectMobileProject(projectId);
      next.set("project", projectId);
    }
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  if (params.get("picker") === "projects") return <ProjectPickerSheet onClose={close} />;
  // Creating writes bead data, which read-only mode refuses; the tab bar already shows the lock.
  if (params.get("sheet") === "create" && !readOnly) return <CreateSheet onClose={() => close()} />;
  return null;
}
