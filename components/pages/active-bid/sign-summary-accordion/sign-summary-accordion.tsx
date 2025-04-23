import { FormData } from "@/app/active-bid/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

export interface SignData {
  id: string;
  designation: string;
  dimensions?: string;
  sheeting?: string;
  quantity?: number;
  structure?: string;
  bLights?: number;
  covers?: number;
}

const SignSummaryAccordion = ({ formData }: { formData: FormData }) => {
  const signs: SignData[] = formData.signs || [];

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible>
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
                    <div className="font-medium">{sign.designation}</div>
                    <div className="text-muted-foreground text-xs space-x-2">
                      {sign.dimensions && <span>{sign.dimensions}</span>}
                      {sign.sheeting && <span>• {sign.sheeting}</span>}
                      {sign.quantity && <span>• Qty: {sign.quantity}</span>}
                      {sign.structure && sign.structure !== "None" && <span>• {sign.structure}</span>}
                      {sign.bLights ? <span>• B Lights: {sign.bLights}</span> : null}
                      {sign.covers ? <span>• Covers: {sign.covers}</span> : null}
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
