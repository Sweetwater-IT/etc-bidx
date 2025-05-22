import { Suspense } from "react"
import { PortalPageContent } from "./content"

export default async function JobPage({ params }: any) {
  const resolvedParams = await params
  const page = resolvedParams.page

  return (
    <Suspense fallback={null}>
      <PortalPageContent page={page} />
    </Suspense>
  )
}