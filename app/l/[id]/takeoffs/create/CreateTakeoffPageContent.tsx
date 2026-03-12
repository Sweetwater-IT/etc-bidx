"use client";

import { useRouter } from "next/navigation";
import { CreateTakeoffForm } from "@/components/CreateTakeoffForm";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useJobFromDB } from "@/hooks/useJobFromDB";

export default function CreateTakeoffPageContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.projectName || "Project";

  const handleBack = () => {
    router.push(`/l/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageTitleBlock
          title="Create Takeoff"
          description={`Create a new takeoff for ${jobName}. Configure work types, materials, and scheduling details.`}
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
