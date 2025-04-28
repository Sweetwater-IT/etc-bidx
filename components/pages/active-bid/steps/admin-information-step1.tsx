import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";

interface Step {
    id: string;
    name: string;
    description: string;
    fields: InputData[]
}

interface InputData {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number' | 'toggle'
    placeholder?: string
    options?: any[]
    hasToggle?: boolean
}

const step: Step = {
    id: "step-1",
    name: "Admin Information",
    description: "Basic information about the bid",
    fields: [
        { name: "contractNumber", label: "Contract Number*", type: "text", placeholder: "Contract Number" },
        { name: "estimator", label: "Estimator*", type: "select", placeholder: "Estimator" },
        //Potential to-do: add owners as a table in db to allow for new owners to be added from control panel
        //for now we'll hardcode them
        { name: "owner", label: "Owner*", type: "select", placeholder: "Choose", options: ['PENNDOT', 'TURNPIKE', 'SEPTA', 'PRIVATE', 'OTHER'] },
        { name: "county", label: "County*", type: "select", placeholder: "Choose County" },
        { name: "township", label: "Township*", type: "text", placeholder: "Township" },
        { name: "division", label: "Division*", type: "select", placeholder: "Choose", options: ['PUBLIC', 'PRIVATE'] },
        { name: "lettingDate", label: "Letting Date*", type: "date", placeholder: "Select date" },
        { name: "startDate", label: "Start Date*", type: "date", placeholder: "Select date" },
        { name: "endDate", label: "End Date*", type: "date", placeholder: "Select date" },
        { name: "srRoute", label: "SR Route*", type: "text", placeholder: "SR Route" },
        { name: "dbePercentage", label: "DBE %*", type: "text", placeholder: "DBE %" },
        { name: "workType", label: "Work Type", type: "select", placeholder: "Choose", options: ['RATED', 'NON-RATED'] },
        { name: "oneWayTravelTime", label: "One Way Travel Time (Mins)*", type: "number", placeholder: "One Way Travel Time (Mins)" },
        { name: "oneWayMileage", label: "One Way Mileage*", type: "number", placeholder: "One Way Mileage" },
        { name: "dieselCost", label: "Diesel Cost Per Gallon*", type: "number", placeholder: "Diesel Cost Per Gallon" },
        { name: "laborRate", label: "Labor Rate*", type: "number", placeholder: "0", hasToggle: true },
        { name: "fringeRate", label: "Fringe Rate*", type: "number", placeholder: "0", hasToggle: true },
        { name: "shopRate", label: "Shop Rate*", type: "number", placeholder: "0", hasToggle: true },
        { name: "winterShutdown", label: "Winter Shutdown", type: "toggle" },
    ],
};

const AdminInformationStep1 = ({
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

    //fetch users and county info
    // useEffect(() => {

    // }, [])

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(1)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 1 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${1 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                            }`}
                    >
                        1
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 1 && (
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
                                                {field.options && field.options.length > 0 ?
                                                    [field.placeholder, ...field.options].map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                                )) : <option value={field.placeholder}>{field.placeholder}</option>
                                                }
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
                            <div className="flex justify-end">
                                <Button onClick={() => setCurrentStep(2)}>Next</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInformationStep1;
