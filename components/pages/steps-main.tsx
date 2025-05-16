"use client";
import { FormData } from "@/types/IFormData";
import { useEffect, useState } from "react";
import AdminInformationAccordion from "./active-bid/admin-information-accordion/admin-information-accordion";
import BidSummaryAccordion from "./active-bid/bid-summary-accordion/bid-summary-accordion";
import SignSummaryAccordion from "./active-bid/sign-summary-accordion/sign-summary-accordion";
import Steps from "./active-bid/steps/steps";
import TripAndLaborSummaryAccordion from "./active-bid/trip-and-labor-summary-accordion/trip-and-labor-summary-accordion";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { defaultMPTObject } from "@/types/default-objects/defaultMPTObject";
import { EstimateProvider, useEstimate } from "@/contexts/EstimateContext";
import { Button } from "../ui/button";
import PhaseSummaryAccordion from "./active-bid/phase-summary-accordion/phase-summary-accordion";
import AddPhaseButton from "./active-bid/steps/add-phase-button";

interface StepsMainProps {
  initialData?: Partial<FormData> | null;
}

const StepsMain = ({ initialData }: StepsMainProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState<boolean>(false)

  return (
    <EstimateProvider>
    <div className="flex gap-20 relative min-h-screen justify-between pr-12">
      <div className="flex-1 max-w-[44vw]">
        <Steps isViewSummaryOpen={isViewSummaryOpen} setIsViewSummaryOpen={setIsViewSummaryOpen} currentStep={currentStep} setCurrentStep={setCurrentStep} currentPhase={currentPhase}/>
      </div>

      {/* Preview Cards */}
      <div className="w-80 space-y-4 sticky top-10 h-fit">
        <AddPhaseButton setCurrentPhase={setCurrentPhase} setCurrentStep={setCurrentStep}/>
        <AdminInformationAccordion currentStep={currentStep} />
        <PhaseSummaryAccordion currentStep={currentStep} setCurrentPhase={setCurrentPhase} currentPhase={currentPhase} setCurrentStep={setCurrentStep}/>
        <SignSummaryAccordion currentStep={currentStep} currentPhase={currentPhase} />
        <TripAndLaborSummaryAccordion currentStep={currentStep} currentPhase={currentPhase}/>
        <BidSummaryAccordion currentStep={currentStep} setIsViewSummaryOpen={setIsViewSummaryOpen} isViewSummaryOpen={isViewSummaryOpen}/>
      </div>
    </div>
    </EstimateProvider>
  );
};

export default StepsMain;
