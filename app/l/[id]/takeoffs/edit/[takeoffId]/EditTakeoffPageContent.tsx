"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";

interface EditTakeoffPageContentProps {
  jobId: string;
  takeoffId: string;
}

export default function EditTakeoffPageContent({ jobId, takeoffId }: EditTakeoffPageContentProps) {
  const router = useRouter();
  const { data: takeoff, isLoading, error } = useTakeoffFromDB(takeoffId);

  const handleBack = () => {
    router.push(`/l/${jobId}/takeoffs/view/${takeoffId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
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
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
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
    <div className="w-full px-6 py-6 overflow-x-hidden">
      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        draftTakeoff={takeoff}
        mode="edit"
      />
    </div>
  );
}