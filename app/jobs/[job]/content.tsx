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
import { CreateJobSheet } from "@/components/create-job-sheet";
import { CreateActiveBidSheet } from "@/components/create-active-bid-sheet";

interface JobPageContentProps {
  job: string
}

type JobPageData = AvailableJob | ActiveBid | ActiveJob;

export function JobPageContent({ job }: JobPageContentProps) {
  const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false)
  const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false)
  const [createActiveBidSheetOpen, setCreateActiveBidSheetOpen] = useState(false)

  if (!['available', 'active-bids', 'active-jobs'].includes(job)) {
    notFound();
  }

  const jobType = job as JobType;
  const cards = getJobCards(jobType);

  const isAvailableJobs = jobType === "available";
  const isActiveBids = jobType === "active-bids";
  const isActiveJobs = jobType === "active-jobs";

  let pageTitle = isAvailableJobs ? "Available Jobs" : 
                 isActiveBids ? "Active Bids" : 
                 "Active Jobs";

  let createButtonLabel = isAvailableJobs ? "Create Open Bid" : 
                         isActiveBids ? "Create Active Bid" : 
                         "Create Active Job";

  let data: JobPageData[] = isAvailableJobs ? availableJobsData :
                           isActiveBids ? activeBidsData :
                           activeJobsData;

  let columns = isAvailableJobs ? availableJobsColumns :
                isActiveBids ? ACTIVE_BIDS_COLUMNS :
                ACTIVE_JOBS_COLUMNS;

  let segments = isAvailableJobs ? [
    { label: "All", value: "all" },
    { label: "Unset", value: "unset" },
    { label: "No Bid", value: "no-bid" },
    { label: "Bid", value: "bid" },
  ] : isActiveBids ? ACTIVE_BIDS_SEGMENTS : ACTIVE_JOBS_SEGMENTS;

  const handleCreateClick = () => {
    if (isAvailableJobs) {
      setOpenBidSheetOpen(true);
    } else if (isActiveBids) {
      setCreateActiveBidSheetOpen(true);
    } else {
      setCreateJobSheetOpen(true);
    }
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
              <div className="flex items-center justify-between">
                <CardActions
                  createButtonLabel={createButtonLabel}
                  onCreateClick={handleCreateClick}
                />
              </div>

              <SectionCards data={cards} />

              <DataTable<JobPageData>
                data={data}
                columns={columns}
                segments={segments}
                stickyLastColumn
              />

              {isAvailableJobs && (
                <OpenBidSheet
                  open={openBidSheetOpen}
                  onOpenChange={setOpenBidSheetOpen}
                />
              )}

              {isActiveJobs && (
                <CreateJobSheet
                  open={createJobSheetOpen}
                  onOpenChange={setCreateJobSheetOpen}
                />
              )}

              {isActiveBids && (
                <CreateActiveBidSheet
                  open={createActiveBidSheetOpen}
                  onOpenChange={setCreateActiveBidSheetOpen}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 