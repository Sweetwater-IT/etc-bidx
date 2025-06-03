"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import React, { useState } from "react";
import { IconCalendar, IconDownload, IconUpload, IconPlus, IconX } from "@tabler/icons-react";
import { DateRange } from "react-day-picker";
import { ImportSheet } from "./import-sheet";
import { formatDate } from "@/lib/formatUTCDate";

interface CardActionsProps {
  date?: DateRange | undefined
  setDate?: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  onCreateClick?: () => void
  onImportSuccess?: () => void
  createButtonLabel?: string
  hideCalendar?: boolean
  goUpActions?: boolean
  importType?: 'available-jobs' | 'active-bids'
  hideImportExport?: boolean
}

export function CardActions({ 
  date, 
  setDate, 
  onCreateClick, 
  onImportSuccess, 
  createButtonLabel = "Create Open Bid", 
  hideCalendar = false, 
  goUpActions = false, 
  importType = 'available-jobs',
  hideImportExport 
}: CardActionsProps) {

  const [importOpen, setImportOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Handle date selection
  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    if (setDate) {
      setDate(selectedDate);
      // Only close calendar if both dates are selected or date is cleared
      if (!selectedDate || (selectedDate.from && selectedDate.to)) {
        setCalendarOpen(false);
      }
    }
  };

  // Handle clearing the date range
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setDate) {
      // Reset to default range (today to 7 days from now)
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      
      setDate({
        from: today,
        to: sevenDaysFromNow
      });
    }
  };

  return (
    <div className={`flex items-center justify-between px-6 mb-1 w-full ${goUpActions ? "-mt-16" : ""}`}>
      <div className="flex items-center gap-2">
        {!hideCalendar && setDate && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal relative">
                <IconCalendar className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <span className="flex items-center justify-between w-full">
                      <span>{format(date.from, "LLL d, y")} - {format(date.to, "LLL d, y")}</span>
                      <IconX 
                        className="h-4 w-4 ml-2 hover:bg-gray-200 rounded" 
                        onClick={handleClearDate}
                      />
                    </span>
                  ) : (
                    <span>
                      {format(date.from, "LLL d, y")} - Select end date
                    </span>
                  )
                ) : (
                  <span>Jan 1, 2025 - {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric', 
                    year: 'numeric'
                  })}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                initialFocus 
                mode="range" 
                defaultMonth={date?.from} 
                selected={date} 
                onSelect={handleDateSelect} 
                numberOfMonths={2} 
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!hideImportExport && (
          <>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <IconUpload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ImportSheet 
              open={importOpen} 
              onOpenChange={setImportOpen} 
              onImportSuccess={onImportSuccess}
              importType={importType}
            />
            <Button variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        )}
        <Button size="sm" onClick={onCreateClick}>
          <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
          {createButtonLabel}
        </Button>
      </div>
    </div>
  )
}