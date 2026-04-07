'use client'

import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { SignOrderBuilderProvider } from '@/contexts/SignOrderBuilderContext'
import SignOrderViewContent from './SignOrderViewContent'

export default function SignOrderTrackerPage() {
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
        <SignOrderBuilderProvider>
          <SignOrderViewContent />
        </SignOrderBuilderProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
