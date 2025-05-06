// MutcdSignsStep3.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Step } from "@/types/IStep";
import { useEstimate } from "@/contexts/EstimateContext";
import SignList from "../signs/sign-list";
import AddSignControl from "../signs/add-sign-control";

const step: Step = {
  id: "step-3",
  name: "MUTCD Signs",
  description: "Select and configure MUTCD signs",
  fields: [],
};

const MutcdSignsStep3 = ({
  currentStep,
  setCurrentStep,
  currentPhase
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  currentPhase: number;
}) => {
  const { mptRental } = useEstimate();
  const [isAddingSign, setIsAddingSign] = useState(false);
  
  // Initialize isAddingSign based on current phase signs
  useEffect(() => {
    const currentSigns = mptRental?.phases?.[currentPhase]?.signs || [];
    setIsAddingSign(currentSigns.length === 0);
  }, [mptRental, currentPhase]);

  const handleNext = () => {
    setCurrentStep(4);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(3)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 2 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
              3 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            )}
          >
            3
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name} - Phase {currentPhase + 1}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 3 && (
          <div className="mt-2 mb-6 ml-12">
            <div className="space-y-6">
              {/* Signs List */}
              <SignList 
                currentPhase={currentPhase} 
                isAddingSign={isAddingSign}
                setIsAddingSign={setIsAddingSign}
              />

              {/* Add Sign Control */}
              <AddSignControl 
                isAddingSign={isAddingSign}
                setIsAddingSign={setIsAddingSign}
                currentPhase={currentPhase}
              />

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
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

export default MutcdSignsStep3;