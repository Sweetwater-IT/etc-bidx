"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { toast } from "sonner";

const WORK_TYPES = [
  { value: "MPT", label: "MPT" },
  { value: "PERMANENT_SIGNS", label: "Permanent Sign" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENTAL", label: "Rental" },
];

interface EditTakeoffPageContentProps {
  jobId: string;
  takeoffId: string;
}

export default function EditTakeoffPageContent({ jobId, takeoffId }: EditTakeoffPageContentProps) {
  const router = useRouter();
  const { data: takeoff, isLoading, error } = useTakeoffFromDB(takeoffId);
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";
  
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleBack = () => {
    router.push(`/l/${jobId}/takeoffs/view/${takeoffId}`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading takeoff...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !takeoff) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Failed to load takeoff</p>
            <button
              onClick={handleBack}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (!takeoff) return "Edit Takeoff";

    if (takeoff.is_pickup) {
      return `Edit Pickup Takeoff for ${jobName}`;
    }

    // Get work type from the takeoff
    const workTypeLabel = takeoff.work_type || "";
    return workTypeLabel ? `Edit ${workTypeLabel} Takeoff for ${jobName}` : `Edit Takeoff for ${jobName}`;
  };

  return (
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
            <BreadcrumbLink href={`/l/${jobId}/takeoffs/view/${takeoffId}`}>Takeoff</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{jobName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageTitleBlock
        title={getTitle()}
        description={`Edit takeoff details, work types, materials, and scheduling information for ${jobName}.`}
      />

      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        draftTakeoff={takeoff}
        backLabel="Takeoff"
        mode="edit"
      />
    </div>
  );
}
