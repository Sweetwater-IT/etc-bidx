"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  if (!jobId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid job ID</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return <CreateTakeoffForm jobId={jobId} onBack={handleBack} />;
}
