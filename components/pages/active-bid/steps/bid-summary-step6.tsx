import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { createActiveBid } from "@/lib/api-client";
import { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";

const step = {
    id: "step-5",
    name: "Bid Summary",
    description: "Review bid details",
    fields: [{ name: "summary", label: "Summary", type: "summary", placeholder: "Summary", hasToggle: false }],
};

const BidSummaryStep5 = ({
    currentStep,
    setCurrentStep
}: {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}) => {
    const router = useRouter();

    const {adminData, mptRental } = useEstimate();

    const [toggleStates, setToggleStates] = useState({
        laborRate: false,
        fringeRate: false,
        shopRate: false,
        winterShutdown: false,
    });


    const handleToggleChange = (field: string) => {
        setToggleStates((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
          setIsSubmitting(true);
          setError(null);
          
          // Update required fields to match database schema
          const requiredFields = [
            'contractNumber', 'owner', 'county', 'branch',
            'estimator', 'startDate', 'endDate', 'division',
            'project_days', 'base_rate', 'fringe_rate',
            'rt_miles', 'rt_travel', 'rated_hours',
            'nonrated_hours', 'total_hours', 'phases'
          ];
          
        //   const missingFields = requiredFields.filter(field => {
        //     const value = formData[field as keyof FormData];
        //     return value === undefined || value === null;
        //   });

        //   if (missingFields.length > 0) {
        //     setError(`Missing required fields: ${missingFields.join(', ')}`);
        //     setIsSubmitting(false);
        //     return;
        //   }
          await createActiveBid(adminData, mptRental)
          
          // Redirect to active bids page
          router.push("/jobs/active-bids");
          
        } catch (error) {
          console.error("Error creating bid:", error);
          setError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(6)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 5 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                            6 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                        }`}
                    >
                        6
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 6 && (
                    <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
                        <div className="space-y-8">
                            {/* <div className="max-w-xl grid grid-cols-2 gap-6">
                                {step.fields.map((field) => (
                                    <div key={field.name} className="space-y-2.5">
                                        <Label htmlFor={field.name} className="text-sm font-medium text-muted-foreground">
                                            {field.label}
                                        </Label>
                                        {field.type === "select" ? (
                                            <select
                                                id={field.name}
                                                value={String(formData[field.name] || "")}
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
                                                    checked={!!formData[field.name]}
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
                                                    value={String(formData[field.name] || "")}
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
                                                            checked={!!toggleStates[field.name]}
                                                            onChange={() => handleToggleChange(field.name)}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div> */}
                            <div className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setCurrentStep(5)}>
                                        Back
                                    </Button>
                                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BidSummaryStep5;
