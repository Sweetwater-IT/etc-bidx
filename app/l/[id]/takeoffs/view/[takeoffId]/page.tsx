'use client';

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Edit, Download, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import TakeoffViewContent from '../../create/[takeoffId]/TakeoffViewContent';
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { supabase } from "@/lib/supabase";

const WORK_TYPES = [
  { value: "MPT", label: "MPT (Maintenance & Protection of Traffic)" },
  { value: "PERMANENT_SIGNS", label: "Permanent Signs" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENTAL", label: "Rental" },
];

export default function TakeoffViewPage({ params }: any) {
  const jobId = params.id;
  const takeoffId = params.takeoffId;
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.projectName || "Untitled Project";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <Suspense fallback={null}>
          <div className="min-h-screen bg-background">
            <TakeoffViewPageHeader jobId={jobId} takeoffId={takeoffId} />
            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-8">
              <PageTitleBlock
                title={`Takeoff for ${jobName}`}
                description="Review takeoff details, materials, and linked work order actions."
              />
              <TakeoffViewContent jobId={jobId} takeoffId={takeoffId} isViewMode={true} />
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TakeoffViewPageHeader({ jobId, takeoffId }: { jobId: string; takeoffId: string }) {
  const router = useRouter();
  const [takeoff, setTakeoff] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const loadTakeoff = async () => {
      try {
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!response.ok) {
          throw new Error(`Failed to load takeoff: ${response.status}`);
        }
        const data = await response.json();
        setTakeoff(data);
      } catch (error) {
        console.error('Error loading takeoff:', error);
        toast.error('Failed to load takeoff');
      }
    };
    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId]);

  const handleEdit = () => {
    const resolvedJobId = takeoff?.job_id ?? jobId;
    const resolvedTakeoffId = takeoff?.id ?? takeoffId;
    if (!resolvedJobId || !resolvedTakeoffId) {
      toast.error('Unable to open edit view. Missing takeoff details.');
      return;
    }
    router.push(`/l/${resolvedJobId}/takeoffs/edit/${resolvedTakeoffId}`);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch(`/api/takeoffs/${takeoffId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `takeoff-${takeoff?.title || 'untitled'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    setLoading(true);
    try {
      const woResponse = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: 'unknown@example.com'
        })
      });
      if (woResponse.ok) {
        const result = await woResponse.json();
        toast.success('Work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/view/${result.workOrder.id}`);
      } else {
        const err = await woResponse.json();
        toast.error(err.error || 'Failed to generate work order');
      }
    } catch (error) {
      console.error("Error generating work order:", error);
      toast.error("Failed to generate work order");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePickupWorkOrder = async () => {
    console.log('🔍 [FRONTEND] Starting pickup work order creation...');
    console.log('🔍 [FRONTEND] Takeoff data:', {
      takeoffId,
      work_order_id: takeoff?.work_order_id,
      title: takeoff?.title,
      work_type: takeoff?.work_type
    });

    setLoading(true);
    try {
      const requestPayload = {
        userEmail: 'unknown@example.com',
        is_pickup: true,
        parentWorkOrderId: takeoff?.work_order_id
      };

      console.log('🔍 [FRONTEND] Sending request to API:', {
        url: `/api/workorders/from-takeoff/${takeoffId}`,
        method: 'POST',
        payload: requestPayload
      });

      const response = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('🔍 [FRONTEND] API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 [FRONTEND] API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to generate pickup work order');
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] API Success Response:', data);

      if (data.success && data.workOrder) {
        console.log('🔍 [FRONTEND] Success! Navigating to work order:', data.workOrder.id);
        toast.success('Pickup work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/view/${data.workOrder.id}`);
      } else {
        console.error('🔍 [FRONTEND] Unexpected response format:', data);
        toast.error('Failed to generate pickup work order');
      }
    } catch (error) {
      console.error("🔍 [FRONTEND] Error generating pickup work order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate pickup work order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StickyPageHeader
      backLabel="Job"
      onBack={() => router.push(`/l/${jobId}`)}
      leftContent={
        <div className="min-w-0">
          <h1 className="text-sm font-semibold truncate">{takeoff?.title || "Takeoff"}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {WORK_TYPES.find((wt) => wt.value === takeoff?.work_type)?.label || takeoff?.work_type || "—"}
          </p>
        </div>
      }
      rightContent={
        <>
          {takeoff?.is_pickup && takeoff?.parent_takeoff?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoff.parent_takeoff.id}`)}
            >
              View Parent Takeoff
            </Button>
          )}
          {!takeoff?.is_pickup && takeoff?.pickup_takeoff?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoff.pickup_takeoff.id}`)}
            >
              View Pickup Takeoff
            </Button>
          )}
          {!takeoff?.is_pickup && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadPdf} disabled={generatingPdf}>
            <Download className="h-3.5 w-3.5" />
            {generatingPdf ? "Generating…" : "Download PDF"}
          </Button>
          {takeoff?.work_order_id ? (
            <>
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => router.push(`/l/jobs/${jobId}/work-orders/view/${takeoff.work_order_id}`)}>
                <ClipboardList className="h-3.5 w-3.5" />
                View Work Order
              </Button>
              {!takeoff?.is_pickup && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCreatePickupWorkOrder} disabled={loading}>
                  <ClipboardList className="h-3.5 w-3.5" />
                  {loading ? "Creating…" : "Generate Pickup Work Order"}
                </Button>
              )}
            </>
          ) : !takeoff?.is_pickup ? (
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleCreateWorkOrder} disabled={loading}>
              <ClipboardList className="h-3.5 w-3.5" />
              {loading ? "Creating…" : "Generate Work Order"}
            </Button>
          ) : null}
        </>
      }
    />
  );
}