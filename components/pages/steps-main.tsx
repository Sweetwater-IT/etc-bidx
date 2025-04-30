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
import { EstimateProvider } from "@/contexts/EstimateContext";

interface StepsMainProps {
  initialData?: Partial<FormData> | null;
}

const StepsMain = ({ initialData }: StepsMainProps) => {
  const defaultFormData: FormData = {
    adminData: defaultAdminObject,
    mptRental: {
      targetMOIC: 0,
      paybackPeriod: 0,
      annualUtilization: 0,
      dispatchFee: 0,
      mpgPerTruck: 0,
      staticEquipmentInfo: {
        fourFootTypeIII: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        hStand: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        sixFootWings: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        post: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        sandbag: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        covers: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        metalStands: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        HIVP: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        TypeXIVP: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        BLights: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        ACLights: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        sharps: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        HI: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        DG: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        Special: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 }
      },
      phases: []
    },
    saleItems: [],
    equipmentItems: [],
    flagging: undefined,
    patterns: undefined
  };

  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    ...initialData
  });
  const [currentStep, setCurrentStep] = useState(1);
  
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  return (
    <EstimateProvider>
    <div className="flex gap-20 relative min-h-screen justify-between pr-12">
      <div className="flex-1 max-w-[44vw]">
        <Steps formData={formData} setFormData={setFormData} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </div>

      {/* Preview Cards */}
      <div className="w-80 space-y-4 sticky top-10 h-fit">
        <AdminInformationAccordion currentStep={currentStep} />
        <SignSummaryAccordion currentStep={currentStep} />
        <TripAndLaborSummaryAccordion currentStep={currentStep}/>
        <BidSummaryAccordion formData={formData} currentStep={currentStep} />
      </div>
    </div>
    </EstimateProvider>
  );
};

export default StepsMain;
