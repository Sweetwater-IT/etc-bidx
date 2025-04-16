import { Suspense } from "react"
import { JobPageContent } from "./content"


interface JobPageProps {
  params: {
    job: string
  }
}

export default function JobPage({ params }: JobPageProps) {
  return (
    <Suspense fallback={null}>
      <JobPageContent job={params.job} />
    </Suspense>
  )
} 