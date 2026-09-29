import { Suspense } from "react";
import { DependencyLadder } from "../../../_components/DependencyLadder";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default async function BeadGraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><DependencyLadder id={decodeURIComponent(id)} /></Suspense>;
}
