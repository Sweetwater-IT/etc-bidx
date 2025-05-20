"use client";
import { FormData } from "@/types/IFormData";
import { useState, ReactElement } from "react";
import AdminInformationAccordion from "./active-bid/admin-information-accordion/admin-information-accordion";
import BidSummaryAccordion from "./active-bid/bid-summary-accordion/bid-summary-accordion";
import SignSummaryAccordion from "./active-bid/sign-summary-accordion/sign-summary-accordion";
import Steps from "./active-bid/steps/steps";
import TripAndLaborSummaryAccordion from "./active-bid/trip-and-labor-summary-accordion/trip-and-labor-summary-accordion";
import { EstimateProvider, useEstimate } from "@/contexts/EstimateContext";
import { Button } from "../ui/button";
import PhaseSummaryAccordion from "./active-bid/phase-summary-accordion/phase-summary-accordion";
import AddPhaseButton from "./active-bid/steps/add-phase-button";
import { Expand, Minimize, PanelRight, PanelLeftClose } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import AdminInformationStep1 from "./active-bid/steps/admin-information-step1";
import PhaseInfoStep2 from "./active-bid/steps/phase-info-step2";
import MUTCDSignsStep3 from "./active-bid/steps/mutcd-signs-step3";
import TripAndLaborStep4 from "./active-bid/steps/trip-and-labor-step4";
import BidItemsStep5 from "./active-bid/steps/bid-items-step5";
import BidSummaryStep6 from "./active-bid/steps/bid-summary-step6";

const renderStepWithoutNavigation = (stepElement: ReactElement) => {
  return (
    <div className="fullscreen-step-wrapper">
      {stepElement}
      <style jsx global>{`
        /* Hide navigation buttons in fullscreen mode */
        .fullscreen-step-wrapper .flex.justify-end button,
        .fullscreen-step-wrapper .flex.justify-between button {
          display: none !important;
        }
        
        /* Exception for form input buttons that shouldn't be hidden */
        .fullscreen-step-wrapper .flex.items-center button,
        .fullscreen-step-wrapper button[type="button"][aria-haspopup="listbox"] {
          display: inline-flex !important;
        }
      `}</style>
    </div>
  );
};

interface StepsMainProps {
  initialData?: Partial<FormData> | null;
}

const StepsMain = ({ initialData }: StepsMainProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true)

  return (
    <EstimateProvider>
    <div className={`relative min-h-screen ${isFullscreen ? 'px-6' : 'flex gap-20 justify-between pr-12'}`} style={{ transition: 'all 0.3s ease-in-out' }}>
      {!isFullscreen && (
        <div className="absolute top-0 right-0 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-10 w-10 bg-white/50 backdrop-blur-sm"
              >
                <Expand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enter Fullscreen Mode - Show All Sections</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {isFullscreen ? (
        <div className="w-full flex">
          <div className={`${isSidebarVisible ? 'w-3/4 pr-6' : 'w-full'} transition-all duration-300`}>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Bid Form</h2>
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-48"> {/* Reduced width for better proportions */}
                      <AddPhaseButton setCurrentPhase={setCurrentPhase} setCurrentStep={setCurrentStep}/>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a New Phase to the Bid</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        className={`backdrop-blur-sm ${isSidebarVisible ? 'bg-slate-200/80 border-slate-300' : 'bg-white/50'}`}
                      >
                        {isSidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isSidebarVisible ? "Hide Summary Sidebar" : "Show Summary Sidebar"}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="bg-white/50 backdrop-blur-sm"
                      >
                        <Minimize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exit Fullscreen Mode - Return to Step View</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="space-y-10">
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">Admin Information</h3>
              {renderStepWithoutNavigation(
                <AdminInformationStep1 currentStep={1} setCurrentStep={setCurrentStep} />
              )}
            </section>
            
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">Phase Information</h3>
              {renderStepWithoutNavigation(
                <PhaseInfoStep2 currentStep={2} setCurrentStep={setCurrentStep} currentPhase={currentPhase} />
              )}
            </section>
            
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">MUTCD Signs</h3>
              {renderStepWithoutNavigation(
                <MUTCDSignsStep3 currentStep={3} setCurrentStep={setCurrentStep} currentPhase={currentPhase} />
              )}
            </section>
            
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">Trip and Labor</h3>
              {renderStepWithoutNavigation(
                <TripAndLaborStep4 currentStep={4} setCurrentStep={setCurrentStep} currentPhase={currentPhase} />
              )}
            </section>
            
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">Bid Items</h3>
              {renderStepWithoutNavigation(
                <BidItemsStep5 currentStep={5} setCurrentStep={setCurrentStep} currentPhase={currentPhase} />
              )}
            </section>
            
            <section>
              <h3 className="text-xl font-semibold pb-2 border-b mb-6">Bid Summary</h3>
              {renderStepWithoutNavigation(
                <BidSummaryStep6 currentStep={6} setCurrentStep={setCurrentStep} isViewSummaryOpen={isViewSummaryOpen} setIsViewSummaryOpen={setIsViewSummaryOpen} />
              )}
            </section>
            </div>
          </div>
          
          {/* Sidebar */}
          {isSidebarVisible && (
            <div className="w-1/4 space-y-4 sticky top-10 h-fit transition-all duration-300 pl-4 border-l">
              <AdminInformationAccordion currentStep={currentStep} />
              <PhaseSummaryAccordion currentStep={currentStep} setCurrentPhase={setCurrentPhase} currentPhase={currentPhase} setCurrentStep={setCurrentStep}/>
              <SignSummaryAccordion currentStep={currentStep} currentPhase={currentPhase} />
              <TripAndLaborSummaryAccordion currentStep={currentStep} currentPhase={currentPhase}/>
              <BidSummaryAccordion currentStep={currentStep} setIsViewSummaryOpen={setIsViewSummaryOpen} isViewSummaryOpen={isViewSummaryOpen}/>
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
    </EstimateProvider>
  );
};

export default StepsMain;
