"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon, UserIcon, HashIcon, MapPinIcon, LayersIcon, GlobeIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react"

interface JobDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: {
    id: number
    contractNumber: string
    status: string
    requestor: string
    owner: string
    lettingDate: string | null
    dueDate: string | null
    county: string
    branch: string
    createdAt: string
    location: string
    platform: string
  }
  onEdit?: (job: {
    id: number
    contractNumber: string
    status: string
    requestor: string
    owner: string
    lettingDate: string | null
    dueDate: string | null
    county: string
    branch: string
    createdAt: string
    location: string
    platform: string
  }) => void
}

export function JobDetailsSheet({ open, onOpenChange, job, onEdit, onNavigate }: JobDetailsSheetProps & {
  onNavigate?: (direction: 'up' | 'down') => void
}) {
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  
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

  // Update dates when job changes
  useEffect(() => {
    if (job) {
      setLettingDate(job.lettingDate ? new Date(job.lettingDate) : undefined)
      setDueDate(job.dueDate ? new Date(job.dueDate) : undefined)
    } else {
      setLettingDate(undefined)
      setDueDate(undefined)
    }
  }, [job])

  const handleEdit = () => {
    if (job && onEdit) {
      onOpenChange(false)  // Close the details sheet
      onEdit(job)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle>Job Details {job?.contractNumber ? `- ${job.contractNumber}` : ''}</SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">View Only</span>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label>Contract Number</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={job?.contractNumber || ''} 
                    className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Status</Label>
                <div className="relative">
                  <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={job?.status || ''} 
                    className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Requestor</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.requestor || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Owner</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.owner || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>County</Label>
              <div className="relative">
                <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.county || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Branch</Label>
              <div className="relative">
                <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.branch || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Location</Label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.location || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Platform</Label>
              <div className="relative">
                <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={job?.platform || ''} 
                  className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Letting Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                    disabled
                  >
                    <span>
                      {lettingDate ? format(lettingDate, "PPP") : "Not set"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
              </Popover>
            </div>

            <div className="space-y-2 w-full">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                    disabled
                  >
                    <span>
                      {dueDate ? format(dueDate, "PPP") : "Not set"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
              </Popover>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-0">
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