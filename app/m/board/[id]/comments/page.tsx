import { Suspense } from "react";
import { CommentsScreen } from "../../../_components/CommentsScreen";

export default async function BeadCommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><CommentsScreen id={decodeURIComponent(id)} /></Suspense>;
}
