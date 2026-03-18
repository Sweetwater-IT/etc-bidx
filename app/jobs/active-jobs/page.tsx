import { JobPageContent } from "@/app/jobs/[job]/content"

export default function ActiveJobsPage() {
  return <JobPageContent job="active-jobs" includeLayout={false} />
}
