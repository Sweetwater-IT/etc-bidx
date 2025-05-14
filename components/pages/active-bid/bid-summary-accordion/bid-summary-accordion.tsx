import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormData } from "@/types/IFormData";
import { ViewBidSummarySheet } from "@/components/sheets/view-bid-summary-sheet";
import { formatCurrency } from "@/lib/utils";
import { getAllTotals } from "@/lib/mptRentalHelperFunctions";
import { AdminData } from "@/types/TAdminData";
import { useEstimate } from "@/contexts/EstimateContext";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";

interface BidSummaryAccordionProps {
  currentStep: number;
}

interface BidSummary{
  revenue: number;
  cost: number;
  grossProfit: number;
  grossMargin:  number
}

const BidSummaryAccordion = ({ currentStep }: BidSummaryAccordionProps) => {
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState(false);
  const [value, setValue] = useState<string[]>([]);

  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems} = useEstimate();

  const [bidSummary, setBidSummary] = useState<BidSummary>({
    revenue: 0,
    cost: 0,
    grossProfit: 0,
    grossMargin: 0
  });

  useEffect(() => {
    const allTotals = getAllTotals(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems)

    setBidSummary({
      revenue: allTotals.totalRevenue,
      cost: allTotals.totalCost,
      grossProfit: allTotals.totalGrossProfit,
      grossMargin: allTotals.mptGrossMargin
    })
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems])


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
                  <span className="font-medium">{formatCurrency(bidSummary.revenue)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(bidSummary.cost)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Gross Profit:</span>
                  <span className="font-medium">{formatCurrency(bidSummary.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Gross Margin:</span>
                  <span className="font-medium">{(bidSummary.grossMargin || 0).toFixed(2)}%</span>
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
      />
    </>
  );
};

export default BidSummaryAccordion;
