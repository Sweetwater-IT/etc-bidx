import { Button } from "@/components/ui/button";
import { createActiveBid } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";
import { WorksheetDialog } from "@/components/sheets/WorksheetDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem
} from "@/components/ui/command";

const DEFAULT_TOTALS = {
  revenue: '',
  grossProfit: '',
  grossMargin: '',
};

const step = {
  id: "step-5",
  name: "Bid Summary",
  description: "Review bid details",
  fields: [{ name: "summary", label: "Summary", type: "summary", placeholder: "Summary", hasToggle: false }],
};

const BidSummaryStep5 = ({
  currentStep,
  setCurrentStep,
  isViewSummaryOpen,
  setIsViewSummaryOpen
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  isViewSummaryOpen: boolean;
  setIsViewSummaryOpen: (value: boolean) => void;
}) => {
  const router = useRouter();

  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems } = useEstimate();
  
  // State for worksheet dialog
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState<string>('estimators');
  const [openWorksheetPopover, setOpenWorksheetPopover] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsViewSummaryOpen(true);
      setIsSubmitting(true);
      setError(null);

      await createActiveBid(adminData, mptRental, equipmentRental,
        flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems);

    } catch (error) {
      console.error("Error creating bid:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Worksheet Dialog */}
      <WorksheetDialog
        open={openPdfDialog}
        onOpenChange={setOpenPdfDialog}
        selectedPdfType={selectedPdfType}
        mptRental={mptRental}
        equipmentRental={equipmentRental}
        flagging={flagging}
        adminData={adminData}
        mptTotals={DEFAULT_TOTALS}
        allTotals={DEFAULT_TOTALS}
        rentalTotals={DEFAULT_TOTALS}
        saleTotals={DEFAULT_TOTALS}
        flaggingTotals={DEFAULT_TOTALS}
      />

      <div className="relative">
        <button
          onClick={() => setCurrentStep(6)}
          className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 5 ? "text-foreground" : "text-muted-foreground"}`}
        >
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
              6 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
            }`}
          >
            6
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">{step.description}</div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 6 && (
          <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                {/* Worksheet Dropdown Button */}
                <Popover open={openWorksheetPopover} onOpenChange={setOpenWorksheetPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      View Worksheet
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        <CommandItem
                          value="estimators"
                          onSelect={() => {
                            setSelectedPdfType('estimators');
                            setOpenWorksheetPopover(false);
                            setOpenPdfDialog(true);
                          }}
                        >
                          For Estimators
                        </CommandItem>
                        <CommandItem
                          value="project-managers"
                          onSelect={() => {
                            setSelectedPdfType('project-managers');
                            setOpenWorksheetPopover(false);
                            setOpenPdfDialog(true);
                          }}
                        >
                          For Project Managers
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                    {error}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(5)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidSummaryStep5;