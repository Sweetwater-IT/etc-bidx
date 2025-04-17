"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { getJobCards } from "@/data/jobs-cards"
import { jobsData, type JobType, type JobData } from "@/data/jobs-data"
import { availableJobsData, availableJobsColumns, type AvailableJob } from "@/data/available-jobs"
import { activeBidsData, ACTIVE_BIDS_COLUMNS, ACTIVE_BIDS_SEGMENTS, type ActiveBid } from "@/data/active-bids"
import { activeJobsData, ACTIVE_JOBS_COLUMNS, ACTIVE_JOBS_SEGMENTS, type ActiveJob } from "@/data/active-jobs"
import { notFound } from "next/navigation";
import { useState } from "react";
import { OpenBidSheet } from "@/components/open-bid-sheet";
import { CardActions } from "@/components/card-actions";

const AVAILABLE_JOBS_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Unset", value: "unset" },
  { label: "No Bid", value: "no-bid" },
  { label: "Bid", value: "bid" },
];

const DEFAULT_SEGMENTS = [
  { label: "Outline", value: "outline" },
  { label: "Past Performance", value: "past-performance" },
  { label: "Key Personnel", value: "key-personnel" },
  { label: "Focus Documents", value: "focus-documents" },
];

const DEFAULT_COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

type JobPageData = JobData | AvailableJob | ActiveBid | ActiveJob
type JobPageColumns = typeof DEFAULT_COLUMNS[number] | typeof availableJobsColumns[number] | typeof ACTIVE_BIDS_COLUMNS[number] | typeof ACTIVE_JOBS_COLUMNS[number]

interface JobPageContentProps {
  job: string
}

export function JobPageContent({ job }: JobPageContentProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!['available', 'active-bids', 'active-jobs'].includes(job)) {
    notFound();
  }

  const jobType = job as JobType;
  const cards = getJobCards(jobType);
  
  const isAvailableJobs = jobType === "available";
  const isActiveBids = jobType === "active-bids";
  const isActiveJobs = jobType === "active-jobs";

  let segments = DEFAULT_SEGMENTS;
  let addButtonLabel = "Add Section";
  let columns: JobPageColumns[] = DEFAULT_COLUMNS;
  let data: JobPageData[] = jobsData[jobType];

  if (isAvailableJobs) {
    segments = AVAILABLE_JOBS_SEGMENTS;
    addButtonLabel = "Create Open Bid";
    columns = Array.from(availableJobsColumns) as JobPageColumns[];
    data = availableJobsData;
  } else if (isActiveBids) {
    segments = ACTIVE_BIDS_SEGMENTS;
    addButtonLabel = "Create Active Bid";
    columns = Array.from(ACTIVE_BIDS_COLUMNS) as JobPageColumns[];
    data = activeBidsData;
  } else if (isActiveJobs) {
    segments = ACTIVE_JOBS_SEGMENTS;
    addButtonLabel = "Create Active Job";
    columns = Array.from(ACTIVE_JOBS_COLUMNS) as JobPageColumns[];
    data = activeJobsData;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-3 md:py-6">
              {isAvailableJobs && (
                <CardActions
                  createButtonLabel={addButtonLabel}
                  onCreateClick={() => setSheetOpen(true)}
                />
              )}
              
              <SectionCards data={cards} />

              <OpenBidSheet open={sheetOpen} onOpenChange={setSheetOpen} />

              <DataTable<JobPageData>
                data={data}
                columns={columns}
                segments={segments}
                addButtonLabel={isAvailableJobs ? undefined : addButtonLabel}
                onAddClick={() => setSheetOpen(true)}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 