import { Dispatch, SetStateAction, useState } from "react";
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
}

const Steps = ({
  currentPhase,
  currentStep,
  setCurrentStep,
}: StepsProps) => {
  return (
    <div className="flex-1">
      <div className="relative flex flex-col">
        <div className="absolute left-4 top-[40px] bottom-8 w-[2px] bg-border" />

        <AdminInformationStep1
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
        <PhaseInfoStep2 currentStep={currentStep} setCurrentStep={setCurrentStep} currentPhase={currentPhase}/>
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
        />
      </div>
    </div>
  );
};

export default Steps;
