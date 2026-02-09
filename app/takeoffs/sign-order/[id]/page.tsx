import React from 'react'
import { Toaster } from '@/components/ui/sonner'
import SignShopContent from './SignShopContent'
import { EstimateProvider } from '@/contexts/EstimateContext'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default async function SignOrderTrackerPage({params} : {params : any}) {

  const resolvedParams = await params
  const id = resolvedParams.id

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 68)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as React.CSSProperties
      }
    >
      <Toaster />
      <AppSidebar variant='inset' />
      <SidebarInset>
        <EstimateProvider>
          <SignShopContent id={id}/>
        </EstimateProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
