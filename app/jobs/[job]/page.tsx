import { notFound } from "next/navigation"
import { JobPageContent } from "./content"

const VALID_JOB_PAGES = new Set(["available", "active-bids", "active-jobs"])

export default async function JobPage({
  params,
}: {
  params: Promise<{ job: string }>
}) {
  const { job } = await params

  if (!VALID_JOB_PAGES.has(job)) {
    notFound()
  }

  return <JobPageContent job={job} />
}
