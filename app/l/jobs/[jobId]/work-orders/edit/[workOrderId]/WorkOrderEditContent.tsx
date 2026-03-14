"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { ArrowRight } from "lucide-react";
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
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
            <ArrowRight className="h-3 w-3" />
            Done
          </Button>
        }
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