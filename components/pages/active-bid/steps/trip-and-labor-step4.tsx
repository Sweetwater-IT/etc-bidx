"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
const step = {
  id: "step-4",
  name: "Trip and Labor",
  description: "Input trip and labor details",
};

const TripAndLaborStep4 = ({
  currentStep,
  setCurrentStep,
  currentPhase
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  currentPhase;
}) => {
  const { mptRental, dispatch } = useEstimate();
  const currentPhaseData = mptRental?.phases?.[currentPhase] || { days: 0, personnel: 0, numberTrucks: 0, additionalRatedHours: 0, additionalNonRatedHours: 0, maintenanceTrips: 0 };

  const handleInputChange = (name: any, value: number | undefined) => {
    dispatch({
      type: "UPDATE_MPT_PHASE_TRIP_AND_LABOR",
      payload: {
        key: name,
        value: value ?? 0,
        phase: currentPhase,
      },
    });
  };

  const handleNext = () => {
    setCurrentStep(5);
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(4)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 4 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
              4 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            )}
          >
            4
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name} - Phase {currentPhase + 1}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 4 && (
          <div className="mt-3 mb-6 ml-12">
            <div className="space-y-8">
              {/* Personnel Section */}
              <div>
                <div className="text-base font-semibold mb-4 text-muted-foreground">Personnel</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Number of Personnel
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentPhaseData.personnel || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "personnel",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Number of Personnel"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Number of Trucks
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentPhaseData.numberTrucks || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "numberTrucks",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Number of Trucks"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div>
                <div className="text-base font-semibold mb-4 mt-5 text-muted-foreground">Additional Inputs</div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Additional Trips
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentPhaseData.maintenanceTrips || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "maintenanceTrips",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Trips"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Additional Rated Hours
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={currentPhaseData.additionalRatedHours || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "additionalRatedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Rated Hours"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Additional Non-Rated Hours
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={currentPhaseData.additionalNonRatedHours || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "additionalNonRatedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Non-Rated Hours"
                    />
                  </div>
                </div>
              </div>
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
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

export default TripAndLaborStep4;