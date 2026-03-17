"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft, FileText } from "lucide-react";

interface EditTakeoffPageContentProps {
  jobId: string;
  takeoffId: string;
}

export default function EditTakeoffPageContent({ jobId, takeoffId }: EditTakeoffPageContentProps) {
  const router = useRouter();
  const { data: takeoff, isLoading, error } = useTakeoffFromDB(takeoffId);
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.etcJobNumber?.toString() || dbJob?.projectInfo?.projectName || "Project";

  const handleBack = () => {
    router.push(`/l/${jobId}/takeoffs/view/${takeoffId}`);
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
    <div>
      <StickyPageHeader
        backLabel="Takeoff"
        onBack={handleBack}
        rightContent={
          <Button variant="outline" size="sm" onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoffId}`)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            View Takeoff
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
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
    </div>
  );
}
