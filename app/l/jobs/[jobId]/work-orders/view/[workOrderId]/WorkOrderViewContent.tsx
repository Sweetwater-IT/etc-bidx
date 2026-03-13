"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import WorkOrderDetail from "../../[workOrderId]/WorkOrderDetail";

export default function WorkOrderViewContent({
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
  const jobName = dbJob?.projectInfo?.projectName || "Project";

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div>
      <StickyPageHeader
        backLabel="Job"
        onBack={handleBack}
        rightContent={
          <div className="text-xs text-muted-foreground">
            View Work Order
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <PageTitleBlock
          title="Work Order Details"
          description={`View work order details for ${jobName}.`}
        />

        <WorkOrderDetail workOrderId={workOrderId} takeoffId={takeoffId} mode="view" />
      </div>
    </div>
  );
}