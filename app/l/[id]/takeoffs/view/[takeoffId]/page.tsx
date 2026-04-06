'use client';

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Edit, Download, ClipboardList, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import TakeoffViewContent from '../../create/[takeoffId]/TakeoffViewContent';
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { ProjectFooter } from "@/components/ProjectFooter";
import { formatTakeoffPageTitle, getWorkTypeLabel } from "@/app/l/utils/pageTitles";
import { generateReturnTakeoffPdf } from "@/app/l/utils/generateReturnTakeoffPdf";

type ReturnInventoryItem = {
  product_name: string;
  category: string;
  quantity: number;
  return_details?: Record<string, string> | null;
  damage_photos?: Record<string, string> | null;
  sign_details?: Record<string, any> | string | null;
  notes?: string | null;
};

type ComponentKey = "sign" | "structure" | "lights";

const COMPONENT_LABELS: Record<ComponentKey, string> = {
  sign: "Sign",
  structure: "Structure",
  lights: "Lights",
};

const getReturnInventoryStatusEvent = (takeoffId: string) =>
  `return-inventory-status:${takeoffId}`;

function parseItemMeta(item: ReturnInventoryItem): Record<string, any> {
  const sources = [item.sign_details, item.notes];

  for (const source of sources) {
    if (!source) continue;
    if (typeof source === "object") return source;

    try {
      const parsed = JSON.parse(source);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      // Ignore plain-text notes.
    }
  }

  return {};
}

function getReturnInventoryComponents(item: ReturnInventoryItem): ComponentKey[] {
  const name = item.product_name.toUpperCase();
  const category = item.category.toUpperCase();
  const comps: ComponentKey[] = [];
  const meta = parseItemMeta(item);

  const isAdditionalOrEquip =
    category === "ADDITIONAL ITEMS" ||
    category === "ADDITIONAL" ||
    category === "VEHICLES" ||
    category === "VEHICLE" ||
    category === "ROLLING STOCK";

  if (
    isAdditionalOrEquip ||
    name.includes("VERTICAL PANEL") ||
    name.includes("HIP VERTICAL") ||
    name.includes("SAND BAG")
  ) {
    comps.push("sign");
    return comps;
  }

  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) {
    comps.push("structure");
    comps.push("lights");
    return comps;
  }

  comps.push("sign");

  const hasStruct = meta.structureType && meta.structureType !== "" && meta.structureType !== "Loose";
  if (hasStruct) comps.push("structure");

  const hasLights = meta.bLights && meta.bLights !== "none" && meta.bLights !== "";
  if (hasLights) comps.push("lights");

  return comps;
}

function isReturnInventoryComplete(items: ReturnInventoryItem[]) {
  return items.length > 0 && items.every((item) => {
    const components = getReturnInventoryComponents(item);
    const returnDetails = item.return_details || {};
    return components.every((componentKey) => Boolean(returnDetails[componentKey]));
  });
}

export default function TakeoffViewPage({ params }: any) {
  const jobId = params.id;
  const takeoffId = params.takeoffId;
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Untitled Project";

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
        <SiteHeader showTitleBlock={false} />
        <Suspense fallback={null}>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 pt-0 pb-4 md:gap-6 md:pt-0 md:pb-6">
                <TakeoffViewPageHeader jobId={jobId} takeoffId={takeoffId} jobName={jobName} />
                {/* Content Area */}
                <div className="px-4 py-8">
                  <TakeoffViewPageContent jobId={jobId} takeoffId={takeoffId} jobName={jobName} />
                  <TakeoffViewContent jobId={jobId} takeoffId={takeoffId} isViewMode={true} />
                </div>
                <ProjectFooter />
              </div>
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TakeoffViewPageContent({ jobId, takeoffId, jobName }: { jobId: string; takeoffId: string; jobName: string }) {
  const [takeoff, setTakeoff] = useState<any>(null);

  useEffect(() => {
    const loadTakeoff = async () => {
      try {
        console.log('[TakeoffViewPage] Loading title block data', { takeoffId, jobId });
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!response.ok) {
          throw new Error(`Failed to load takeoff: ${response.status}`);
        }
        const data = await response.json();
        console.log('[TakeoffViewPage] Title block takeoff loaded', {
          id: data?.id,
          title: data?.title,
          workType: data?.work_type,
          isPickup: data?.is_pickup,
        });
        setTakeoff(data);
      } catch (error) {
        console.error('[TakeoffViewPage] Error loading title block takeoff', error);
      }
    };
    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId]);

  const getTitle = () => {
    return formatTakeoffPageTitle({
      workType: takeoff?.work_type,
      isPickup: takeoff?.is_pickup,
      jobLabel: jobName,
    });
  };

  return (
    <>
      <PageTitleBlock
        title={getTitle()}
        description="Review takeoff details, materials, and linked work order actions."
      />
    </>
  );
}

function TakeoffViewPageHeader({ jobId, takeoffId, jobName }: { jobId: string; takeoffId: string; jobName: string }) {
  const router = useRouter();
  const { data: dbJob } = useJobFromDB(jobId);
  const [takeoff, setTakeoff] = useState<any>(null);
  const [linkedWorkOrderStatus, setLinkedWorkOrderStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pickupPdfReady, setPickupPdfReady] = useState(false);

  useEffect(() => {
    const loadTakeoff = async () => {
      try {
        console.log('[TakeoffViewPageHeader] Loading takeoff', { takeoffId, jobId });
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!response.ok) {
          throw new Error(`Failed to load takeoff: ${response.status}`);
        }
        const data = await response.json();
        console.log('[TakeoffViewPageHeader] Loaded takeoff', {
          id: data?.id,
          title: data?.title,
          workType: data?.work_type,
          linkedWorkOrderId: data?.work_order_id,
        });
        setTakeoff(data);
        setPickupPdfReady(
          Boolean(data?.is_pickup) &&
          isReturnInventoryComplete(Array.isArray(data?.takeoff_items) ? data.takeoff_items : [])
        );
        if (data?.work_order_id) {
          try {
            const workOrderResponse = await fetch(`/api/workorders/${data.work_order_id}`);
            if (workOrderResponse.ok) {
              const workOrder = await workOrderResponse.json();
              setLinkedWorkOrderStatus(workOrder?.status || null);
            } else {
              setLinkedWorkOrderStatus(null);
            }
          } catch (workOrderError) {
            console.error('[TakeoffViewPageHeader] Error loading linked work order', workOrderError);
            setLinkedWorkOrderStatus(null);
          }
        } else {
          setLinkedWorkOrderStatus(null);
        }
      } catch (error) {
        console.error('[TakeoffViewPageHeader] Error loading takeoff', error);
        toast.error('Failed to load takeoff');
      }
    };
    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId]);

  useEffect(() => {
    if (!takeoff?.is_pickup || typeof window === "undefined") {
      return;
    }

    const eventName = getReturnInventoryStatusEvent(takeoffId);
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ complete?: boolean }>;
      setPickupPdfReady(Boolean(customEvent.detail?.complete));
    };

    window.addEventListener(eventName, handleStatusChange as EventListener);
    return () => {
      window.removeEventListener(eventName, handleStatusChange as EventListener);
    };
  }, [takeoff?.is_pickup, takeoffId]);

  const handleEdit = () => {
    const resolvedJobId = takeoff?.job_id ?? jobId;
    const resolvedTakeoffId = takeoff?.id ?? takeoffId;
    if (!resolvedJobId || !resolvedTakeoffId) {
      toast.error('Unable to open edit view. Missing takeoff details.');
      return;
    }
    router.push(`/l/${resolvedJobId}/takeoffs/edit/${resolvedTakeoffId}`);
  };

  const isMptTakeoff = takeoff?.work_type === "MPT";
  const canGeneratePickupWorkOrder =
    !takeoff?.is_pickup &&
    isMptTakeoff &&
    takeoff?.work_order_id &&
    linkedWorkOrderStatus === "installed";

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      if (takeoff?.is_pickup) {
        const takeoffResponse = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!takeoffResponse.ok) {
          throw new Error("Failed to load pickup takeoff data");
        }

        const latestTakeoff = await takeoffResponse.json();
        const pickupItems = Array.isArray(latestTakeoff?.takeoff_items)
          ? (latestTakeoff.takeoff_items as ReturnInventoryItem[])
          : [];

        if (!isReturnInventoryComplete(pickupItems)) {
          toast.error("Complete the return report before downloading the pickup PDF.");
          setPickupPdfReady(false);
          return;
        }

        const projectInfo = dbJob?.projectInfo;
        setPickupPdfReady(true);

        const pdfItems = pickupItems.map((item) => {
          const components = getReturnInventoryComponents(item);
          const returnDetails = item.return_details || {};
          const damagePhotos = item.damage_photos || {};

          return {
            product_name: item.product_name,
            category: item.category,
            quantity: item.quantity,
            components: components.map((componentKey) => ({
              key: componentKey,
              label: COMPONENT_LABELS[componentKey],
              condition: returnDetails[componentKey],
              photoUrl: damagePhotos[componentKey] || undefined,
            })),
          };
        });

        await generateReturnTakeoffPdf({
          title: latestTakeoff?.title || "Pickup Return",
          workType: latestTakeoff?.work_type || "",
          projectName: projectInfo?.projectName || undefined,
          etcJobNumber: projectInfo?.etcJobNumber?.toString() || undefined,
          etcBranch: dbJob?.etc_branch || undefined,
          etcProjectManager: dbJob?.etc_project_manager || undefined,
          customerName: projectInfo?.customerName || undefined,
          customerJobNumber: projectInfo?.customerJobNumber || undefined,
          projectOwner: projectInfo?.projectOwner || undefined,
          county: projectInfo?.county || undefined,
          installDate: latestTakeoff?.install_date || undefined,
          pickupDate: latestTakeoff?.pickup_date || undefined,
          customerPM: projectInfo?.customerPM || undefined,
          assignedTo: latestTakeoff?.assigned_to || undefined,
          contractedOrAdditional: latestTakeoff?.contracted_or_additional || undefined,
          items: pdfItems,
        });

        toast.success("Pickup PDF downloaded successfully");
        return;
      }

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
      console.log('[TakeoffViewPageHeader] Generate work order clicked', {
        takeoffId,
        jobId,
        workType: takeoff?.work_type,
        title: takeoff?.title,
      });
      const woResponse = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: 'unknown@example.com'
        })
      });
      console.log('[TakeoffViewPageHeader] Generate work order response', {
        status: woResponse.status,
        ok: woResponse.ok,
      });
      if (woResponse.ok) {
        const result = await woResponse.json();
        console.log('[TakeoffViewPageHeader] Generate work order success', result);
        toast.success('Work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/edit/${result.workOrder.id}`);
      } else {
        const err = await woResponse.json();
        console.error('[TakeoffViewPageHeader] Generate work order failed', err);
        toast.error(err.error || 'Failed to generate work order');
      }
    } catch (error) {
      console.error("[TakeoffViewPageHeader] Error generating work order", error);
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

  const workTypeLabel = getWorkTypeLabel(takeoff?.work_type);
  const breadcrumbCurrentLabel = takeoff?.is_pickup
    ? "Pickup takeoff"
    : workTypeLabel
      ? `${workTypeLabel} takeoff`
      : "Takeoff";

  return (
    <StickyPageHeader
      backLabel="Job"
      onBack={() => router.push(`/l/${jobId}`)}
      showBackButton={false}
      leftContent={
        <div className="flex items-center gap-2 overflow-x-auto text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push("/l/jobs")}
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            Jobs
          </button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <button
            type="button"
            onClick={() => router.push(`/l/${jobId}`)}
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            {jobName}
          </button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap font-medium text-foreground">
            {breadcrumbCurrentLabel}
          </span>
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
          {!takeoff?.is_pickup && isMptTakeoff && takeoff?.pickup_takeoff?.id && (
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
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleDownloadPdf}
            disabled={generatingPdf || (takeoff?.is_pickup && !pickupPdfReady)}
          >
            <Download className="h-3.5 w-3.5" />
            {generatingPdf
              ? "Generating…"
              : takeoff?.is_pickup
                ? "Download Pickup PDF"
                : "Download PDF"}
          </Button>
          {takeoff?.work_order_id ? (
            <>
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => router.push(`/l/jobs/${jobId}/work-orders/view/${takeoff.work_order_id}`)}>
                <ClipboardList className="h-3.5 w-3.5" />
                View Work Order
              </Button>
              {canGeneratePickupWorkOrder && (
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
