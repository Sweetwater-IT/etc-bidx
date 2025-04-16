import { Suspense } from "react"
import { JobPageContent } from "./content"

export default async function JobPage({ params }: any) {
  return (
    <Suspense fallback={null}>
      <JobPageContent job={params.job} />
    </Suspense>
  )
}