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
    <div className="mx-auto w-full max-w-7xl min-[1921px]:max-w-[calc(100vw-272px-48px)] px-4 py-8">
      <CreateTakeoffForm
        jobId={jobId}
        onBack={handleBack}
        backLabel="Job"
      />
    </div>
  );
}
