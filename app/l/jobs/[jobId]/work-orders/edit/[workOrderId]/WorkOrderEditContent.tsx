"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { NewRecordStickyPageHeader } from "@/app/l/components/NewRecordStickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { formatWorkOrderPageTitle } from "@/app/l/utils/pageTitles";
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
  const jobLabel = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";
  const [workOrderMeta, setWorkOrderMeta] = useState<{ isPickup: boolean; workType?: string | null } | null>(null);
  const [headerState, setHeaderState] = useState<{
    isSaving: boolean;
    lastSavedAt: Date | null;
    firstSave: boolean;
  }>({
    isSaving: false,
    lastSavedAt: null,
    firstSave: false,
  });
  const [saveAction, setSaveAction] = useState<(() => Promise<void>) | null>(null);

  const handleSaveActionReady = useCallback((action: () => Promise<void>) => {
    setSaveAction(() => action);
  }, []);

  useEffect(() => {
    const loadWorkOrderMeta = async () => {
      try {
        const response = await fetch(`/api/workorders/${workOrderId}/detail`);
        if (!response.ok) return;

        const data = await response.json();
        setWorkOrderMeta({
          isPickup: Boolean(data?.isPickup),
          workType: data?.takeoffs?.[0]?.work_type || null,
        });
      } catch (error) {
        console.error("Error loading work order details:", error);
      }
    };

    loadWorkOrderMeta();
  }, [workOrderId]);

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  const handleDone = async () => {
    try {
      if (saveAction) {
        await saveAction();
        return;
      }
      router.push(`/l/jobs/${jobId}/work-orders/view/${workOrderId}`);
    } catch (error) {
      console.error("Error saving work order:", error);
    }
  };

  return (
    <div>
      <NewRecordStickyPageHeader
        backLabel="Job"
        onBack={handleBack}
        onDone={handleDone}
        isSaving={headerState.isSaving}
        lastSavedAt={headerState.lastSavedAt}
        firstSave={headerState.firstSave}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <PageTitleBlock
          title={formatWorkOrderPageTitle({
            workType: workOrderMeta?.workType,
            isPickup: workOrderMeta?.isPickup,
            jobLabel,
          })}
          description={`Edit work order details for ${jobLabel}.`}
        />

        <WorkOrderDetail
          workOrderId={workOrderId}
          takeoffId={takeoffId}
          mode="edit"
          onSaveStateChange={setHeaderState}
          onSaveActionReady={handleSaveActionReady}
        />
      </div>
    </div>
  );
}
