import { Suspense } from "react";
import WorkOrderDetail from "./WorkOrderDetail";

export default async function WorkOrderPage({ params }: { params: Promise<{ workOrderId: string }> }) {
  const { workOrderId } = await params;

  return (
    <Suspense fallback={<div>Loading work order...</div>}>
      <WorkOrderDetail workOrderId={workOrderId} />
    </Suspense>
  );
}
