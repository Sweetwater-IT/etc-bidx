import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormData } from "@/app/active-bid/page";
import { ViewBidSummarySheet } from "@/components/sheets/view-bid-summary-sheet";
import { formatCurrency } from "@/lib/utils";

interface BidSummaryAccordionProps {
  formData: FormData;
  currentStep: number;
}

const BidSummaryAccordion = ({ formData, currentStep }: BidSummaryAccordionProps) => {
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState(false);
  const [value, setValue] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep === 4 || currentStep === 5) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  return (
    <>
      <Accordion type="multiple" value={value} onValueChange={setValue} className="w-full bg-card rounded-lg border shadow-sm">
        <AccordionItem value="item-1" className="border-0">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Bid Summary</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="pt-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Total Revenue:</span>
                  <span className="font-medium">{formatCurrency(Number(formData.totalRevenue) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(Number(formData.totalCost) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Gross Profit:</span>
                  <span className="font-medium">{formatCurrency(Number(formData.grossProfit) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Gross Margin:</span>
                  <span className="font-medium">{formData.grossMargin || 0}%</span>
                </div>
              </div>

              <Button 
                className="w-full mt-2" 
                variant="outline"
                onClick={() => setIsViewSummaryOpen(true)}
              >
                View Bid Summary
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ViewBidSummarySheet
        open={isViewSummaryOpen}
        onOpenChange={setIsViewSummaryOpen}
        formData={formData}
      />
    </>
  );
};

export default BidSummaryAccordion;
