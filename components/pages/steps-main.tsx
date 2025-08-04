"use client";
import React, { useState, ReactElement, useEffect } from "react";
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
import { QuoteNotes } from "./quote-form/QuoteNotes";
import { createDropdownMenuScope } from "@radix-ui/react-dropdown-menu";
import { INote } from "@/types/TEstimate";

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
  const [notesInfo, setNoteInfo] = React.useState<INote[]>([])
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  
  const handleSave = (note: INote) => {
    const updated = [...notesInfo, note];
    setNoteInfo(updated);
    dispatch({ type: 'COPY_NOTES', payload: updated });
  };

  const handleEdit = (index: number, updatedNote: INote) => {
    const updated = notesInfo.map((n, i) => (i === index ? updatedNote : n));
    setNoteInfo(updated);
    dispatch({ type: 'COPY_NOTES', payload: updated });
  };

  const handleDelete = (index: number) => {
    const updated = notesInfo.filter((_, i) => i !== index);
    setNoteInfo(updated);
    dispatch({ type: 'COPY_NOTES', payload: updated });
  };

  useEffect(() => {
    const bidId = searchParams?.get('bidId');
    if (!bidId) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/active-bids/${bidId}`);
        if (!res.ok) return;

        const data = await res.json();
        const notesFromBid = data?.data?.bid_notes || [];

        const formattedNotes = notesFromBid.map((note: any) => ({
          text: note.text,
          timestamp: new Date(note.created_at).getTime() 
        }));

        setNoteInfo(formattedNotes);
        dispatch({ type: 'COPY_NOTES', payload: formattedNotes });
      } catch (error) {
        console.error('Error fetching bid notes:', error);
      }
    };

    fetchNotes();
  }, [searchParams]);

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
            <QuoteNotes
              notes={notesInfo}
              onSave={handleSave}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Notes"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StepsMain;
