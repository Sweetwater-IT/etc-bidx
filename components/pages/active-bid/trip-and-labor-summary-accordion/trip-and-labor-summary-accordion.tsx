import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FormData } from "@/app/active-bid/page";
interface TripAndLaborSummaryAccordionProps {
  currentStep: number;
  formData: FormData;
}

const TripAndLaborSummaryAccordion = ({ currentStep, formData }: TripAndLaborSummaryAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep === 3) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

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
                <span>{String(formData.numberOfDays || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Personnel:</span>
                <span>{String(formData.numberOfPersonnel || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Trucks:</span>
                <span>{String(formData.numberOfTrucks || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trips:</span>
                <span>{Number(formData.trips || 0) + Number(formData.additionalTrips || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rated Hours:</span>
                <span>{Number(formData.ratedHours || 0) + Number(formData.additionalRatedHours || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Non-Rated Hours:</span>
                <span>{Number(formData.nonRatedHours || 0) + Number(formData.additionalNonRatedHours || 0)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default TripAndLaborSummaryAccordion;
