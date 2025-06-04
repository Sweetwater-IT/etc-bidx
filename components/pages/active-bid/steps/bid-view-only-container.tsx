'use client'
import React from 'react'
import AdminInformationAccordion from '../admin-information-accordion/admin-information-accordion'
import PhaseSummaryAccordion from '../phase-summary-accordion/phase-summary-accordion'
import SignSummaryAccordion from '../sign-summary-accordion/sign-summary-accordion'
import TripAndLaborSummaryAccordion from '../trip-and-labor-summary-accordion/trip-and-labor-summary-accordion'
import BidSummaryAccordion from '../bid-summary-accordion/bid-summary-accordion'
import AdminInfoViewOnly from './admin-info-view-only'
import PhasesViewOnly from './phases-view-only'
import SignsViewOnly from './signs-view-only'
import TripAndLaborViewOnlyAll from './trip-and-labor-view-only'
import BidItemsViewOnly from './bid-items-view-only'

const BidViewOnlyContainer = () => {
    return (
        <div className='flex pr-6'>
            <div className='w-2/3'>
                <div className="text-xl font-semibold pl-6 mb-4">Admin Information</div>
                <AdminInfoViewOnly />
                <div className="text-xl font-semibold pl-6 mb-4 mt-6">Phases</div>
                <PhasesViewOnly />
                <div className="text-xl font-semibold pl-6 mb-4 mt-8">Signs</div>
                <SignsViewOnly/>
                <div className="text-xl font-semibold pl-6 mb-4 mt-8">Trip and Labor</div>
                <TripAndLaborViewOnlyAll/>
                <div className="text-xl font-semibold pl-6 mb-4 mt-8">Bid Items</div>
                <BidItemsViewOnly/>
            </div>
            <div className="w-1/3 space-y-4 sticky max-h-[70vh] overflow-y-auto top-10 transition-all duration-300 pl-4 border-l">
                <AdminInformationAccordion currentStep={1} />
                <PhaseSummaryAccordion
                    currentStep={1}
                    setCurrentPhase={() => { }}
                    currentPhase={0}
                    setCurrentStep={() => { }}
                />
                <SignSummaryAccordion
                    currentStep={1}
                    currentPhase={0}
                />
                <TripAndLaborSummaryAccordion
                    currentStep={1}
                    currentPhase={0}
                />
                <BidSummaryAccordion
                    currentStep={1}
                    setIsViewSummaryOpen={() => { }}
                    isViewSummaryOpen={false}
                />
            </div>
        </div>
    )
}

export default BidViewOnlyContainer
