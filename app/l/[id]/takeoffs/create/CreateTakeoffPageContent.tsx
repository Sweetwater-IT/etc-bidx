"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
      <div className="w-full px-6 py-6 flex-1">
        <CreateTakeoffForm jobId={jobId} onBack={handleBack} />
      </div>
    </div>
  );
}
