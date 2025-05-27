"use client";

import { AppSidebar } from "../../../components/app-sidebar";
import { DataTable } from "../../../components/data-table";
import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import { SiteHeader } from "../../../components/site-header";
import { type JobData } from "../../../data/jobs-data";
import { CardActions } from "../../../components/card-actions";
import { CreateJobSheet } from "../../../components/create-job-sheet";
import { useState } from "react";

const COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Full-time", value: "full-time" },
  { label: "Contract", value: "contract" },
  { label: "Remote", value: "remote" },
];

export default function ByPhaseJobListPage() {
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

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
              <div className="flex items-center justify-between px-0 -mb-3">
                <CardActions
                  createButtonLabel="Create Job"
                  onCreateClick={() => setIsCreateJobOpen(true)}
                  hideCalendar
                  goUpActions
                />
              </div>

              <DataTable<JobData>
                data={[]}
                columns={COLUMNS}
                segments={SEGMENTS}
                stickyLastColumn
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      <CreateJobSheet 
        open={isCreateJobOpen}
        onOpenChange={setIsCreateJobOpen}
      />
    </SidebarProvider>
  );
} 