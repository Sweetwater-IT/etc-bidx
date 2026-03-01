"use client";

import { useParams } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPage() {
  const params = useParams();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;

  if (!jobId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid job ID</p>
        </div>
      </div>
    );
  }

  return <CreateTakeoffForm jobId={jobId} />;
}