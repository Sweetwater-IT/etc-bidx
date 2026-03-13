"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { useJobFromDB } from "@/hooks/useJobFromDB";

interface EditTakeoffPageContentProps {
  jobId: string;
  takeoffId: string;
}

export default function EditTakeoffPageContent({ jobId, takeoffId }: EditTakeoffPageContentProps) {
  const router = useRouter();
  const { data: takeoff, isLoading, error } = useTakeoffFromDB(takeoffId);
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.projectName || "Project";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageTitleBlock
          title="Edit Takeoff"
          description={`Edit takeoff details for ${jobName}. Update work types, materials, and scheduling information.`}
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
