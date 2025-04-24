import { FormData } from "@/app/active-bid/page";
import { Dispatch, SetStateAction, useState } from "react";
import AdminInformationStep1 from "./admin-information-step1";
import BidItemsStep4 from "./bid-items-step4";
import BidSummaryStep5 from "./bid-summary-step5";
import MUTCDSignsStep2 from "./mutcd-signs-step2";
import TripAndLaborStep3 from "./trip-and-labor-step3";

const Steps = ({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  return (
    <div className="flex-1">
      <div className="relative flex flex-col">
        <div className="absolute left-4 top-[40px] bottom-8 w-[2px] bg-border" />

        <AdminInformationStep1
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
        />
        <MUTCDSignsStep2
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
        />
        <TripAndLaborStep3
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
        />
        <BidItemsStep4
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
        />
        <BidSummaryStep5
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
        />
      </div>
    </div>
  );
};

export default Steps;
