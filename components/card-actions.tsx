"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState } from "react";
import { IconCalendar, IconDownload, IconUpload, IconPlus } from "@tabler/icons-react";
import { DateRange } from "react-day-picker";
import { ImportSheet } from "./import-sheet";

interface CardActionsProps {
    onCreateClick?: () => void;
    onImportSuccess?: () => void;
    createButtonLabel?: string;
    hideCalendar?: boolean;
    goUpActions?: boolean;
}

export function CardActions({
    onCreateClick,
    onImportSuccess,
    createButtonLabel = "Create Open Bid",
    hideCalendar = false,
    goUpActions = false,
}: CardActionsProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 0, 1),
        to: new Date(2024, 1, 30),
    });
    const [importOpen, setImportOpen] = useState(false);

    return (
        <div className={`flex items-center justify-between px-6 mb-1 w-full ${goUpActions ? "-mt-16" : ""}`}>
            <div className="flex items-center gap-2">
                {!hideCalendar && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                                <IconCalendar className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL d, y")} - {format(date.to, "LLL d, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL d, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                    <IconUpload className="h-4 w-4 mr-2" />
                    Import
                </Button>
                <ImportSheet open={importOpen} onOpenChange={setImportOpen} onImportSuccess={onImportSuccess} />
                <Button variant="outline" size="sm">
                    <IconDownload className="h-4 w-4 mr-2" />
                    Export
                </Button>
                <Button size="sm" onClick={onCreateClick}>
                    <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
                    {createButtonLabel}
                </Button>
            </div>
        </div>
    );
}
