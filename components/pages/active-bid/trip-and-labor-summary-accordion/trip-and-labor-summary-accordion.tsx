import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { getTotalTripsPerPhase } from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";

interface TripAndLaborSummaryAccordionProps {
  currentStep: number;
  currentPhase: number;
}

const TripAndLaborSummaryAccordion = ({ currentStep, currentPhase }: TripAndLaborSummaryAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { mptRental, adminData } = useEstimate();

  useEffect(() => {
    if (currentStep === 4) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  const getPhaseValue = (key: string) => {
    if (!mptRental || !mptRental.phases || !mptRental.phases[currentPhase]) {
      return 0;
    }
    if (key === 'trips') {
      return getTotalTripsPerPhase(mptRental.phases[currentPhase])
    }
    return mptRental.phases[currentPhase][key] || 0;
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || Number.isNaN(value)) {
      return '';
    }
    return `$${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  // Memoize the current phase data
  const currentPhaseData = useMemo(() => {
    return mptRental?.phases?.[currentPhase] || { 
      days: 0, 
      personnel: 0, 
      numberTrucks: 0, 
      additionalRatedHours: 0, 
      additionalNonRatedHours: 0, 
      maintenanceTrips: 0 
    };
  }, [mptRental?.phases, currentPhase]);
  
  // Memoize cost calculations
  const { mobilizationCost, fuelCost, truckAndFuelCost } = useMemo(() => {
    if(mptRental.phases.length === 0){
      return {
        mobilizationCost: 0,
        fuelCost: 0,
        truckAndFuelCost: 0
      }
    }
    const mobilization = (currentPhaseData.numberTrucks || 0) * 
      getTotalTripsPerPhase(currentPhaseData) * 
      (mptRental?.dispatchFee || 0);
    
    const fuel = (((currentPhaseData.numberTrucks || 0) * 
      getTotalTripsPerPhase(currentPhaseData) * 2 *
      (adminData?.owMileage ?? 0)) / 
      (mptRental?.mpgPerTruck || 1)) * 
      (adminData?.fuelCostPerGallon ?? 0);
    
    return {
      mobilizationCost: mobilization,
      fuelCost: fuel,
      truckAndFuelCost: mobilization + fuel
    };
  }, [
    currentPhaseData, 
    mptRental?.dispatchFee, 
    mptRental?.mpgPerTruck,
    adminData?.owMileage, 
    adminData?.fuelCostPerGallon
  ]);

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Trip and Labor Summary - Phase {currentPhase + 1}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm mt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Days:</span>
                <span>{safeNumber(getPhaseValue("days"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Personnel:</span>
                <span>{safeNumber(getPhaseValue("personnel"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Trucks:</span>
                <span>{safeNumber(getPhaseValue("numberTrucks"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trips:</span>
                <span>{safeNumber(getPhaseValue("trips") + (getPhaseValue("maintenanceTrips") * 2))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rated Hours:</span>
                <span>{safeNumber(getPhaseValue("ratedHours") + getPhaseValue("additionalRatedHours")).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Non-Rated Hours:</span>
                <span>{safeNumber(getPhaseValue("nonRatedHours") + getPhaseValue("additionalNonRatedHours")).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobilization: </span>
                <span>{formatCurrency(mobilizationCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Cost:</span>
                <span>{formatCurrency(fuelCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Truck & Fuel Cost:</span>
                <span>{formatCurrency(truckAndFuelCost)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default TripAndLaborSummaryAccordion;