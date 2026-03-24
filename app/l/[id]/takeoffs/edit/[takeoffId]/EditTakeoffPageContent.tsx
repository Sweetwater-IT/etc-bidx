"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { formatTakeoffPageTitle } from "@/app/l/utils/pageTitles";

interface EditTakeoffPageContentProps {
  jobId: string;
  takeoffId: string;
}

export default function EditTakeoffPageContent({ jobId, takeoffId }: EditTakeoffPageContentProps) {
  const router = useRouter();
  const { data: takeoff, isLoading, error } = useTakeoffFromDB(takeoffId);
  const { data: dbJob } = useJobFromDB(jobId);
  const jobLabel = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";
  
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

  return (
    <div className="mx-auto w-full max-w-7xl min-[1921px]:max-w-[calc(100vw-272px-48px)] px-4 py-8 space-y-6">
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
            <BreadcrumbPage>{jobLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        draftTakeoff={takeoff}
        backLabel="Takeoff"
        mode="edit"
        pageTitle={formatTakeoffPageTitle({
          workType: takeoff?.work_type,
          isPickup: takeoff?.is_pickup,
          jobLabel,
        })}
        pageDescription={`Edit takeoff details, work types, materials, and scheduling information for ${jobLabel}.`}
      />
    </div>
  );
}
