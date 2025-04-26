"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";

const step = {
    id: "step-3",
    name: "Trip and Labor",
    description: "Input trip and labor details",
    fields: [
        { name: "numberOfDays", label: "Number of Days", type: "number", placeholder: "Number of Days", hasToggle: false },
        { name: "numberOfPersonnel", label: "Number of Personnel", type: "number", placeholder: "Number of Personnel", hasToggle: false },
        { name: "numberOfTrucks", label: "Number of Trucks", type: "number", placeholder: "Number of Trucks", hasToggle: false },
        { name: "trips", label: "Trips", type: "number", placeholder: "Trips", hasToggle: false },
        { name: "additionalTrips", label: "Additional Trips", type: "number", placeholder: "Additional Trips", hasToggle: false },
        { name: "totalTrips", label: "Total Trips", type: "number", placeholder: "Total Trips", hasToggle: false },
        { name: "ratedHours", label: "Rated Hours", type: "number", placeholder: "Rated Hours", hasToggle: false },
        { name: "additionalRatedHours", label: "Additional Rated Hours", type: "number", placeholder: "Additional Rated Hours", hasToggle: false },
        { name: "totalRatedHours", label: "Total Rated Hours", type: "number", placeholder: "Total Rated Hours", hasToggle: false },
        { name: "nonRatedHours", label: "Non-Rated Hours", type: "number", placeholder: "Non-Rated Hours", hasToggle: false },
        {
            name: "additionalNonRatedHours",
            label: "Additional Non-Rated Hours",
            type: "number",
            placeholder: "Additional Non-Rated Hours",
            hasToggle: false,
        },
        {
            name: "totalNonRatedHours",
            label: "Total Non-Rated Hours",
            type: "number",
            placeholder: "Total Non-Rated Hours",
            hasToggle: false,
        },
        { name: "mobilization", label: "Mobilization", type: "number", placeholder: "Mobilization", hasToggle: false },
        { name: "fuelCost", label: "Fuel Cost", type: "number", placeholder: "Fuel Cost", hasToggle: false },
        { name: "truckFuelCost", label: "Truck & Fuel Cost", type: "number", placeholder: "Truck & Fuel Cost", hasToggle: false },
    ],
};

const TripAndLaborStep3 = ({
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
}: {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
    const [toggleStates, setToggleStates] = useState({
        laborRate: false,
        fringeRate: false,
        shopRate: false,
        winterShutdown: false,
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleToggleChange = (field: string) => {
        setToggleStates((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(3)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 3 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                            3 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                        }`}
                    >
                        3
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 3 && (
                    <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
                        <div className="space-y-8">
                            <div className="max-w-xl grid grid-cols-2 gap-6">
                                {step.fields.map((field) => (
                                    <div key={field.name} className="space-y-2.5">
                                        <Label htmlFor={field.name} className="text-sm font-medium text-muted-foreground">
                                            {field.label}
                                        </Label>
                                        {field.type === "select" ? (
                                            <select
                                                id={field.name}
                                                value={formData[field.name] || ""}
                                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">{field.placeholder}</option>
                                            </select>
                                        ) : field.type === "toggle" ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={field.name}
                                                    checked={toggleStates[field.name]}
                                                    onChange={() => handleToggleChange(field.name)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={field.name}>{field.label}</Label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Input
                                                    id={field.name}
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={formData[field.name] || ""}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="h-10"
                                                />
                                                {field.hasToggle && (
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`${field.name}-toggle`} className="text-sm text-muted-foreground">
                                                            Use this rate?
                                                        </Label>
                                                        <input
                                                            id={`${field.name}-toggle`}
                                                            type="checkbox"
                                                            checked={toggleStates[field.name]}
                                                            onChange={() => handleToggleChange(field.name)}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                    Back
                                </Button>
                                <Button onClick={() => setCurrentStep(4)}>Next</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripAndLaborStep3;
