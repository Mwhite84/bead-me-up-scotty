// Stub route so Board card taps resolve; the Detail bead replaces this page.
export default async function BeadDetailStub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="p-5 font-mono text-sm text-text-2">{decodeURIComponent(id)}</div>;
}
