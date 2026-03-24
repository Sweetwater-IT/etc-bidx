"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { formatWorkOrderPageTitle } from "@/app/l/utils/pageTitles";
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
  const { data: takeoff } = useTakeoffFromDB(takeoffId);
  const jobLabel = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";

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

      <div className="mx-auto w-full max-w-7xl min-[1921px]:max-w-[calc(100vw-272px-48px)] px-4 py-8 space-y-6">
        <PageTitleBlock
          title={formatWorkOrderPageTitle({
            workType: takeoff?.work_type,
            isPickup: takeoff?.is_pickup,
            jobLabel,
          })}
          description={`Create a new work order for ${jobLabel}.`}
        />

        <WorkOrderDetail workOrderId="new" takeoffId={takeoffId} mode="edit" />
      </div>
    </div>
  );
}
