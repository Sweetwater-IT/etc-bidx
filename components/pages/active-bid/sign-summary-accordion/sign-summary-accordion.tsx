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

interface SignSummaryAccordionProps {
  currentStep: number;
}

const SignSummaryAccordion = ({ currentStep }: SignSummaryAccordionProps) => {
  const { mptRental } = useEstimate();
  const [value, setValue] = useState<string[]>([]);

  const signs: (PrimarySign | SecondarySign)[] = 
    mptRental.phases && 
    mptRental.phases.length > 0 && 
    mptRental.phases[0].signs 
      ? mptRental.phases[0].signs 
      : [];

  useEffect(() => {
    if (currentStep === 2) {
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
            <h3 className="font-semibold">Sign Summary</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm mt-4">
              {signs.length === 0 ? (
                <div className="text-muted-foreground text-left py-0">
                  No signs added yet
                </div>
              ) : (
                signs.map((sign) => (
                  <div key={sign.id} className="space-y-1">
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
                      {"covers" in sign && sign.covers > 0 && (
                        <span>• Covers: {sign.covers}</span>
                      )}
                      {"primarySignId" in sign && (
                        <span className="italic">• Secondary Sign</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Equipment Summary based on signs */}
            {signs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Equipment Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {mptRental.phases?.[0]?.standardEquipment && 
                   Object.entries(mptRental.phases[0].standardEquipment)
                    .filter(([_, details]) => details.quantity > 0)
                    .map(([key, details]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key === 'fourFootTypeIII' ? '4\' Type III' : 
                               key === 'hStand' ? 'H Stand' : 
                               key === 'BLights' ? 'B Lights' : key}</span>
                        <span className="font-medium">{details.quantity}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default SignSummaryAccordion;