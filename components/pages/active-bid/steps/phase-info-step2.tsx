"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { Step } from "@/types/IStep";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { safeNumber } from "@/lib/safe-number";

const step: Step = {
    id: "step-2",
    name: "Phase Information",
    description: "Configure phase details and schedule",
    fields: [],
};

// Calculate days between dates (abstracted function)
const calculateDays = (start: Date, end: Date): number => {
    console.log('running calculated days with start date:', start, end)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Include both start and end date
    return diffDays;
};

const PhaseInfoStep2 = ({
    currentStep,
    setCurrentStep,
    currentPhase
}: {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    currentPhase: number;
}) => {
    const { mptRental, dispatch, editable } = useEstimate();

    // Update phase dates in context
    const handleDateChange = (value: Date | undefined, name: 'startDate' | 'endDate') => {
        if (!value) return;

        // Update context
        dispatch({
            type: 'UPDATE_MPT_PHASE_START_END',
            payload: { key: name, value, phase: currentPhase },
        });

        if (mptRental.phases[currentPhase].startDate && (mptRental.phases[currentPhase].endDate || (name === 'endDate' && !!value))) {
            const days = name === 'startDate' ? calculateDays(value, mptRental.phases[currentPhase].endDate!) : 
            calculateDays(mptRental.phases[currentPhase].startDate, value)

            dispatch({
                type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
                payload: { key: 'days', value: days, phase: currentPhase },
            });
        }
    };

    // Update phase name in context
    const handlePhaseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: 'UPDATE_PHASE_NAME',
            payload: { value: e.target.value, phase: currentPhase },
        });
    };

    const handleNext = () => {
        setCurrentStep(3);
    };

    const setEndDateFromDays = (days: number) => {
        if (!mptRental.phases[currentPhase].startDate ) return;

        const startDate = mptRental.phases[currentPhase].startDate
        // Calculate new end date
        const newEndDate = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));

        // Update context
        dispatch({
            type: 'UPDATE_MPT_PHASE_START_END',
            payload: { key: 'endDate', value: newEndDate, phase: currentPhase },
        });

        // Update days in context
        dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: { key: 'days', value: days, phase: currentPhase },
        });
    };

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(2)}
                    className={cn(
                        "group flex w-full items-start gap-4 py-4 text-left",
                        currentStep === 2 ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    <div
                        className={cn(
                            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
                            2 <= currentStep
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground bg-background"
                        )}
                    >
                        2
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">
                            {step.description}
                        </div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 2 && mptRental.phases.length > 0 && (
                    <div className="mt-2 mb-6 ml-12">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                                disabled={!editable}
                                                aria-disabled={!editable}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {mptRental.phases[currentPhase].startDate ? (
                                                    format(mptRental.phases[currentPhase].startDate, "PPP")
                                                ) : (
                                                    <span>Select start date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={mptRental.phases[currentPhase].startDate ?? undefined}
                                                onSelect={(date) => handleDateChange(date, 'startDate')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                                disabled={!editable}
                                                aria-disabled={!editable}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {mptRental.phases[currentPhase].endDate ? (
                                                    format(mptRental.phases[currentPhase].endDate, "PPP")
                                                ) : (
                                                    <span>Select end date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={mptRental.phases[currentPhase].endDate ?? undefined}
                                                onSelect={(date) => handleDateChange(date, 'endDate')}
                                                initialFocus
                                                disabled={(date) =>
                                                    mptRental.phases[currentPhase].startDate ? date < mptRental.phases[currentPhase].startDate : false
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phaseName">Phase Name (Optional)</Label>
                                    <Input
                                        id="phaseName"
                                        value={mptRental.phases[currentPhase].name}
                                        onChange={handlePhaseNameChange}
                                        placeholder={`Phase ${currentPhase + 1}`}
                                        disabled={!editable}
                                        aria-disabled={!editable}
                                    />
                                </div>
                            </div>

                            {mptRental.phases[currentPhase].startDate && (
                                <div className="bg-muted p-4 rounded-md">
                                    <div className="flex flex-col gap-4">
                                        <div className="text-sm font-medium">
                                            Set end date as number of days out from start date:
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                className="px-3 py-1 cursor-pointer hover:bg-primary"
                                                onClick={() => editable ? setEndDateFromDays(30): ''}
                                            >
                                                30
                                            </Badge>
                                            <Badge
                                                className="px-3 py-1 cursor-pointer hover:bg-primary"
                                                onClick={() => editable ? setEndDateFromDays(60) : ''}
                                            >
                                                60
                                            </Badge>
                                            <Badge
                                                className="px-3 py-1 cursor-pointer hover:bg-primary"
                                                onClick={() => editable ? setEndDateFromDays(90) : ''}
                                            >
                                                90
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="w-20"
                                                    onChange={(e) => setEndDateFromDays(safeNumber(parseInt(e.target.value)))}
                                                    placeholder="Days"
                                                    type="number"
                                                    min="1"
                                                    disabled={!editable}
                                                    aria-disabled={!editable}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    Back
                                </Button>
                                <Button onClick={handleNext}>Next</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseInfoStep2;