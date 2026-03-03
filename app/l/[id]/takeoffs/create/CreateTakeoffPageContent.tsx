"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [draftTakeoff, setDraftTakeoff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Always create a fresh draft takeoff on mount
  useEffect(() => {
    const initializeDraftTakeoff = async () => {
      try {
        // Always create new draft takeoff (ignore any existing drafts)
        const createResponse = await fetch('/api/takeoffs/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobId }),
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          setDraftTakeoff(createData.takeoff);
        } else {
          console.error('Failed to create draft takeoff');
          // Redirect back if we can't create a draft
          router.push(`/l/${jobId}`);
          return;
        }
      } catch (error) {
        console.error('Error initializing draft takeoff:', error);
        router.push(`/l/${jobId}`);
        return;
      } finally {
        setLoading(false);
      }
    };

    initializeDraftTakeoff();
  }, [jobId, router]);

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Initializing takeoff...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!draftTakeoff) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Failed to initialize takeoff</p>
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
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
      <div className="w-full px-6 py-6 flex-1">
        <CreateTakeoffForm
          jobId={jobId}
          onBack={handleBack}
          draftTakeoff={draftTakeoff}
        />
      </div>
    </div>
  );
}
