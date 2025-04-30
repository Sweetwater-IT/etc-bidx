"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { Phase } from "@/types/MPTEquipment";
import { Clock, DollarSign, CarFront, Truck, User } from "lucide-react";
import { getNonRatedHoursPerPhase, getRatedHoursPerPhase, getTotalTripsPerPhase } from "@/lib/mptRentalHelperFunctions";

// Helper functions based on the provided Mantine component
const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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
  
  const [ratedHours, setRatedHours] = useState<number>(0);
  const [productivityTrips, setProductivityTrips] = useState<number>(0);
  const [nonRatedHours, setNonRatedHours] = useState<number>(0);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  
  useEffect(() => {
    if (mptRental && mptRental.phases && mptRental.phases[currentPhase]) {
      const phase = mptRental.phases[currentPhase];
      setRatedHours(getRatedHoursPerPhase(phase));
      setProductivityTrips(getTotalTripsPerPhase(phase) - (safeNumber(phase.maintenanceTrips) * 2));
      setNonRatedHours(getNonRatedHoursPerPhase(adminData, phase));
      setTotalTrips(getTotalTripsPerPhase(phase));
    }
  }, [
    adminData?.owTravelTimeMins,
    mptRental?.phases[currentPhase]?.personnel,
    mptRental?.phases[currentPhase]?.numberTrucks,
    mptRental?.phases[currentPhase]?.maintenanceTrips,
    mptRental?.phases[currentPhase]?.standardEquipment?.fourFootTypeIII,
    mptRental?.phases[currentPhase]?.standardEquipment?.post,
    mptRental?.phases[currentPhase]?.standardEquipment?.hStand
  ]);
  
  useEffect(() => {
    if (!mptRental || !mptRental.phases || !mptRental.phases[currentPhase]) {
      return;
    }
    
    const personnel = mptRental.phases[currentPhase].personnel || 0;
    const defaultTrucks = personnel > 2 ? Math.ceil(personnel / 2) : 1;
    
    dispatch({
      type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
      payload: { 
        key: 'numberTrucks', 
        value: defaultTrucks, 
        phase: currentPhase 
      }
    });
  }, [mptRental?.phases[currentPhase]?.personnel]);
  
  const handleInputChange = (name: keyof Phase, value: number) => {
    dispatch({
      type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
      payload: { 
        key: name, 
        value: value, 
        phase: currentPhase 
      },
    });
  };

  const handleNext = () => {
    setCurrentStep(4);
  };
  
  const handleBack = () => {
    setCurrentStep(2);
  };
  
  // Helper function to safely get values from MPT rental phase
  const getPhaseValue = (key: keyof Phase, defaultValue: any = 0) => {
    if (!mptRental || !mptRental.phases || !mptRental.phases[currentPhase]) {
      return defaultValue;
    }
    
    const value = mptRental.phases[currentPhase][key];
    return value !== undefined && value !== null ? value : defaultValue;
  };
  
  // Calculate derived values
  const calculateMobilization = () => {
    const numberTrucks = getPhaseValue('numberTrucks', 0);
    const dispatchFee = mptRental?.dispatchFee || 0;
    return safeNumber(numberTrucks * totalTrips * dispatchFee).toFixed(1);
  };
  
  const calculateFuelCost = () => {
    const numberTrucks = getPhaseValue('numberTrucks', 0);
    const owMileage = adminData?.owMileage || 0;
    const mpgPerTruck = mptRental?.mpgPerTruck || 1; // Avoid division by zero
    const fuelCostPerGallon = adminData?.fuelCostPerGallon || 0;
    
    return safeNumber(
      ((numberTrucks * totalTrips * 2 * owMileage) / mpgPerTruck) * fuelCostPerGallon
    ).toFixed(1);
  };
  
  const calculateTotalTruckFuelCosts = () => {
    const mobilization = parseFloat(calculateMobilization());
    const fuelCost = parseFloat(calculateFuelCost());
    return safeNumber(mobilization + fuelCost).toFixed(1);
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
          <div className="mt-2 mb-6 ml-12">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Row 1 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Number of Days
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={getPhaseValue('days', 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Number of Personnel
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={getPhaseValue('personnel', 0)}
                    onChange={(e) => handleInputChange('personnel', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Truck className="mr-2 h-4 w-4" />
                    Number of Trucks
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={getPhaseValue('numberTrucks', 0)}
                    onChange={(e) => handleInputChange('numberTrucks', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                {/* Row 2 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <CarFront className="mr-2 h-4 w-4" />
                    Trips
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(productivityTrips)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <CarFront className="mr-2 h-4 w-4" />
                    Additional Trips
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={getPhaseValue('maintenanceTrips', 0)}
                    onChange={(e) => handleInputChange('maintenanceTrips', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <CarFront className="mr-2 h-4 w-4" />
                    Total Trips
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(totalTrips)}
                  />
                </div>
                
                {/* Row 3 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Rated Hours
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(ratedHours).toFixed(1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Additional Rated Hours
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={getPhaseValue('additionalRatedHours', 0)}
                    onChange={(e) => handleInputChange('additionalRatedHours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Total Rated Hours
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(ratedHours + getPhaseValue('additionalRatedHours', 0)).toFixed(1)}
                  />
                </div>
                
                {/* Row 4 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Non-Rated Hours
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(nonRatedHours).toFixed(1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Additional Non-Rated Hours
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={getPhaseValue('additionalNonRatedHours', 0)}
                    onChange={(e) => handleInputChange('additionalNonRatedHours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Total Non-Rated Hours
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={safeNumber(nonRatedHours + getPhaseValue('additionalNonRatedHours', 0)).toFixed(1)}
                  />
                </div>
                
                {/* Row 5 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Mobilization
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={calculateMobilization()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Fuel Cost
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={calculateFuelCost()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Truck & Fuel Costs
                  </Label>
                  <Input
                    type="number"
                    disabled
                    value={calculateTotalTruckFuelCosts()}
                  />
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripAndLaborStep3;