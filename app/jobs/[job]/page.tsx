import { notFound } from "next/navigation"
import { JobPageContent } from "./content"

const VALID_JOB_PAGES = new Set(["available", "active-bids", "active-jobs"])

export default function JobPage({
  params,
}: {
  params: { job: string }
}) {
  const job = params.job

  if (!VALID_JOB_PAGES.has(job)) {
    notFound()
  }

  return <JobPageContent job={job} />
}
