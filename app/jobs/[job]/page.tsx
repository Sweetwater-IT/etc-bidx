import { Suspense } from "react"
import { JobPageContent } from "./content"

export default async function JobPage({ params }: any) {
  const resolvedParams = await params
  const job = resolvedParams.job

  return (
    <Suspense fallback={null}>
      <JobPageContent job={job} />
    </Suspense>
  )
}