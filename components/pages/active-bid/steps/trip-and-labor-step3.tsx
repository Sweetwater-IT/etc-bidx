"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import {
  calculateTruckAndFuelCostSummary,
  getNonRatedHoursPerPhase,
  getRatedHoursPerPhase,
  getTotalTripsPerPhase,
} from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";

const step = {
  id: "step-3",
  name: "Trip and Labor",
  description: "Input trip and labor details",
};

const TripAndLaborStep3 = ({
  currentStep,
  setCurrentStep,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { mptRental, adminData, dispatch } = useEstimate();
  const currentPhase = 0; // Using first phase as default, adjust as needed

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
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(3)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 3 ? "text-foreground" : "text-muted-foreground"
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
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 3 && (
          <div className="mt-3 mb-6 ml-12">
            <div className="space-y-8">
              {/* Personnel Section */}
              <div>
                <div className="text-base font-semibold mb-4 text-muted-foreground">Personnel</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Number of Days
                    </Label>
                    <Input
                      type="number"
                      value={mptRental.phases[0].days || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "days",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Number of Days"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Number of Personnel
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={mptRental.phases[0].personnel || ''}
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
                      value={mptRental.phases[0].numberTrucks || ''}
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
                <div className="text-base font-semibold mb-4 mt-5 text-muted-foreground">Trips</div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">Trips</Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "trips",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Trips"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Additional Trips
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={mptRental.phases[0].maintenanceTrips || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "maintenanceTrips",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Trips"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <Label className="flex items-center text-muted-foreground">
                      Total Trips:
                    </Label>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {getTotalTripsPerPhase(mptRental.phases[0])}
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              {/* Hours Section */}
              <div>
                <div className="text-base font-semibold mb-4 mt-5 text-muted-foreground">Hours</div>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Rated Hours
                    </Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "ratedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Rated Hours"
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
                      value={mptRental.phases[0].additionalRatedHours || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "additionalRatedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Rated Hours"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <Label className="flex items-center text-muted-foreground">
                      Total Rated Hours:
                    </Label>
                    <div className="h-10 flex items-center not-last:pl-1 text-sm text-muted-foreground">
                      {safeNumber(
                        getRatedHoursPerPhase(mptRental.phases[0])
                      )?.toFixed(1) || ''}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Non-Rated Hours
                    </Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "nonRatedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Non-Rated Hours"
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
                      value={mptRental.phases[0].additionalNonRatedHours || ''}
                      onChange={(e) =>
                        handleInputChange(
                          "additionalNonRatedHours",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Additional Non-Rated Hours"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <Label className="flex items-center text-muted-foreground">
                      Total Non-Rated Hours:
                    </Label>
                    <div className="h-10 flex items-center not-last:pl-1 text-sm text-muted-foreground">
                      {safeNumber(getNonRatedHoursPerPhase(adminData, mptRental.phases[0])
                      )?.toFixed(1) || ''}
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              {/* Mobilization Section */}
              <div>
                <div className="text-base font-semibold mb-4 mt-5 text-muted-foreground">Mobilization</div>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Mobilization
                    </Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "mobilization",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Mobilization"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">Fuel Cost</Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "fuelCost",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Fuel Cost"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center mb-2 text-muted-foreground">
                      Truck & Fuel Cost
                    </Label>
                    <Input
                      type="number"
                      value={''}
                      onChange={(e) =>
                        handleInputChange(
                          "truckAndFuelCost",
                          e.target.value === "" ? undefined : parseFloat(e.target.value)
                        )
                      }
                      placeholder="Truck & Fuel Cost"
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

export default TripAndLaborStep3;
