"use client";
import { FormData } from "@/types/IFormData";
import { useEffect, useState } from "react";
import AdminInformationAccordion from "./active-bid/admin-information-accordion/admin-information-accordion";
import BidSummaryAccordion from "./active-bid/bid-summary-accordion/bid-summary-accordion";
import SignSummaryAccordion from "./active-bid/sign-summary-accordion/sign-summary-accordion";
import Steps from "./active-bid/steps/steps";
import TripAndLaborSummaryAccordion from "./active-bid/trip-and-labor-summary-accordion/trip-and-labor-summary-accordion";

interface StepsMainProps {
  initialData?: Partial<FormData> | null;
}

const StepsMain = ({ initialData }: StepsMainProps) => {
  const defaultFormData: FormData = {
    adminData: {
      contractNumber: '',
      estimator: '',
      division: null,
      lettingDate: null,
      owner: null,
      county: {
        name: '',
        district: 0,
        branch: '',
        laborRate: 0,
        fringeRate: 0,
        shopRate: 0,
        flaggingRate: 0,
        flaggingBaseRate: 0,
        flaggingFringeRate: 0,
        ratedTargetGM: 0,
        nonRatedTargetGM: 0,
        insurance: 0,
        fuel: 0,
        market: 'CORE'
      },
      srRoute: '',
      location: '',
      dbe: '',
      startDate: null,
      endDate: null,
      emergencyJob: false,
      rated: 'NON-RATED',
      emergencyFields: {}
    },
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
    <div className="flex gap-8 relative min-h-screen">
      <div className="flex-1">
        <Steps formData={formData} setFormData={setFormData} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </div>

      {/* Preview Cards */}
      <div className="w-80 space-y-4 sticky top-10 h-fit">
        <AdminInformationAccordion formData={formData} currentStep={currentStep} />
        <SignSummaryAccordion formData={formData} currentStep={currentStep} />
        <TripAndLaborSummaryAccordion currentStep={currentStep}/>
        <BidSummaryAccordion formData={formData} currentStep={currentStep} />
      </div>
    </div>
  );
};

export default StepsMain;
