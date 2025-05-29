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
      name: "Phase 1",
      start: "12.11.2024",
      end: "12.11.2025",
      products: [
        { name: "Four Foot Type III", params: 10, value: 100, actions: true },
        { name: "H Stand", params: 5, value: 50, actions: true },
        { name: "Post", params: 20, value: 200, actions: true },
        { name: "Six Foot Wings", params: 8, value: 80, actions: true },
        { name: "Metal Stands", params: 12, value: 120, actions: true },
        { name: "Covers", params: 7, value: 70, actions: true },
        { name: "Sandbags", params: 15, value: 150, actions: true },
        { name: "HI Vertical Panels", params: 6, value: 60, actions: true },
        {
          name: "Type XI Vertical Panels",
          params: 9,
          value: 90,
          actions: true,
        },
        { name: "B-Lights", params: 3, value: 30, actions: true },
        { name: "AC Lights", params: 4, value: 40, actions: true },
        { name: "Sharps", params: 2, value: 20, actions: true },
      ],
    },
    {
      name: "Phase 2",
      start: "13.11.2024",
      end: "13.11.2025",
      products: [
        { name: "Four Foot Type III", params: 12, value: 110, actions: true },
        { name: "H Stand", params: 6, value: 55, actions: true },
        { name: "Post", params: 18, value: 210, actions: true },
        { name: "Six Foot Wings", params: 9, value: 85, actions: true },
        { name: "Metal Stands", params: 10, value: 130, actions: true },
        { name: "Covers", params: 8, value: 75, actions: true },
        { name: "Sandbags", params: 14, value: 160, actions: true },
        { name: "HI Vertical Panels", params: 7, value: 65, actions: true },
        {
          name: "Type XI Vertical Panels",
          params: 8,
          value: 95,
          actions: true,
        },
        { name: "B-Lights", params: 4, value: 35, actions: true },
        { name: "AC Lights", params: 5, value: 45, actions: true },
        { name: "Sharps", params: 3, value: 25, actions: true },
      ],
    },
    {
      name: "Phase 3",
      start: "14.11.2024",
      end: "14.11.2025",
      products: [
        { name: "Four Foot Type III", params: 14, value: 120, actions: true },
        { name: "H Stand", params: 7, value: 60, actions: true },
        { name: "Post", params: 22, value: 220, actions: true },
        { name: "Six Foot Wings", params: 10, value: 90, actions: true },
        { name: "Metal Stands", params: 13, value: 140, actions: true },
        { name: "Covers", params: 9, value: 80, actions: true },
        { name: "Sandbags", params: 16, value: 170, actions: true },
        { name: "HI Vertical Panels", params: 8, value: 70, actions: true },
        {
          name: "Type XI Vertical Panels",
          params: 10,
          value: 100,
          actions: true,
        },
        { name: "B-Lights", params: 5, value: 40, actions: true },
        { name: "AC Lights", params: 6, value: 50, actions: true },
        { name: "Sharps", params: 4, value: 30, actions: true },
      ],
    },
    {
      name: "Phase 4",
      start: "15.11.2024",
      end: "15.11.2025",
      products: [
        { name: "Four Foot Type III", params: 16, value: 130, actions: true },
        { name: "H Stand", params: 8, value: 65, actions: true },
        { name: "Post", params: 24, value: 230, actions: true },
        { name: "Six Foot Wings", params: 11, value: 95, actions: true },
        { name: "Metal Stands", params: 15, value: 150, actions: true },
        { name: "Covers", params: 10, value: 85, actions: true },
        { name: "Sandbags", params: 18, value: 180, actions: true },
        { name: "HI Vertical Panels", params: 9, value: 75, actions: true },
        {
          name: "Type XI Vertical Panels",
          params: 12,
          value: 105,
          actions: true,
        },
        { name: "B-Lights", params: 6, value: 45, actions: true },
        { name: "AC Lights", params: 7, value: 55, actions: true },
        { name: "Sharps", params: 5, value: 35, actions: true },
      ],
    },
    {
      name: "Phase 5",
      start: "16.11.2024",
      end: "16.11.2025",
      products: [
        { name: "Four Foot Type III", params: 18, value: 140, actions: true },
        { name: "H Stand", params: 9, value: 70, actions: true },
        { name: "Post", params: 26, value: 240, actions: true },
        { name: "Six Foot Wings", params: 12, value: 100, actions: true },
        { name: "Metal Stands", params: 17, value: 160, actions: true },
        { name: "Covers", params: 11, value: 90, actions: true },
        { name: "Sandbags", params: 20, value: 190, actions: true },
        { name: "HI Vertical Panels", params: 10, value: 80, actions: true },
        {
          name: "Type XI Vertical Panels",
          params: 14,
          value: 110,
          actions: true,
        },
        { name: "B-Lights", params: 7, value: 50, actions: true },
        { name: "AC Lights", params: 8, value: 60, actions: true },
        { name: "Sharps", params: 6, value: 40, actions: true },
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
    { id: 1, name: "Document", attachedOptions: ["Flagging Price List"] },
    { id: 2, name: "Image", attachedOptions: ["Flagging Service Area"] },
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

  const handleRemoveFile = (id: number) => {
    setFileList((prev) => prev.filter((file) => file.id !== id));
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
                        onRemoveFile={handleRemoveFile}
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
