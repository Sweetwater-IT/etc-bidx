"use client";
import { FormData } from "@/app/active-bid/page";
import { useState } from "react";
import AdminInformationAccordion from "./active-bid/admin-information-accordion/admin-information-accordion";
import BidSummaryAccordion from "./active-bid/bid-summary-accordion/bid-summary-accordion";
import SignSummaryAccordion from "./active-bid/sign-summary-accordion/sign-summary-accordion";
import Steps from "./active-bid/steps/steps";
import TripAndLaborSummaryAccordion from "./active-bid/trip-and-labor-summary-accordion/trip-and-labor-summary-accordion";

const StepsMain = () => {
    const [formData, setFormData] = useState<FormData>({});

    return (
        <div className="flex gap-8">
            <Steps formData={formData} setFormData={setFormData} />

            {/* Preview Cards */}
            <div className="w-80 space-y-4">
                <AdminInformationAccordion formData={formData} />
                <SignSummaryAccordion />
                <TripAndLaborSummaryAccordion />
                <BidSummaryAccordion />
            </div>
        </div>
    );
};

export default StepsMain;
