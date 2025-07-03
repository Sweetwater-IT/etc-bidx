"use client";
import { useState, ReactElement, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminInformationAccordion from "./active-bid/admin-information-accordion/admin-information-accordion";
import BidSummaryAccordion from "./active-bid/bid-summary-accordion/bid-summary-accordion";
import SignSummaryAccordion from "./active-bid/sign-summary-accordion/sign-summary-accordion";
import TripAndLaborSummaryAccordion from "./active-bid/trip-and-labor-summary-accordion/trip-and-labor-summary-accordion";
import { Button } from "../ui/button";
import PhaseSummaryAccordion from "./active-bid/phase-summary-accordion/phase-summary-accordion";
import AddPhaseButton from "./active-bid/steps/add-phase-button";
import { Expand, Minimize, PanelRight, PanelLeftClose } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import AdminInformationStep1 from "./active-bid/steps/admin-information-step1";
import BidItemsStep5 from "./active-bid/steps/bid-items-step5";
import { useSidebar } from "../ui/sidebar";
import { Textarea } from "../ui/textarea";
import { useEstimate } from "@/contexts/EstimateContext";

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
        .fullscreen-step-wrapper
          button[type="button"][aria-haspopup="listbox"] {
          display: inline-flex !important;
        }
      `}</style>
    </div>
  );
};

const StepsMain = () => {

  const { notes, dispatch } = useEstimate()
  const searchParams = useSearchParams();
  const initialStepParam = searchParams?.get("initialStep");
  const tuckedSidebar = searchParams?.get('tuckSidebar')
  const setFullscreen = searchParams?.get('fullscreen')

  const { toggleSidebar } = useSidebar()
  // Initialize currentStep based on the URL parameter or default to 1
  // When in edit mode, always default to step 6 unless explicitly overridden
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState<boolean>(false);;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

  useEffect(() => {
    // if(tuckedSidebar && tuckedSidebar === 'true')
    toggleSidebar();

    // if(setFullscreen && setFullscreen === 'true')
    setIsFullscreen(true)
  }, [])

  return (
    <div
      className={`relative min-h-screen ${isFullscreen ? "px-6" : "flex gap-20 justify-between pr-12"
        }`}
      style={{ transition: "all 0.3s ease-in-out" }}
    >
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
        <div className="w-full flex">
          <div
            className={`${isSidebarVisible ? "w-3/4 pr-6" : "w-full"
              } transition-all duration-300`}
          >
            <div className="mb-4 flex justify-between items-center">
              <div></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        className={`backdrop-blur-sm ${isSidebarVisible
                          ? "bg-slate-200/80 border-slate-300"
                          : "bg-white/50"
                          }`}
                      >
                        {isSidebarVisible ? (
                          <PanelLeftClose className="h-4 w-4" />
                        ) : (
                          <PanelRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isSidebarVisible
                          ? "Hide Summary Sidebar"
                          : "Show Summary Sidebar"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  {/* <Tooltip>
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
                    </Tooltip> */}
                </div>
              </div>
            </div>
            <div className="space-y-10">
              <section>
                <h3 className="text-xl font-semibold pb-2 border-b mb-6">
                  Admin Information
                </h3>
                {renderStepWithoutNavigation(
                  <AdminInformationStep1
                  />
                )}
              </section>
              <section>
                <h3 className="text-xl font-semibold pb-2 border-b mb-6">
                  Bid Items
                </h3>
                {renderStepWithoutNavigation(
                  <BidItemsStep5
                    currentPhase={currentPhase}
                    setCurrentPhase={setCurrentPhase}
                    // setIsViewSummaryOpen={setIsViewSummaryOpen}
                  />
                )}
              </section>
            </div>
          </div>

          {/* Sidebar */}
          {isSidebarVisible && (
            <div className="w-1/4 space-y-4 sticky max-h-[80vh] overflow-y-auto top-10 transition-all duration-300 pl-4 border-l">
              <AdminInformationAccordion />
              {/* <PhaseSummaryAccordion
                setCurrentPhase={setCurrentPhase}
                currentPhase={currentPhase}
              />
              <SignSummaryAccordion
                currentPhase={currentPhase}
              />
              <TripAndLaborSummaryAccordion
                currentPhase={currentPhase}
              /> */}
              <BidSummaryAccordion
                setIsViewSummaryOpen={setIsViewSummaryOpen}
                isViewSummaryOpen={isViewSummaryOpen}
              />
              <div className="shadow-md rounded-lg border p-4">
                <h2 className="mb-2 text-sm font-semibold">Notes</h2>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add notes here..."
                    rows={5}
                    value={notes}
                    onChange={(e) => dispatch({ type: 'UPDATE_NOTES', payload: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default StepsMain;
