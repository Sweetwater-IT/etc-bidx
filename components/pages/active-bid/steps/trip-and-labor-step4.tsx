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
  currentPhase
}: {
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

  return (
    <div>
      <div className="relative">
        {/* Collapsible Content */}
          <div className="mt-3 mb-6">
            <div className="space-y-8">
              {/* Personnel Section */}
              <div>
                <div className="text-base font-semibold mb-4 text-muted-foreground">Personnel</div>
                <div className="grid grid-cols-3  gap-4">
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
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-base font-semibold mb-4 mt-5 text-muted-foreground">Additional Inputs</div>
                <div className="grid grid-cols-3 gap-4">
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
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default TripAndLaborStep4;
