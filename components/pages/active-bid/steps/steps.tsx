"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminInformationStep1 from "./admin-information-step1";
import BidItemsStep5 from "./bid-items-step5";
import BidSummaryStep6 from "./bid-summary-step6";
import MUTCDSignsStep3 from "./mutcd-signs-step3";
import TripAndLaborStep4 from "./trip-and-labor-step4";
import PhaseInfoStep2 from "./phase-info-step2";

interface StepsProps {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  currentPhase: number
  isViewSummaryOpen: boolean;
  setIsViewSummaryOpen: (value : boolean) => void
}

const Steps = ({
  currentPhase,
  currentStep,
  setCurrentStep,
  isViewSummaryOpen,
  setIsViewSummaryOpen
}: StepsProps) => {
  const searchParams = useSearchParams();
  const isEditing = searchParams?.get("isEditing") === "true";
  
  // We'll use a useEffect to delay step navigation in edit mode
  useEffect(() => {
    // If we're in edit mode, add a small delay before allowing navigation
    if (isEditing) {
      const timer = setTimeout(() => {
        // This is just to ensure the component re-renders after data is loaded
        // We don't actually need to do anything here
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing]);
  
  return (
    <div className="flex-1">
      <div className="relative flex flex-col">
        <div className="absolute left-4 top-[40px] bottom-8 w-[2px] bg-border" />

        <AdminInformationStep1
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
        <PhaseInfoStep2 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep} 
          currentPhase={currentPhase}
        />
        <MUTCDSignsStep3
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          currentPhase={currentPhase}
        />
        <TripAndLaborStep4
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          currentPhase={currentPhase}
        />
        <BidItemsStep5
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          currentPhase={currentPhase}
        />
        <BidSummaryStep6
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isViewSummaryOpen={isViewSummaryOpen}
          setIsViewSummaryOpen={setIsViewSummaryOpen}
        />
      </div>
    </div>
  );
};

export default Steps;
