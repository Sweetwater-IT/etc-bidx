"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HashIcon, CalendarIcon, UserIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { type ActiveBid } from "@/data/active-bids";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatUTCDate";

interface EditActiveBidSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid?: ActiveBid;
}

export function EditActiveBidSheet({ open, onOpenChange, bid }: EditActiveBidSheetProps) {
  const [formData, setFormData] = useState<Partial<ActiveBid>>({});
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (bid) {
      setFormData({
        ...bid,
        mptValue: bid.mptValue || '',
        permSignValue: bid.permSignValue || '',
        rentalValue: bid.rentalValue || ''
      });
      try {
        setLettingDate((bid.lettingDate && bid.lettingDate !== '-') ? 
          new Date(bid.lettingDate) : undefined);
      } catch (e) {
        console.error("Invalid letting date format:", bid.lettingDate);
        setLettingDate(undefined);
      }
      
      try {
        setStartDate((bid.startDate && bid.startDate !== '-') ? 
          new Date(bid.startDate) : undefined);
      } catch (e) {
        console.error("Invalid start date format:", bid.startDate);
        setStartDate(undefined);
      }
      
      try {
        setEndDate((bid.endDate && bid.endDate !== '-') ? 
          new Date(bid.endDate) : undefined);
      } catch (e) {
        console.error("Invalid end date format:", bid.endDate);
        setEndDate(undefined);
      }
    } else {
      setFormData({});
      setLettingDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [bid]);

  const handleInputChange = (field: keyof ActiveBid, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: 'lettingDate' | 'startDate' | 'endDate', date: Date | undefined) => {
    if (field === 'lettingDate') setLettingDate(date);
    if (field === 'startDate') setStartDate(date);
    if (field === 'endDate') setEndDate(date);
    
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.toISOString() : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement the API call to update the bid
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating bid:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Edit Bid</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="space-y-2 w-full">
                <Label>Letting Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lettingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lettingDate ? formatDate(lettingDate) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={lettingDate}
                      onSelect={(date) => handleDateChange('lettingDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 w-full">
                <Label>Contract Number</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={typeof formData.contractNumber === 'string' ? formData.contractNumber : formData.contractNumber?.main || ''} 
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2 w-full">
                  <Label>Subcontractor</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.subcontractor || ''} 
                      onChange={(e) => handleInputChange('subcontractor', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Owner</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.owner || ''} 
                    onChange={(e) => handleInputChange('owner', e.target.value)}
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
                      value={typeof formData.county === 'string' ? formData.county : formData.county?.main || ''} 
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Estimator</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.estimator || ''} 
                      onChange={(e) => handleInputChange('estimator', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Status</Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.status || ''} 
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Division</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.division || ''} 
                    onChange={(e) => handleInputChange('division', e.target.value)}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? formatDate(startDate) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => handleDateChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 w-full">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? formatDate(endDate) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => handleDateChange('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Project Days</Label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      value={formData.projectDays || ''} 
                      onChange={(e) => handleInputChange('projectDays', parseInt(e.target.value) || 0)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Total Hours</Label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      value={formData.totalHours || ''} 
                      onChange={(e) => handleInputChange('totalHours', parseInt(e.target.value) || 0)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>MPT Value</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="text"
                      value={formData.mptValue || ''} 
                      onChange={(e) => handleInputChange('mptValue', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Perm Sign Value</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="text"
                      value={formData.permSignValue || ''} 
                      onChange={(e) => handleInputChange('permSignValue', e.target.value)}
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Rental Value</Label>
                <div className="relative">
                  <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="text"
                    value={formData.rentalValue || ''} 
                    onChange={(e) => handleInputChange('rentalValue', e.target.value)}
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
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
