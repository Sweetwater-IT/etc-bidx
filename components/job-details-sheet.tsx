"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { AvailableJob } from "@/data/available-jobs"
import { EyeIcon } from "lucide-react"
import { formatDate } from "@/lib/formatUTCDate"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
interface JobDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: AvailableJob
  onEdit?: (job: AvailableJob) => void
}

export function JobDetailsSheet({ open, onOpenChange, job, onEdit, onNavigate }: JobDetailsSheetProps & {
  onNavigate?: (direction: 'up' | 'down') => void
}) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && onNavigate) {
        e.preventDefault()
        onNavigate('down')
      } else if (e.key === 'ArrowUp' && onNavigate) {
        e.preventDefault()
        onNavigate('up')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onNavigate])

  const handleEdit = () => {
    if (job && onEdit) {
      onOpenChange(false)  // Close the details sheet
      onEdit(job)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-0">
          <div className="flex items-center p-6 pb-2">
            <SheetTitle>Available Job Details {job?.contractNumber ? `- ${job.contractNumber}` : ''}</SheetTitle>
          </div>
          <Separator/>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="-mt-2 space-y-6 p-6">
          <div className='w-full flex justify-between items-start'>
                <div className="flex flex-col gap-y-2">
                <Label className="font-medium">Status</Label>
                <Badge variant={`${job?.status === 'Unset' ? 'secondary' : job?.status === 'Bid' ? 'successful' : 'destructive' }`}>
                  {job?.status || '-'}
                </Badge>
                </div>
                <span className="text-xs h-1/2 bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1">View Only <EyeIcon className="h-3 w-3" /></span>
              </div>
            {/* Contract Number and Requestor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 w-full">
                <Label className="font-medium">Contract Number</Label>
                <div className="text-sm text-muted-foreground uppercase">
                  {job?.contractNumber || '-'}
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Requestor</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.requestor || '-'}
                </div>
              </div>
            </div>

            {/* Owner and Platform */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 w-full">
                <Label className="font-medium">Owner</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.owner || '-'}
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Platform</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.platform || '-'}
                </div>
              </div>
            </div>

            {/* Letting Date and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 w-full">
                <Label className="font-medium">Letting Date</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.lettingDate ? formatDate(job.lettingDate) : '-'}
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Due Date</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.dueDate ? formatDate(job.dueDate) : '-'}
                </div>
              </div>
            </div>

            {/* County and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 w-full">
                <Label className="font-medium">County</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.county.main || '-'}
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Location</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.location || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 w-full">
                <Label className="font-medium">DBE %</Label>
                <div className="text-sm text-muted-foreground">
                  %{job?.dbe || '-'}
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">State Route</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.stateRoute || '-'}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job?.status === 'No Bid' && <div className="space-y-1 w-full">
                <Label className="font-medium">No Bid Reason</Label>
                <div className="text-sm text-muted-foreground">
                  {job?.noBidReason || '-'}
                </div>
              </div>}
            {/* Branch */}
            <div className="space-y-1 w-1/2">
              <Label className="font-medium">Branch</Label>
              <div className="text-sm text-muted-foreground">
                {job?.county.secondary || '-'}
              </div>
            </div>
            </div>

            {/* Services Required */}
            <div className="space-y-1 w-full">
              <Label className="font-medium">Services Required</Label>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                {job?.services["MPT"] && <span className="px-2 py-0.5 bg-gray-100 rounded-md">MPT</span>}
                {job?.services["Flagging"] && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Flagging</span>}
                {job?.services["Perm Signs"] && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Perm Signs</span>}
                {job?.services["Equipment Rental"] && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Equipment Rental</span>}
                {job?.services["Other"] && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Other</span>}
                {!job?.services && '-'}
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-4 py-4 border-t flex gap-2">
          <div className="flex justify-between gap-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 