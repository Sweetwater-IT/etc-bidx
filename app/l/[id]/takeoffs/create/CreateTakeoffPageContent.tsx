"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useJobFromDB } from "@/hooks/useJobFromDB";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.projectName || "Untitled Project";

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
      <div className="w-full px-6 py-6 flex-1 overflow-x-hidden">
        <PageTitleBlock
          title={`New Takeoff for ${jobName}`}
          description="Create a new material takeoff for this project."
        />
        <CreateTakeoffForm
          jobId={jobId}
          onBack={handleBack}
          backLabel="Job"
        />
      </div>
    </div>
  );
}
