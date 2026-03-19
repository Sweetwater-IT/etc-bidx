"use client";

import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { Button } from "@/components/ui/button";
import { Edit, ClipboardList, Download, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import WorkOrderDetail from "../../[workOrderId]/WorkOrderDetail";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { formatWorkOrderPageTitle } from "@/app/l/utils/pageTitles";

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
  const jobName = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";

  const [pickupWO, setPickupWO] = useState<{ id: string; wo_number: string | null; status: string } | null>(null);
  const [generatingPickup, setGeneratingPickup] = useState(false);
  const [workOrderData, setWorkOrderData] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  useEffect(() => {
    const fetchPickupWorkOrder = async () => {
      try {
        const response = await fetch(`/api/workorders/${workOrderId}/detail`);
        if (response.ok) {
          const data = await response.json();
          setPickupWO(data.pickupWO || null);
          setWorkOrderData(data);
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
    if (!workOrderData?.takeoffs?.[0]) {
      toast.error('Unable to find takeoff for this work order');
      return;
    }

    setGeneratingPickup(true);
    try {
      // Determine the correct install takeoff ID to generate pickup from
      const takeoff = workOrderData.takeoffs[0];
      const installTakeoffId = takeoff.is_pickup ? takeoff.parent_takeoff_id : takeoff.id;

      if (!installTakeoffId) {
        toast.error('Unable to determine install takeoff for pickup generation');
        return;
      }

      const response = await fetch(`/api/workorders/from-takeoff/${installTakeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: 'unknown@example.com',
          is_pickup: true,
          parentWorkOrderId: workOrderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate pickup work order');
      }

      const data = await response.json();
      if (data.success && data.workOrder) {
        toast.success('Pickup work order generated successfully!');
        setPickupWO(data.workOrder);
        router.push(`/l/jobs/${jobId}/work-orders/view/${data.workOrder.id}`);
      } else {
        toast.error('Failed to generate pickup work order');
      }
    } catch (error) {
      console.error("Error generating pickup work order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate pickup work order");
    } finally {
      setGeneratingPickup(false);
    }
  };

  const handleViewPickupWorkOrder = () => {
    if (pickupWO) {
      router.push(`/l/jobs/${jobId}/work-orders/view/${pickupWO.id}`);
    }
  };

  const handleDownloadWorkOrderPdf = async () => {
    setDownloadingPdf('workorder');
    try {
      const response = await fetch(`/api/l/jobs/${jobId}/work-orders/${workOrderId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate work order PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `work-order-${workOrderData?.wo_number || workOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Work order PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating work order PDF:", error);
      toast.error("Failed to generate work order PDF");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDownloadTakeoffPdf = async () => {
    if (!workOrderData?.takeoffs?.[0]) {
      toast.error('No takeoff found for this work order');
      return;
    }

    setDownloadingPdf('takeoff');
    try {
      const takeoffId = workOrderData.takeoffs[0].id;
      const response = await fetch(`/api/takeoffs/${takeoffId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate takeoff PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `takeoff-${workOrderData.takeoffs[0].title || takeoffId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Takeoff PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating takeoff PDF:", error);
      toast.error("Failed to generate takeoff PDF");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDownloadCombinedPdf = async () => {
    setDownloadingPdf('combined');
    try {
      // For combined PDF, we'll use the work order PDF endpoint which might combine both
      // If not, we could create a new endpoint or download both separately
      const response = await fetch(`/api/l/jobs/${jobId}/work-orders/${workOrderId}/pdf?include_takeoff=true`);
      if (!response.ok) {
        throw new Error('Failed to generate combined PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `work-order-takeoff-${workOrderData?.wo_number || workOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Combined PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating combined PDF:", error);
      toast.error("Failed to generate combined PDF");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleMarkAsReady = async () => {
    try {
      const response = await fetch(`/api/workorders/${workOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ready'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark work order as ready');
      }

      toast.success("Work order marked as ready");
      // Refresh the work order data
      const detailResponse = await fetch(`/api/workorders/${workOrderId}/detail`);
      if (detailResponse.ok) {
        const data = await detailResponse.json();
        setWorkOrderData(data);
      }
    } catch (error) {
      console.error("Error marking work order as ready:", error);
      toast.error("Failed to mark work order as ready");
    }
  };

  const getTitle = () => {
    return formatWorkOrderPageTitle({
      workType: workOrderData?.takeoffs?.[0]?.work_type,
      isPickup: workOrderData?.isPickup,
      jobLabel: jobName,
    });
  };

  return (
    <div>
      <StickyPageHeader
        backLabel="Job"
        onBack={handleBack}
        rightContent={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadWorkOrderPdf}
              disabled={downloadingPdf === 'workorder'}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadingPdf === 'workorder' ? "Downloading…" : "Work Order PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTakeoffPdf}
              disabled={downloadingPdf === 'takeoff'}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadingPdf === 'takeoff' ? "Downloading…" : "Takeoff PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCombinedPdf}
              disabled={downloadingPdf === 'combined'}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadingPdf === 'combined' ? "Downloading…" : "WO + Takeoff PDF"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAsReady}
              disabled={workOrderData?.status === 'ready'}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {workOrderData?.status === 'ready' ? 'Ready' : 'Mark as Ready'}
            </Button>
            {!workOrderData?.isPickup && (pickupWO ? (
              <Button variant="outline" size="sm" onClick={handleViewPickupWorkOrder}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                View Pickup Work Order
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleGeneratePickupWorkOrder} disabled={generatingPickup}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                {generatingPickup ? "Creating…" : "Generate Pickup Work Order"}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/l/contracts/view/${jobId}`}>Contract</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/l/${jobId}`}>Job</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/l/${jobId}/takeoffs/view/${workOrderData?.takeoffs?.[0]?.id || takeoffId}`}>Takeoff</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{jobName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageTitleBlock
          title={getTitle()}
          description={`View work order details for ${jobName}.`}
        />

        <WorkOrderDetail workOrderId={workOrderId} takeoffId={takeoffId} mode="view" />
      </div>
    </div>
  );
}
