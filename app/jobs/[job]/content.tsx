"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { getJobCards } from "@/data/jobs-cards"
import { jobsData, type JobType, type JobData } from "@/data/jobs-data"
import { availableJobsColumns } from "@/data/available-jobs"
import { notFound } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { OpenBidSheet } from "@/components/open-bid-sheet";
import { CardActions } from "@/components/card-actions";
import { fetchBids } from "@/lib/api-client";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { format } from "date-fns";

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

type AvailableJob = {
  id: number
  contractNumber: string
  status: string
  requestor: string
  owner: string
  lettingDate: string | null
  dueDate: string | null
  county: string
  branch: string
  createdAt: string
  location: string
  platform: string
}

function mapJobsForTable(jobs: Database['public']['Tables']['available_jobs']['Row'][]) {
  return jobs.map(job => ({
    id: job.id,
    contractNumber: job.contract_number,
    status: job.status,
    requestor: job.requestor,
    owner: job.owner,
    lettingDate: job.letting_date ? format(new Date(job.letting_date), "yyyy-MM-dd") : null,
    dueDate: job.due_date ? format(new Date(job.due_date), "yyyy-MM-dd") : null,
    county: job.county,
    branch: job.branch,
    createdAt: job.created_at ? format(new Date(job.created_at), "yyyy-MM-dd'T'HH:mm:ss'Z'") : "",
    location: job.location,
    platform: job.platform
  }))
}

interface JobPageContentProps {
  job: string
}

export function JobPageContent({ job }: JobPageContentProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSegment, setActiveSegment] = useState("all")

  const handleSegmentChange = (value: string) => {
    setActiveSegment(value);
  };

  const loadAvailableJobs = useCallback(async () => {
    try {
      setLoading(true);
      // Map segment values to Supabase status values
      let statusFilter: 'Bid' | 'No Bid' | 'Unset' | undefined;
      if (activeSegment === 'bid') statusFilter = 'Bid';
      if (activeSegment === 'no-bid') statusFilter = 'No Bid';
      if (activeSegment === 'unset') statusFilter = 'Unset';
      
      const options = activeSegment !== "all" ? { status: statusFilter } : undefined;
      const data = await fetchBids(options);
      setAvailableJobs(mapJobsForTable(data));
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeSegment]);

  // Fetch jobs from Supabase
  useEffect(() => {
    if (job === 'available') {
      loadAvailableJobs();
    }
  }, [job, loadAvailableJobs]);

  if (!['available', 'active-bids', 'active-jobs'].includes(job)) {
    notFound();
  }

  const jobType = job as JobType;
  const cards = getJobCards(jobType);
  
  const isAvailableJobs = jobType === "available";
  const segments = isAvailableJobs ? AVAILABLE_JOBS_SEGMENTS : DEFAULT_SEGMENTS;
  const addButtonLabel = isAvailableJobs ? "Create Open Bid" : "Add Section";
  const columns = isAvailableJobs ? availableJobsColumns : DEFAULT_COLUMNS;
  const data = isAvailableJobs ? availableJobs : jobsData[jobType];

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

              <OpenBidSheet 
                open={sheetOpen} 
                onOpenChange={setSheetOpen} 
                onSuccess={() => {
                  if (isAvailableJobs) {
                    loadAvailableJobs();
                  }
                }}
              />

              {loading && isAvailableJobs ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : isAvailableJobs ? (
                <DataTable<AvailableJob>
                  data={data as AvailableJob[]}
                  columns={columns}
                  segments={segments}
                  segmentValue={activeSegment}
                  onSegmentChange={handleSegmentChange}
                  addButtonLabel={addButtonLabel}
                  onAddClick={() => setSheetOpen(true)}
                />
              ) : (
                <DataTable<JobData>
                  data={data as JobData[]}
                  columns={columns}
                  segments={segments}
                  addButtonLabel={addButtonLabel}
                  onAddClick={() => setSheetOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 