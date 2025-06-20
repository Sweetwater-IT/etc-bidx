import { AppSidebar } from '@/components/app-sidebar'
import { CardActions } from '@/components/card-actions'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'
import JobPageContent from './JobPageContent'

const page = async ({params} : {params : any}) => {

  const resolvedParams = await params;
  const id = resolvedParams.id

  return (
    <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 68)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
  >
    <AppSidebar variant="inset" />
    <SidebarInset>
      <SiteHeader customTitle={`Job ${id}`} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <JobPageContent id={id}/>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  )
}

export default page
