"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { getJobCards } from "@/data/jobs-cards";
import { type JobType } from "@/data/jobs-data";
import { availableJobsColumns } from "@/data/available-jobs";
import { activeBidsData, ACTIVE_BIDS_COLUMNS, ACTIVE_BIDS_SEGMENTS, type ActiveBid } from "@/data/active-bids";
import { activeJobsData, ACTIVE_JOBS_COLUMNS, ACTIVE_JOBS_SEGMENTS, type ActiveJob } from "@/data/active-jobs";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { OpenBidSheet } from "@/components/open-bid-sheet";
import { CardActions } from "@/components/card-actions";
import { CreateJobSheet } from "@/components/create-job-sheet";
import { CreateActiveBidSheet } from "@/components/create-active-bid-sheet";
import { fetchBids } from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLoading } from "@/hooks/use-loading";

// Define the AvailableJob type based on the UI display needs
type AvailableJob = {
    id: number;
    contractNumber: string;
    status: "Bid" | "No Bid" | "Unset";
    requestor: string;
    owner: string;
    lettingDate: string | null;
    dueDate: string | null;
    county: string;
    branch: string;
    createdAt: string;
    location: string;
    platform: string;
};

// Map between UI status and database status
const mapUiStatusToDbStatus = (uiStatus?: string): "Bid" | "No Bid" | "Unset" | undefined => {
    if (uiStatus === "bid") return "Bid";
    if (uiStatus === "no-bid") return "No Bid";
    if (uiStatus === "unset") return "Unset";
    return undefined;
};

const mapDbStatusToUiStatus = (dbStatus: string): "Bid" | "No Bid" | "Unset" => {
    if (dbStatus === "Bid") return "Bid";
    if (dbStatus === "No Bid") return "No Bid";
    if (dbStatus === "Unset") return "Unset";
    return "Unset"; // Default fallback
};

interface JobPageContentProps {
    job: string;
}

type JobPageData = AvailableJob | ActiveBid | ActiveJob;

export function JobPageContent({ job }: JobPageContentProps) {
    const router = useRouter();
    const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false);
    const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false);
    const [createActiveBidSheetOpen, setCreateActiveBidSheetOpen] = useState(false);
    const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
    const [activeSegment, setActiveSegment] = useState("all");
    const { startLoading, stopLoading } = useLoading();

    if (!["available", "active-bids", "active-jobs"].includes(job)) {
        notFound();
    }

    const jobType = job as JobType;
    const cards = getJobCards(jobType);

    const isAvailableJobs = jobType === "available";
    const isActiveBids = jobType === "active-bids";
    const isActiveJobs = jobType === "active-jobs";

    const handleSegmentChange = (value: string) => {
        console.log("Segment changed to:", value);
        setActiveSegment(value);
    };

    const loadAvailableJobs = useCallback(async () => {
        try {
            console.log("Loading available jobs with activeSegment:", activeSegment);
            startLoading();

            const dbStatus = mapUiStatusToDbStatus(activeSegment);
            console.log("Mapped DB status:", dbStatus);

            const options = activeSegment !== "all" ? { status: dbStatus } : undefined;
            console.log("Fetch options:", options);

            const data = await fetchBids(options);
            console.log("Fetched data:", data);

            const uiJobs = data.map((job) => ({
                id: job.id,
                contractNumber: job.contract_number,
                status: mapDbStatusToUiStatus(job.status),
                requestor: job.requestor,
                owner: job.owner,
                lettingDate: job.letting_date ? format(new Date(job.letting_date), "yyyy-MM-dd") : null,
                dueDate: job.due_date ? format(new Date(job.due_date), "yyyy-MM-dd") : null,
                county: job.county,
                branch: job.branch,
                createdAt: job.created_at ? format(new Date(job.created_at), "yyyy-MM-dd'T'HH:mm:ss'Z'") : "",
                location: job.location,
                platform: job.platform,
            }));

            setAvailableJobs(uiJobs);
        } catch (error) {
            console.error("Error loading jobs:", error);
            toast.error("Failed to load jobs. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, startLoading, stopLoading]);

    useEffect(() => {
        if (job === "available") {
            loadAvailableJobs();
        }
    }, [job, loadAvailableJobs]);

    useEffect(() => {
        console.log("Sheet state changed:", {
            isActiveBids,
            createActiveBidSheetOpen,
        });
    }, [isActiveBids, createActiveBidSheetOpen]);

    const createButtonLabel = isAvailableJobs ? "Create Open Bid" : isActiveBids ? "Create Active Bid" : "Create Active Job";

    const data: JobPageData[] = isAvailableJobs ? availableJobs : isActiveBids ? activeBidsData : activeJobsData;

    const columns = isAvailableJobs ? availableJobsColumns : isActiveBids ? ACTIVE_BIDS_COLUMNS : ACTIVE_JOBS_COLUMNS;

    const segments = isAvailableJobs
        ? [
              { label: "All", value: "all" },
              { label: "Unset", value: "unset" },
              { label: "No Bid", value: "no-bid" },
              { label: "Bid", value: "bid" },
              { label: "Archived", value: "archived" }, // Added from new-tab-archived
          ]
        : isActiveBids
        ? ACTIVE_BIDS_SEGMENTS
        : ACTIVE_JOBS_SEGMENTS;

    const handleCreateClick = () => {
        if (isAvailableJobs) {
            setOpenBidSheetOpen(true);
        } else if (isActiveBids) {
            router.push("/active-bid");
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
                                    onImportSuccess={isAvailableJobs ? loadAvailableJobs : undefined}
                                />
                            </div>

                            <SectionCards data={cards} />

                            {isAvailableJobs ? (
                                <DataTable<AvailableJob>
                                    data={data as AvailableJob[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    onSegmentChange={handleSegmentChange}
                                />
                            ) : (
                                <DataTable<JobPageData> data={data as JobPageData[]} columns={columns} segments={segments} stickyLastColumn />
                            )}

                            {isAvailableJobs && <OpenBidSheet open={openBidSheetOpen} onOpenChange={setOpenBidSheetOpen} onSuccess={loadAvailableJobs} />}

                            {isActiveJobs && <CreateJobSheet open={createJobSheetOpen} onOpenChange={setCreateJobSheetOpen} />}

                            {isActiveBids && <CreateActiveBidSheet open={createActiveBidSheetOpen} onOpenChange={setCreateActiveBidSheetOpen} />}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
