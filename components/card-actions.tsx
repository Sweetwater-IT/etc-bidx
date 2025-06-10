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
  showFilterButton?: boolean
  showFilters?: boolean
  setShowFilters?: React.Dispatch<React.SetStateAction<boolean>>
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
  hideImportExport,
  showFilterButton = false,
  showFilters,
  setShowFilters,
}: CardActionsProps) {

  const [importOpen, setImportOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

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
    e.preventDefault();
    e.stopPropagation();

    if (setDate) {
      // Reset to default range (beginning of year to today)
      const today = new Date();
      const beginningOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year

      setDate({
        from: undefined,
        to: undefined
      });

      // Close calendar after a brief delay to ensure state updates
      setTimeout(() => {
        setCalendarOpen(false);
      }, 0);
    }
  };

  // Get default date range for display
  const getDefaultDateRange = () => {
    const today = new Date();
    return `Jan 1, ${today.getFullYear()} - ${today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
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
                      <div onClick={handleClearDate} className="ml-2 hover:bg-gray-200 rounded p-1 z-10 flex-shrink-0">
                        <IconX className="h-3 w-3" />
                      </div>
                    </span>
                  ) : (
                    <span>
                      {format(date.from, "LLL d, y")} - {date.to ? format(date.to, 'LLL d, y') : format(new Date(), 'LLL d, y')}
                    </span>
                  )
                ) : (
                  <span>{getDefaultDateRange()}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                key={`${date?.from?.getTime()}-${date?.to?.getTime()}`}
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
        {showFilterButton && setShowFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
            >
              <path
                d="M11.75 3.75L15 0.5H0L3.25 3.75V11.25L5.5 13.5V14.5H9.5V13.5L11.75 11.25V3.75ZM3.81966 4.25L11.1803 4.25L8.75 1.81966L8.75 11.75L6.25 11.75L6.25 1.81966L3.81966 4.25Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
            Filter
          </Button>
        )}
        <Button size="sm" onClick={onCreateClick}>
          <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
          {createButtonLabel}
        </Button>
      </div>
    </div>
  )
}