"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HashIcon, CalendarIcon, UserIcon, MapPinIcon, BuildingIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { type ActiveBid } from "@/data/active-bids";
import { type JobPageData } from "@/app/jobs/[job]/content";
import { format } from "date-fns";

interface ActiveBidDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid?: ActiveBid;
  onEdit?: (item: JobPageData) => void;
}

export function ActiveBidDetailsSheet({ open, onOpenChange, bid, onEdit }: ActiveBidDetailsSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (bid) {
      console.log(bid);
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
      setLettingDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [bid]);

  const handleEdit = () => {
    if (bid && onEdit) {
      onOpenChange(false);
      onEdit(bid);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Bid Details</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="space-y-2 w-full">
                <Label>Letting Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={lettingDate ? format(lettingDate, 'MM/dd/yyyy') : ''} 
                    className="pl-9" 
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Contract Number</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={bid?.contractNumber || ''} 
                    className="pl-9" 
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Contractor</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.contractor || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Subcontractor</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.subcontractor || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Owner</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={bid?.owner || ''} 
                    className="pl-9" 
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>County</Label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.county || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Branch</Label>
                  <div className="relative">
                    <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.branch || ''} 
                      className="pl-9" 
                      readOnly
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
                      value={bid?.estimator || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Status</Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.status || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Division</Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={bid?.division || ''} 
                    className="pl-9" 
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={startDate ? format(startDate, 'MM/dd/yyyy') : ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>End Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={endDate ? format(endDate, 'MM/dd/yyyy') : ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Project Days</Label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.projectDays || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Total Hours</Label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.totalHours || ''} 
                      className="pl-9" 
                      readOnly
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
                      value={bid?.mptValue || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Perm Sign Value</Label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={bid?.permSignValue || ''} 
                      className="pl-9" 
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Rental Value</Label>
                <div className="relative">
                  <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={bid?.rentalValue || ''} 
                    className="pl-9" 
                    readOnly
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
      </SheetContent>
    </Sheet>
  );
} 