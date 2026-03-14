"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { useUpdateWorkOrder } from "@/hooks/useWorkOrders";
import { NewRecordStickyPageHeader } from "@/app/l/components/NewRecordStickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import WorkOrderDetail from "../../[workOrderId]/WorkOrderDetail";

export default function WorkOrderEditContent({
  workOrderId,
  jobId,
  takeoffId,
}: {
  workOrderId: string;
  jobId: string;
  takeoffId?: string;
}) {
  const router = useRouter();
  const { data: dbJob } = useJobFromDB(jobId);
  const { mutateAsync: updateWorkOrder } = useUpdateWorkOrder();
  const jobName = dbJob?.projectInfo?.projectName || "Project";

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  const handleDone = async () => {
    try {
      // For now, just route to view page since the WorkOrderDetail component handles its own saving
      router.push(`/l/jobs/${jobId}/work-orders/view/${workOrderId}`);
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  return (
    <div>
      <NewRecordStickyPageHeader
        backLabel="Job"
        onBack={handleBack}
        onDone={handleDone}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <PageTitleBlock
          title="Edit Work Order"
          description={`Edit work order details for ${jobName}.`}
        />

        <WorkOrderDetail workOrderId={workOrderId} takeoffId={takeoffId} mode="edit" />
      </div>
    </div>
  );
}
