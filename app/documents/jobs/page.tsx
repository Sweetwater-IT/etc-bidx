"use client";

import { AppSidebar } from "../../../components/app-sidebar";
import { DataTable } from "../../../components/data-table";
import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import { SiteHeader } from "../../../components/site-header";
import { jobsData, type JobData } from "../../../data/jobs-data";
import { SectionCards } from "../../../components/section-cards";
import { CardActions } from "../../../components/card-actions";
import { useState } from "react";
import { CreateJobSheet } from "../../../components/create-job-sheet";

const JOB_LIST_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Full-time", value: "full-time" },
  { label: "Contract", value: "contract" },
  { label: "Remote", value: "remote" },
];

const COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

const JOB_LIST_CARDS = [
  {
    title: "Total Jobs",
    value: "36",
    change: 15,
    trend: "up" as const,
    description: "Jobs in the system"
  },
  {
    title: "Average Salary",
    value: "$107,500",
    change: 8,
    trend: "up" as const,
    description: "Average job budget"
  },
  {
    title: "Remote Positions",
    value: "45%",
    change: 12,
    trend: "up" as const,
    description: "Jobs with remote work"
  },
  {
    title: "Urgent Positions",
    value: "5",
    change: -2,
    trend: "down" as const,
    description: "Jobs marked as urgent"
  }
];

export default function JobListPage() {
  const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false);

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
              <CardActions
                createButtonLabel="Create Job"
                onCreateClick={() => setCreateJobSheetOpen(true)}
              />

              <SectionCards data={JOB_LIST_CARDS} />

              <DataTable<JobData>
                data={jobsData.available}
                columns={COLUMNS}
                segments={JOB_LIST_SEGMENTS}
                stickyLastColumn
              />

              <CreateJobSheet 
                open={createJobSheetOpen}
                onOpenChange={setCreateJobSheetOpen}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 