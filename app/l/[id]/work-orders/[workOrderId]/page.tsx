import { Suspense } from "react";
import WorkOrderDetail from "./WorkOrderDetail";

export default function WorkOrderPage() {
  return (
    <Suspense fallback={<div>Loading work order...</div>}>
      <WorkOrderDetail />
    </Suspense>
  );
}