"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { EyeIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type ActiveBid } from "@/data/active-bids";
import { type JobPageData } from "@/app/jobs/[job]/content";
import { format } from "date-fns";

interface ActiveBidDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid?: ActiveBid;
  onEdit?: (item: JobPageData) => void;
  onNavigate?: (direction: 'up' | 'down') => void;
}

export function ActiveBidDetailsSheet({ open, onOpenChange, bid, onEdit, onNavigate }: ActiveBidDetailsSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
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

  useEffect(() => {
    if (bid) {
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

  // Helper function to format display values
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    
    // Handle objects with main and secondary properties
    if (typeof value === 'object' && value !== null) {
      if ('main' in value) {
        return String(value.main);
      }
    }
    
    return String(value);
  };

  const formatCurrency = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle>Bid Details {bid?.originalContractNumber ? `- ${bid.originalContractNumber}` : ''}</SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1">View Only <EyeIcon className="h-3 w-3" /></span>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="space-y-5">
              {/* Letting Date */}
              <div className="space-y-1 w-full">
                <Label className="text-sm text-muted-foreground">Letting Date</Label>
                <div className="font-medium">
                  {lettingDate ? format(lettingDate, 'MM/dd/yyyy') : ''}
                </div>
              </div>

              {/* Contract Number */}
              <div className="space-y-1 w-full">
                <Label className="text-sm text-muted-foreground">Contract Number</Label>
                <div className="font-medium">
                  {formatValue(bid?.originalContractNumber)}
                </div>
              </div>

              {/* Contractor & Subcontractor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Contractor</Label>
                  <div className="font-medium">
                    {formatValue(bid?.contractor)}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Subcontractor</Label>
                  <div className="font-medium">
                    {formatValue(bid?.subcontractor)}
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-1 w-full">
                <Label className="text-sm text-muted-foreground">Owner</Label>
                <div className="font-medium">
                  {formatValue(bid?.owner)}
                </div>
              </div>

              {/* County & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">County</Label>
                  <div className="font-medium">
                    {formatValue(bid?.county)}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Branch</Label>
                  <div className="font-medium">
                    {formatValue(bid?.branch)}
                  </div>
                </div>
              </div>

              {/* Estimator & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Estimator</Label>
                  <div className="font-medium">
                    {formatValue(bid?.estimator)}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="font-medium">
                    {formatValue(bid?.status)}
                  </div>
                </div>
              </div>

              {/* Division */}
              <div className="space-y-1 w-full">
                <Label className="text-sm text-muted-foreground">Division</Label>
                <div className="font-medium">
                  {formatValue(bid?.division)}
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Start Date</Label>
                  <div className="font-medium">
                    {startDate ? format(startDate, 'MM/dd/yyyy') : ''}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">End Date</Label>
                  <div className="font-medium">
                    {endDate ? format(endDate, 'MM/dd/yyyy') : ''}
                  </div>
                </div>
              </div>

              {/* Project Days & Total Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Project Days</Label>
                  <div className="font-medium">
                    {formatValue(bid?.projectDays)}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Total Hours</Label>
                  <div className="font-medium">
                    {formatValue(bid?.totalHours)}
                  </div>
                </div>
              </div>

              {/* MPT Value & Perm Sign Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">MPT Value</Label>
                  <div className="font-medium">
                    {formatCurrency(bid?.mptValue)}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">Perm Sign Value</Label>
                  <div className="font-medium">
                    {formatCurrency(bid?.permSignValue)}
                  </div>
                </div>
              </div>

              {/* Rental Value */}
              <div className="space-y-1 w-full">
                <Label className="text-sm text-muted-foreground">Rental Value</Label>
                <div className="font-medium">
                  {formatCurrency(bid?.rentalValue)}
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