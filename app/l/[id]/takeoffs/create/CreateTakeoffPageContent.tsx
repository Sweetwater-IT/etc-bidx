"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        backLabel="Job"
      />
    </div>
  );
}
