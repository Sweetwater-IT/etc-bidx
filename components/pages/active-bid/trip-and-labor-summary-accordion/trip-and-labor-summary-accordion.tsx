import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";

interface TripAndLaborSummaryAccordionProps {
  currentStep: number;
}

// Helper function to safely convert values to numbers
const safeNumber = (value: any): number => {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const TripAndLaborSummaryAccordion = ({ currentStep }: TripAndLaborSummaryAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { mptRental } = useEstimate();
  const currentPhase = 0;

  useEffect(() => {
    if (currentStep === 3) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  const getPhaseValue = (key: string) => {
    if (!mptRental || !mptRental.phases || !mptRental.phases[currentPhase]) {
      return 0;
    }
    return mptRental.phases[currentPhase][key] || 0;
  };

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Trip and Labor Summary</h3>
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default TripAndLaborSummaryAccordion;
