"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HashIcon, LayersIcon, UserIcon, CalendarIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon, AlertCircle } from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface EditActiveJobSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onSuccess?: () => void;
}

type Statuses = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

export function EditActiveJobSheet({ open, onOpenChange, job, onSuccess }: EditActiveJobSheetProps) {
  const [formData, setFormData] = useState<Partial<ActiveJob>>({});
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (job) {
      setFormData(job);
      setStartDate(job.startDate ? new Date(job.startDate) : undefined);
      setEndDate(job.endDate ? new Date(job.endDate) : undefined);
    } else {
      setFormData({});
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [job]);

  const handleInputChange = (field: keyof ActiveJob, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (field === 'startDate') {
      setStartDate(date);
      setFormData(prev => ({
        ...prev,
        startDate: date ? format(date, 'yyyy-MM-dd') : undefined
      }));
    } else {
      setEndDate(date);
      setFormData(prev => ({
        ...prev,
        endDate: date ? format(date, 'yyyy-MM-dd') : undefined
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        body: JSON.stringify({ formData }),
      });

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Edit Job: {job?.jobNumber}</SheetTitle>
        </SheetHeader>
        <Separator className='w-full -mt-2' />

        <div className="flex flex-col overflow-y-auto -mt-4">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Job Number</Label>
                  <div className="relative">
                    <Input
                      value={formData.jobNumber || ''}
                      onChange={(e) => handleInputChange('jobNumber', e.target.value)}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Bid Number</Label>
                  <Input
                    value={formData.bidNumber || ''}
                    onChange={(e) => handleInputChange('bidNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Project Status</Label>
                  <Select value={formData.projectStatus} onValueChange={(value) => handleInputChange('projectStatus', value as Statuses)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white w-full">
                      <SelectItem value="NOT_STARTED">NOT STARTED</SelectItem>
                      <SelectItem value='IN_PROGRESS'>IN PROGRESS</SelectItem>
                      <SelectItem value='COMPLETE'>COMPLETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Billing Status</Label>
                  <div className="relative">
                    <Select value={formData.billingStatus} onValueChange={(value) => handleInputChange('billingStatus', value as Statuses)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white w-full">
                        <SelectItem value="NOT_STARTED">NOT STARTED</SelectItem>
                        <SelectItem value='IN_PROGRESS'>IN PROGRESS</SelectItem>
                        <SelectItem value='COMPLETE'>COMPLETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Contract Number</Label>
                  <Input
                    value={formData.contractNumber || ''}
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2 w-full">
                  <Label>Location</Label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>County</Label>
                  <div className="relative">
                    <Input
                      value={formData.county ? (formData.county as any).main : ''}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Branch</Label>
                  <div className="relative">
                    <Input
                      value={formData.branch || ''}
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Contractor</Label>
                <Input
                  value={formData.contractor || ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>End Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Labor Rate</Label>
                  <Input
                    type="number"
                    value={formData.laborRate || ''}
                    onChange={(e) => handleInputChange('laborRate', e.target.value)}
                  />
                </div>

                <div className="space-y-2 w-full">
                  <Label>Fringe Rate</Label>
                  <Input
                    type="number"
                    value={formData.fringeRate || ''}
                    onChange={(e) => handleInputChange('fringeRate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Services Required</Label>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                  {job?.mpt && <span className="px-2 py-0.5 bg-gray-100 rounded-md">MPT</span>}
                  {job?.rental && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Equipment Rental</span>}
                  {job?.permSigns && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Perm Signs</span>}
                  {job?.flagging && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Equipment Rental</span>}
                  {job?.saleItems && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Sale</span>}
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Overdays</Label>
                <div className="flex items-center mt-2 text-sm gap-2 text-amber-500">
                  <AlertCircle size={14} />
                  <span>
                    This job is overdays
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end p-6 pt-0 gap-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 