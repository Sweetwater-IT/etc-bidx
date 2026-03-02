"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return <CreateTakeoffForm jobId={jobId} onBack={handleBack} />;
}