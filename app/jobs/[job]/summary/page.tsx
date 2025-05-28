"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { JobSummaryHeader } from "@/components/pages/job-summary/job-summary-header";
import { BidPhaseSummary } from "@/components/pages/job-summary/bid-phase-summary";
import { JobInfoSidebar } from "@/components/pages/job-summary/job-info-sidebar";
import { ContractTracker } from "@/components/pages/job-summary/contract-tracker";
import { NotesSection } from "@/components/pages/job-summary/notes-section";
import { FilesSection } from "@/components/pages/job-summary/files-section";
import { JobItemsSection } from "@/components/pages/job-summary/job-items-section";
import { Card } from "@/components/ui/card";

type FileType = { id: number; name: string; attachedOptions: string[] };

export default function JobSummaryPage() {
  // Dados mockados para exibição
  const jobNumber = "30-22-2025037";
  const billingStatus = "In progress";
  const projectStatus = "Not Started";
  const customerInfo = {
    customer: "Allan Myers",
    contract: "231",
    manager: "231321",
    email: "1212@211212.com",
    phone: "(123) 123-1231",
  };
  const bidPhases = [
    {
      name: "I",
      start: "12.11.2024",
      end: "12.11.2025",
      products: [
        { name: "4'Ft Type III", params: 333, value: "", actions: true },
        { name: "H Stands", params: 0, value: 23, actions: true },
        { name: "Sand Bags", params: 12, value: "", actions: true },
        { name: "Covers", params: 0, value: "", actions: true },
        {
          name: "Spring Loader Metal Stands",
          params: 0,
          value: "",
          actions: true,
        },
        {
          name: "Type XI Vertical Panels",
          params: 0,
          value: "",
          actions: true,
        },
        { name: "B-Lites", params: 0, value: 2, actions: true },
        { name: "A / C Lites", params: 342, value: 222, actions: true },
      ],
    },
  ];

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [noteList, setNoteList] = useState([
    {
      id: 1,
      author: "Thiago",
      text: "First note example",
      date: "2024-06-01",
    },
    {
      id: 2,
      author: "Maria",
      text: "Important note",
      date: "2024-06-02",
    },
  ]);

  const [fileList, setFileList] = useState<FileType[]>([
    { id: 1, name: "Flagging Price List", attachedOptions: [] },
    { id: 2, name: "Flagging Service Area", attachedOptions: [] },
    { id: 3, name: "Bedford Branch Sell Sheet", attachedOptions: [] },
  ]);

  const jobItems = [
    { id: 1, code: "0608-0001", description: "Main job item" },
    { id: 2, code: "0608-0002", description: "Secondary item" },
  ];

  const handleAddNote = (note: Omit<(typeof noteList)[0], "id">) => {
    setNoteList([...noteList, { ...note, id: Date.now() }]);
  };

  const handleAddFile = (file: Omit<(typeof fileList)[0], "id">) => {
    setFileList([...fileList, { ...file, id: Date.now() }]);
  };

  const handleUpdateFileOptions = (id: number, options: string[]) => {
    setFileList((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, attachedOptions: options } : file
      )
    );
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6 px-6">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <JobSummaryHeader
                    jobNumber={jobNumber}
                    billingStatus={billingStatus}
                    projectStatus={projectStatus}
                  />
                  <BidPhaseSummary bidPhases={bidPhases} />
                </div>

                {/* Sidebar */}
                <aside className="w-96">
                  <Card className="rounded-2xl border border-border bg-background shadow-none p-4">
                    <div className="flex flex-col">
                      <JobInfoSidebar customerInfo={customerInfo} />
                      <div className="border-b border-border my-2" />
                      <ContractTracker
                        isOpen={openSection === "contract"}
                        onToggle={() =>
                          setOpenSection(
                            openSection === "contract" ? null : "contract"
                          )
                        }
                      />
                      <NotesSection
                        isOpen={openSection === "notes"}
                        onToggle={() =>
                          setOpenSection(
                            openSection === "notes" ? null : "notes"
                          )
                        }
                        notes={noteList}
                        onAddNote={handleAddNote}
                      />
                      <FilesSection
                        isOpen={openSection === "files"}
                        onToggle={() =>
                          setOpenSection(
                            openSection === "files" ? null : "files"
                          )
                        }
                        files={fileList}
                        onAddFile={handleAddFile}
                        onUpdateFileOptions={handleUpdateFileOptions}
                      />
                      <JobItemsSection
                        isOpen={openSection === "jobitems"}
                        onToggle={() =>
                          setOpenSection(
                            openSection === "jobitems" ? null : "jobitems"
                          )
                        }
                        jobItems={jobItems}
                      />
                    </div>
                  </Card>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
