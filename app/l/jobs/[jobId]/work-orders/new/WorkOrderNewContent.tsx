"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import WorkOrderDetail from "../[workOrderId]/WorkOrderDetail";

export default function WorkOrderNewContent({
  jobId,
  takeoffId,
}: {
  jobId: string;
  takeoffId?: string;
}) {
  const router = useRouter();
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";

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
            New Work Order
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <PageTitleBlock
          title="Create New Work Order"
          description={`Create a new work order for ${jobName}.`}
        />

        <WorkOrderDetail workOrderId="new" takeoffId={takeoffId} mode="edit" />
      </div>
    </div>
  );
}