"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HashIcon, LayersIcon, UserIcon, CalendarIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";

interface ActiveJobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onEdit?: (job: ActiveJob) => void;
  onNavigate?: (direction: 'up' | 'down') => void;
}

export function ActiveJobDetailsSheet({ open, onOpenChange, job, onEdit, onNavigate }: ActiveJobDetailsSheetProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && onNavigate) {
        e.preventDefault();
        onNavigate('down');
      } else if (e.key === 'ArrowUp' && onNavigate) {
        e.preventDefault();
        onNavigate('up');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onNavigate]);

  // Update dates when job changes
  useEffect(() => {
    if (job) {
      setStartDate(job.startDate ? new Date(job.startDate) : undefined)
      setEndDate(job.endDate ? new Date(job.endDate) : undefined)
    } else {
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }, [job])

  const handleEdit = () => {
    if (job && onEdit) {
      onOpenChange(false)  // Close the details sheet
      onEdit(job)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle>Job Details {job?.jobNumber ? `- ${job.jobNumber}` : ''}</SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">View Only</span>
          </div>
        </SheetHeader>
        
        {job && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>Job Number</Label>
                    <div className="relative">
                      <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.jobNumber || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Bid Number</Label>
                    <div className="relative">
                      <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.bidNumber || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>Project Status</Label>
                    <div className="relative">
                      <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.projectStatus || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Billing Status</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.billingStatus || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Contract Number</Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={job.contractNumber || ''} 
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
                      value={job.location || ''} 
                      className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>County</Label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.county || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Branch</Label>
                    <div className="relative">
                      <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.branch || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Contractor</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={job.contractor || ''} 
                      className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>Start Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={startDate ? startDate.toLocaleDateString() : ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>End Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={endDate ? endDate.toLocaleDateString() : ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>Labor Rate</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.laborRate || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                        tabIndex={-1}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Fringe Rate</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={job.fringeRate || ''} 
                        className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                        readOnly
                        disabled
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>MPT</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Checkbox 
                        checked={job?.mpt === true}
                        disabled
                        className="ml-9" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Rental</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Checkbox 
                        checked={job?.rental === true}
                        disabled
                        className="ml-9" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label>Perm. Signs</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Checkbox 
                        checked={job?.permSigns === true}
                        disabled
                        className="ml-9" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>Flagging</Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Checkbox 
                        checked={job?.flagging === true}
                        disabled
                        className="ml-9" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Sale Items</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      readOnly 
                      value={job?.saleItems ? String(job.saleItems) : ''} 
                      className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                      disabled
                      tabIndex={-1}
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Overdays</Label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={job.overdays || ''} 
                      className="pl-9 bg-gray-50 text-gray-700 border-gray-200" 
                      readOnly
                      disabled
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="p-6 pt-0">
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>
                  Edit
                </Button>
              </div>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 