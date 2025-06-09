import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import { useEstimate } from "@/contexts/EstimateContext";
import { sortSignsBySecondary } from "@/lib/sortSignsBySecondary";

interface SignSummaryAccordionProps {
  currentStep: number;
  currentPhase: number;
}

const SignSummaryAccordion = ({ currentStep, currentPhase }: SignSummaryAccordionProps) => {
  const { mptRental } = useEstimate();
  const [value, setValue] = useState<string[]>([]);

  const signs: (PrimarySign | SecondarySign)[] = 
    mptRental.phases && 
    mptRental.phases.length > 0 && 
    mptRental.phases[currentPhase].signs 
      ? sortSignsBySecondary(mptRental.phases[currentPhase].signs)
      : [];

  useEffect(() => {
    if (currentStep === 3) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  // Function to display associated structure in a readable format
  const formatStructure = (structure: string): string => {
    switch(structure) {
      case 'fourFootTypeIII': return '4\' Type III';
      case 'hStand': return 'H Stand';
      case 'post': return 'Post';
      case 'none': return 'None';
      default: return structure;
    }
  };

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Sign Summary - Phase {currentPhase + 1}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm mt-4">
              {signs.length === 0 ? (
                <div className="text-muted-foreground text-left py-0">
                  No signs added yet
                </div>
              ) : (
                signs.map((sign) => (
                  <div key={sign.id} className={`space-y-1 ${Object.hasOwn(sign, 'primarySignId') ? 'ml-4' : ''}`}>
                    <div className="font-medium">
                      {sign.designation} 
                      {sign.description && ` - ${sign.description}`}
                    </div>
                    <div className="text-muted-foreground text-xs space-x-2">
                      {sign.width && sign.height && (
                        <span>{sign.width} x {sign.height}</span>
                      )}
                      {sign.sheeting && <span>• {sign.sheeting}</span>}
                      {sign.quantity && <span>• Qty: {sign.quantity}</span>}
                      {"associatedStructure" in sign && sign.associatedStructure !== "none" && (
                        <span>• Structure: {formatStructure(sign.associatedStructure)}</span>
                      )}
                      {"bLights" in sign && sign.bLights > 0 && (
                        <span>• B Lights: {sign.bLights}</span>
                      )}
                      {"cover" in sign && sign.cover && (
                        <span>• Covers: {sign.quantity}</span>
                      )}
                      {"primarySignId" in sign && (
                        <span className="italic">• Secondary Sign</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default SignSummaryAccordion;