import { Suspense } from "react";
import CreateTakeoffPageContent from "@/app/l/[id]/takeoffs/create/CreateTakeoffPageContent";

export default async function CreateTakeoffPage({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <Suspense fallback={null}>
      <CreateTakeoffPageContent jobId={id} />
    </Suspense>
  );
}
