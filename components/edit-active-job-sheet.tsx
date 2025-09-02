"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import JobNumberPicker from "./SelectAvaiableJobsNumbers";

interface EditActiveJobSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onSuccess?: () => void;
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date for input:', e);
    return '';
  }
}

type Statuses = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

export function EditActiveJobSheet({ open, onOpenChange, job, onSuccess }: EditActiveJobSheetProps) {
  const [formData, setFormData] = useState<Partial<ActiveJob>>({ newJobNumber: job?.jobNumber ?? '' });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isValidJobNumber, setIsValidJobNumber] = useState<boolean>(true);
  const [validatingExistJob, setvalidatingExistJob] = useState(false)

  const [digits, setDigits] = useState({
    laborRate: "000",
    fringeRate: "000",
  });

  function formatDecimal(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2)
  }

  function handleNextDigits(current: string, inputType: string, data: string): string {
    let digits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
      const candidate = current + data;
      if (parseInt(candidate, 10) <= 99999) digits = candidate;
    } else if (inputType === "deleteContentBackward") {
      digits = current.slice(0, -1);
    }

    return digits.padStart(3, "0");
  }

  useEffect(() => {
    if (job) {
      setFormData({
        ...job
      });
      setStartDate(job.startDate ? new Date(job.startDate) : undefined);
      setEndDate(job.endDate ? new Date(job.endDate) : undefined);

      setDigits({
        laborRate: Math.round((job.countyJson?.laborRate || 0) * 100)
          .toString()
          .padStart(3, "0"),
        fringeRate: Math.round((job.countyJson?.fringeRate || 0) * 100)
          .toString()
          .padStart(3, "0"),
      });
    } else {
      setFormData({ newJobNumber: '' });
      setStartDate(undefined);
      setEndDate(undefined);
      setDigits({ laborRate: "000", fringeRate: "000" });
    }
  }, [job]);

  const handleInputChange = (field: keyof ActiveJob, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRateChange = (field: 'laborRate' | 'fringeRate', value: string) => {
    const numValue = Number(value);
    setFormData(prev => ({
      ...prev,
      countyJson: prev.countyJson ? {
        ...prev.countyJson,
        [field]: numValue
      } : {
        [field]: numValue
      } as any
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', dateString: string) => {
    if (field === 'startDate') {
      const date = dateString ? new Date(dateString + 'T00:00:00') : undefined;
      setStartDate(date);
      setFormData(prev => ({
        ...prev,
        startDate: dateString || undefined
      }));
    } else {
      const date = dateString ? new Date(dateString + 'T00:00:00') : undefined;
      setEndDate(date);
      setFormData(prev => ({
        ...prev,
        endDate: dateString || undefined
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
        <div className="flex flex-col gap-2 relative z-10 bg-background">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>Edit Job: {job?.newJobNumber ? job.newJobNumber : job?.jobNumber}</SheetTitle>
          </SheetHeader>
          <Separator className='w-full -mt-2' />
        </div>

        <div className="flex flex-col overflow-y-auto h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Job Number</Label>
                  <JobNumberPicker
                    customJobNumber={formData.newJobNumber}
                    setCustomJobNumber={(value: any) => handleInputChange('newJobNumber', value)}
                    validJobNumber={(isValid: boolean) => setIsValidJobNumber(isValid)}
                    initialValueNumber={(job?.jobNumber || '').split('-').pop() || ''}
                    setvalidatingExistJob={setvalidatingExistJob}
                    validatingExistJob={validatingExistJob}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
                    <Select value={formData.branch} onValueChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        countyJson: {
                          ...prev.countyJson,
                          branch: e
                        } as any,
                        branch: e
                      }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hatfield">Hatfield</SelectItem>
                        <SelectItem value='Turbotville'>Turbotville</SelectItem>
                        <SelectItem value='Bedford'>Bedford</SelectItem>
                      </SelectContent>
                    </Select>
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
                      value={startDate ? formatDateForInput(startDate) : ''}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label>End Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate ? formatDateForInput(endDate) : ''}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Labor Rate</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="^\\d*(\\.\\d{0,2})?$"
                    value={`$ ${formatDecimal(digits.laborRate)}`}
                    onChange={(e) => {
                      const ev = e.nativeEvent as InputEvent;
                      const { inputType } = ev;
                      const data = (ev.data || "").replace(/\$/g, "");

                      const nextDigits = handleNextDigits(digits.laborRate, inputType, data);
                      setDigits((prev) => ({ ...prev, laborRate: nextDigits }));

                      const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2);
                      handleRateChange('laborRate', formatted);
                    }}
                  />
                </div>

                <div className="space-y-2 w-full">
                  <Label>Fringe Rate</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="^\\d*(\\.\\d{0,2})?$"
                    value={`$ ${formatDecimal(digits.fringeRate)}`}
                    onChange={(e) => {
                      const ev = e.nativeEvent as InputEvent;
                      const { inputType } = ev;
                      const data = (ev.data || "").replace(/\$/g, "");

                      const nextDigits = handleNextDigits(digits.fringeRate, inputType, data);
                      setDigits((prev) => ({ ...prev, fringeRate: nextDigits }));

                      const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2);
                      handleRateChange('fringeRate', formatted);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1 w-full">
                <Label className="font-medium">Services Required</Label>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                  {job?.wonBidItems.map((wbi, index) => <span key={index} className="px-2 py-0.5 bg-gray-100 rounded-md">{wbi}</span>)}
                </div>
              </div>

              {job?.overdays && job?.overdays > 0 && <div className="space-y-2 w-full">
                <Label>Overdays</Label>
                <div className="flex items-center mt-2 text-sm gap-2 text-amber-500">
                  <AlertCircle size={14} />
                  <span>
                    This job is overdays
                  </span>
                </div>
              </div>}
            </div>
          </div>
          <div className="flex justify-end p-6 pt-0 gap-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button disabled={!isValidJobNumber || validatingExistJob} onClick={handleSubmit}>
              {validatingExistJob ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}