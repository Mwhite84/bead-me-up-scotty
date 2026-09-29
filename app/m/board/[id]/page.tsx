import { Suspense } from "react";
import { DetailScreen } from "../../_components/DetailScreen";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default async function BeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><DetailScreen id={decodeURIComponent(id)} /></Suspense>;
}
