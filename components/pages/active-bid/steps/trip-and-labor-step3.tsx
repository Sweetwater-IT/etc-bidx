"use client";

import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import React from "react";

const step = {
  id: "step-3",
  name: "Trip and Labor",
  description: "Input trip and labor details",
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
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getInputValue = (field: keyof FormData): string => {
    const value = formData[field];
    if (value === undefined || value === null) return "";
    return String(value);
  };

  const handleNext = () => {
    setCurrentStep(4);
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
      
      </div>
    </div>
  );
};

export default TripAndLaborStep3;
