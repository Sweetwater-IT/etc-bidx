"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { Button } from "@/components/ui/button";
import { Edit, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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

  const [pickupWO, setPickupWO] = useState<{ id: string; wo_number: string | null; status: string } | null>(null);
  const [generatingPickup, setGeneratingPickup] = useState(false);

  useEffect(() => {
    const fetchPickupWorkOrder = async () => {
      try {
        const response = await fetch(`/api/workorders/${workOrderId}/detail`);
        if (response.ok) {
          const data = await response.json();
          setPickupWO(data.pickupWO || null);
        }
      } catch (error) {
        console.error('Error fetching pickup work order:', error);
      }
    };

    fetchPickupWorkOrder();
  }, [workOrderId]);

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  const handleEdit = () => {
    router.push(`/l/jobs/${jobId}/work-orders/edit/${workOrderId}`);
  };

  const handleGeneratePickupWorkOrder = async () => {
    setGeneratingPickup(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pickup-work-order", {
        body: { parentWorkOrderId: workOrderId }
      });

      if (error) {
        throw error;
      }

      if (data?.workOrder) {
        toast.success('Pickup work order generated successfully!');
        setPickupWO(data.workOrder);
        router.push(`/l/jobs/${jobId}/work-orders/view/${data.workOrder.id}`);
      } else {
        toast.error('Failed to generate pickup work order');
      }
    } catch (error) {
      console.error("Error generating pickup work order:", error);
      toast.error("Failed to generate pickup work order");
    } finally {
      setGeneratingPickup(false);
    }
  };

  const handleViewPickupWorkOrder = () => {
    if (pickupWO) {
      router.push(`/l/jobs/${jobId}/work-orders/view/${pickupWO.id}`);
    }
  };

  return (
    <div>
      <StickyPageHeader
        backLabel="Job"
        onBack={handleBack}
        rightContent={
          <>
            {pickupWO ? (
              <Button variant="outline" size="sm" onClick={handleViewPickupWorkOrder}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                View Pickup Work Order
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleGeneratePickupWorkOrder} disabled={generatingPickup}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                {generatingPickup ? "Creating…" : "Generate Pickup Work Order"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </>
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
