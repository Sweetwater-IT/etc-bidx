"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HashIcon, LayersIcon, UserIcon, CalendarIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon, EyeIcon, PencilIcon } from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";
import { Select, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectContent } from "@radix-ui/react-select";
import { toast } from "sonner";

interface ActiveJobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onEdit?: (job: ActiveJob) => void;
  onNavigate?: (direction: 'up' | 'down') => void;
  loadActiveJobs: () => void;
}

type Statuses = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

export function ActiveJobDetailsSheet({ open, onOpenChange, job, onEdit, onNavigate, loadActiveJobs }: ActiveJobDetailsSheetProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const [localProjectStatus, setLocalProjectStatus] = useState<Statuses>()
  const [localBillingStatus, setLocalBillingStatus] = useState<Statuses>()

  useEffect(() => {
    setLocalProjectStatus(job?.projectStatus ? job.projectStatus as Statuses : 'NOT_STARTED');
    setLocalBillingStatus(job?.billingStatus ? job.billingStatus as Statuses : 'NOT_STARTED')
  }, [job?.projectStatus, job?.billingStatus])

  const [editingProjectStatus, setEditingProjectStatus] = useState<boolean>(false)
  const [editingBillingStatus, setEditingBillingStatus] = useState<boolean>(false)

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

  const handleStatusChange = async (newStatus: Statuses, type: 'project_status' | 'billing_status', jobNumber: string) => {
    const response = await fetch('/api/jobs', {
      method: 'PATCH',
      body: JSON.stringify({ newStatus, type, jobNumber }),
    });

    if (!response.ok) {
      const err = await response.json()
      toast.error('Status not correctly updated: ' + err.message)
    }
    else {
      toast.success(`${type === 'billing_status' ? 'Billing status' : 'Project status'} correctly updated.`)
      type === 'project_status' ? setEditingProjectStatus(false) : setEditingBillingStatus(false) 
      type === 'project_status' ? setLocalProjectStatus(newStatus) : setLocalBillingStatus(newStatus)
      loadActiveJobs();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle>Job Details {job?.jobNumber ? `- ${job.jobNumber}` : ''}</SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1">View Only <EyeIcon className="h-3 w-3" /></span>
          </div>
        </SheetHeader>

        {job && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Job Number</Label>
                    <div className="font-medium">
                      {job.jobNumber || ''}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Bid Number</Label>
                    <div className="font-medium">
                      {job.bidNumber || ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Project Status</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full focus:outline-none"
                        onClick={() => setEditingProjectStatus(!editingProjectStatus)}
                        tabIndex={-1}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    {editingProjectStatus ?
                      <Select value={localProjectStatus} onValueChange={(value) => handleStatusChange(value as Statuses, 'project_status', job.jobNumber)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white w-full">
                          <SelectItem value="NOT_STARTED">NOT STARTED</SelectItem>
                          <SelectItem value='IN_PROGRESS'>IN PROGRESS</SelectItem>
                          <SelectItem value='COMPLETE'>COMPLETE</SelectItem>
                        </SelectContent>
                      </Select>
                      : <div className="font-medium">
                        {localProjectStatus || ''}
                      </div>}
                  </div>

                  <div className="w-full space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Billing Status</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full focus:outline-none"
                        onClick={() => setEditingBillingStatus(!editingBillingStatus)}
                        tabIndex={-1}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    {editingBillingStatus ?
                      <Select value={localBillingStatus} onValueChange={(value) => handleStatusChange(value as Statuses, 'billing_status', job.jobNumber)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white w-full">
                          <SelectItem value="NOT_STARTED">NOT STARTED</SelectItem>
                          <SelectItem value='IN_PROGRESS'>IN PROGRESS</SelectItem>
                          <SelectItem value='COMPLETE'>COMPLETE</SelectItem>
                        </SelectContent>
                      </Select>
                      : <div className="font-medium">
                        {localBillingStatus || ''}
                      </div>}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Contract Number</Label>
                  <div className="font-medium">
                    {job.contractNumber || ''}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <div className="font-medium">
                    {job.location || ''}
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

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Contractor</Label>
                  <div className="font-medium">
                    {job.contractor || ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Start Date</Label>
                    <div className="font-medium">
                      {startDate ? startDate.toLocaleDateString() : ''}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">End Date</Label>
                    <div className="font-medium">
                      {endDate ? endDate.toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Labor Rate</Label>
                    <div className="font-medium">
                      {job.laborRate || ''}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Fringe Rate</Label>
                    <div className="font-medium">
                      {job.fringeRate || ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">MPT</Label>
                    <div className="font-medium">
                      {job?.mpt === true ? 'Yes' : 'No'}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">Rental</Label>
                    <div className="font-medium">
                      {job?.rental === true ? 'Yes' : 'No'}
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