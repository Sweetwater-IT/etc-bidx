import { Suspense } from "react";
import ProjectDetail from "./ProjectDetail";

export default async function JobDetailPage({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <Suspense fallback={null}>
      <ProjectDetail />
    </Suspense>
  );
}