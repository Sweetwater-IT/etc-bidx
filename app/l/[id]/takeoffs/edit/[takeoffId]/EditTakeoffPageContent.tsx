"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { FileText } from "lucide-react";

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
      <div className="w-full px-6 pt-6 pb-6 flex-1 space-y-6 overflow-x-hidden">
        {/* ─── Page Title Bar ─── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                Edit Takeoff
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {jobName} · Edit takeoff details, work types, materials, and scheduling information.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CreateTakeoffForm
            jobId={jobId}
            onBack={handleBack}
            draftTakeoff={takeoff}
            backLabel="Takeoff"
            mode="edit"
          />
        </div>
      </div>
    </div>
  );
}
