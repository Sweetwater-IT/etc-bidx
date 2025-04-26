"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HashIcon, LayersIcon, UserIcon, CalendarIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";
import { format } from "date-fns";

interface EditActiveJobSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onSuccess?: () => void;
}

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
      // TODO: Implement the API call to update the job
      console.log('Submitting form data:', formData);
      
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
          <SheetTitle>Edit Job</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Job Number</Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.jobNumber || ''} 
                      onChange={(e) => handleInputChange('jobNumber', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Bid Number</Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.bidNumber || ''} 
                      onChange={(e) => handleInputChange('bidNumber', e.target.value)}
                      className="pl-9" 
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
                      value={formData.projectStatus || ''} 
                      onChange={(e) => handleInputChange('projectStatus', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Billing Status</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.billingStatus || ''} 
                      onChange={(e) => handleInputChange('billingStatus', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Contract Number</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.contractNumber || ''} 
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Location</Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.location || ''} 
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>County</Label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.county || ''} 
                      onChange={(e) => handleInputChange('county', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Branch</Label>
                  <div className="relative">
                    <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.branch || ''} 
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Contractor</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.contractor || ''} 
                    onChange={(e) => handleInputChange('contractor', e.target.value)}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date"
                      value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>End Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date"
                      value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                      className="pl-9" 
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
                      type="number"
                      value={formData.laborRate || ''} 
                      onChange={(e) => handleInputChange('laborRate', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Fringe Rate</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      value={formData.fringeRate || ''} 
                      onChange={(e) => handleInputChange('fringeRate', e.target.value)}
                      className="pl-9" 
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
                      checked={formData.mpt === true}
                      onCheckedChange={(checked) => handleInputChange('mpt', checked === true)}
                      className="ml-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Rental</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Checkbox 
                      checked={formData.rental === true}
                      onCheckedChange={(checked) => handleInputChange('rental', checked === true)}
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
                      checked={formData.permSigns === true}
                      onCheckedChange={(checked) => handleInputChange('permSigns', checked === true)}
                      className="ml-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Flagging</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Checkbox 
                      checked={formData.flagging === true}
                      onCheckedChange={(checked) => handleInputChange('flagging', checked === true)}
                      className="ml-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Sale Items</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.saleItems || false}
                    onCheckedChange={(checked) => handleInputChange('saleItems', checked === true)}
                  />
                  <span className="text-sm text-muted-foreground">Include sale items</span>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Overdays</Label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    value={formData.overdays || ''} 
                    onChange={(e) => handleInputChange('overdays', e.target.value)}
                    className="pl-9" 
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
              <Button onClick={handleSubmit}>
                Save Changes
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
} 