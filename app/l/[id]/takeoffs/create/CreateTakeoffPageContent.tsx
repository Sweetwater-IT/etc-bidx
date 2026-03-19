"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { useJobFromDB } from "@/hooks/useJobFromDB";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        backLabel="Job"
      />
    </div>
  );
}
