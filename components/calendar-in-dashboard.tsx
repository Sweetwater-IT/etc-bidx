"use client";
import { IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const CalendarInDashboard = () => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 0, 1),
        to: new Date(2024, 1, 30),
    });

    return (
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
    );
};

export default CalendarInDashboard;
