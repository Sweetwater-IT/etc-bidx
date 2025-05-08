"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { getJobCards } from "@/data/jobs-cards";
import { type JobType } from "@/data/jobs-data";
import { availableJobsColumns } from "@/data/available-jobs";
import { ACTIVE_BIDS_COLUMNS, ACTIVE_BIDS_SEGMENTS, type ActiveBid } from "@/data/active-bids";
import { type ActiveJob } from "@/data/active-jobs";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { OpenBidSheet } from "@/components/open-bid-sheet";
import { CardActions } from "@/components/card-actions";
import { CreateJobSheet } from "@/components/create-job-sheet";
import { CreateActiveBidSheet } from "@/components/create-active-bid-sheet";
import { fetchBids, fetchActiveBids, archiveJobs, archiveActiveJobs, archiveActiveBids, deleteArchivedJobs, deleteArchivedActiveBids, changeBidStatus, changeActiveBidStatus, deleteArchivedActiveJobs } from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLoading } from "@/hooks/use-loading";
import { JobDetailsSheet } from "@/components/job-details-sheet"
import { ActiveJobDetailsSheet } from "@/components/active-job-details-sheet"
import { EditActiveJobSheet } from "@/components/edit-active-job-sheet"
import { ActiveBidDetailsSheet } from "@/components/active-bid-details-sheet"
import { EditActiveBidSheet } from "@/components/edit-active-bid-sheet"
import { EditJobNumberDialog } from "@/components/edit-job-number-dialog";
import { PencilIcon } from "lucide-react";

// Define the AvailableJob type based on the UI display needs
type AvailableJob = {
    id: number;
    contractNumber: string;
    status: "Bid" | "No Bid" | "Unset" | "Archived" | string;
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

export type JobPageData = AvailableJob | ActiveBid | ActiveJob;

export function JobPageContent({ job }: JobPageContentProps) {
    const router = useRouter();
    const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false);
    const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false);
    const [createActiveBidSheetOpen, setCreateActiveBidSheetOpen] = useState(false);
    const [nextJobNumber, setNextJobNumber] = useState<string>("");
    const [editJobNumberOpen, setEditJobNumberOpen] = useState(false);
    const [jobNumberYear, setJobNumberYear] = useState<string>("");
    const [jobNumberSequential, setJobNumberSequential] = useState<string>("");
    const [activeSegment, setActiveSegment] = useState("all");
    //THESE ARE OPEN BIDS
    //sets the table data
    const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
    //tracks the state of open bids to archive
    const [selectedJobsToArchive, setSelectedJobsToArchive] = useState<AvailableJob[]>([]);
    //tracks the state of open bids to delete when on the archived tab
    const [selectedJobsToDelete, setSelectedJobsToDelete] = useState<AvailableJob[]>([]);
    //tracks individual selected open bids when clicking on the row to open the editing sidebar
    const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null)
    //opens the confirmation to archive the open bids
    const [showArchiveJobsDialog, setShowArchiveJobsDialog] = useState(false);
    //opens the confirmation to delete the open bids
    const [showDeleteJobsDialog, setShowDeleteJobsDialog] = useState(false);
    //THESE ARE ESTIMATES
    const [selectedBidsToArchive, setSelectedBidsToArchive] = useState<ActiveBid[]>([]);
    const [selectedBidsToDelete, setSelectedBidsToDelete] = useState<ActiveBid[]>([]);
    const [showArchiveBidsDialog, setShowArchiveBidsDialog] = useState(false);
    const [showDeleteBidsDialog, setShowDeleteBidsDialog] = useState(false);
    const [activeBids, setActiveBids] = useState<ActiveBid[]>([]);
    //ACTIVE JOBS (IE WON JOBS)
    const [showArchiveActiveJobsDialog, setShowArchiveActiveJobsDialog] = useState<boolean>(false);
    const [showDeleteActiveJobsDialog, setShowDeleteActiveJobsDialog] = useState<boolean>(false);
    const [selectedActiveJobsToArchive, setSelectedActiveJobsToArchive] = useState<ActiveJob[]>([]);
    const [selectedActiveJobsToDelete, setSelectedActiveJobsToDelete] = useState<ActiveJob[]>([]);
    const [jobDetailsSheetOpen, setJobDetailsSheetOpen] = useState(false)
    const [editJobSheetOpen, setEditJobSheetOpen] = useState(false)
    const [selectedActiveJob, setSelectedActiveJob] = useState<ActiveJob| null>(null)
    const [activeJobDetailsSheetOpen, setActiveJobDetailsSheetOpen] = useState(false)
    const [editActiveJobSheetOpen, setEditActiveJobSheetOpen] = useState(false)
    const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);

    const activeJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);

    interface JobCounts {
        all: number;
        unset: number;
        'no-bid': number;
        bid: number;
        archived: number;
    }

    const [jobCounts, setJobCounts] = useState<JobCounts>({
        all: 0,
        unset: 0,
        'no-bid': 0,
        bid: 0,
        archived: 0
    });

    const [activeJobCounts, setActiveJobCounts] = useState({
        all: 0,
        west: 0,
        turbotville: 0,
        hatfield: 0,
        archived: 0
    });

    const availableJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const activeBidsTableRef = useRef<{ resetRowSelection: () => void }>(null);
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

            // Special handling for archived segment
            let options;
            if (activeSegment === "archived") {
                options = { status: "archived" };
                console.log("Using archived filter");

                // Note: The actual status values may vary in the UI vs database
            } else if (activeSegment !== "all") {
                const dbStatus = mapUiStatusToDbStatus(activeSegment);
                console.log("Mapped DB status:", dbStatus);
                options = { status: dbStatus };
            }
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

    // Load active bids data
    const loadActiveBids = useCallback(async () => {
        try {
            startLoading();

            let options;
            if (activeSegment !== "all") {
                options = { division: activeSegment };
            }

            const data = await fetchActiveBids(options);
            const mappedBids = data.map(bid => {
                return {
                    id: bid.id,
                    lettingDate: bid.letting_date ? format(new Date(bid.letting_date), "MMM d, yyyy") : "-",
                    contractNumber: bid.contract_number,
                    contractor: bid.contractor || "-",
                    subcontractor: bid.subcontractor || "-",
                    owner: bid.owner,
                    county: bid.county,
                    branch: bid.branch,
                    estimator: bid.estimator,
                    status: bid.status,
                    division: bid.division,
                    startDate: format(new Date(bid.start_date), "MMM d, yyyy"),
                    endDate: format(new Date(bid.end_date), "MMM d, yyyy"),
                    projectDays: bid.project_days,
                    totalHours: bid.total_hours,
                    mptValue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bid.mpt_value),
                    permSignValue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bid.perm_sign_value),
                    rentalValue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bid.rental_value),
                };
            });

            setActiveBids(mappedBids);
        } catch (error) {
            console.error("Error loading active bids:", error);
            toast.error("Failed to load active bids. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, startLoading, stopLoading]);

    const loadActiveJobs = useCallback(async () => {
        try {
            startLoading();
    
            const queryParams = new URLSearchParams();
            
            if (activeSegment === 'archived') {
                // Filter by status = 'Archived' instead of by branch
                queryParams.append('status', 'Archived');
            } else if (activeSegment !== 'all') {
                // When not 'all' or 'archived', filter by branch
                let branchCode;
                if (activeSegment === 'hatfield') {
                    branchCode = '10';
                } else if (activeSegment === 'turbotville') {
                    branchCode = '20';
                } else if (activeSegment === 'west') {
                    branchCode = '30';
                }
                
                if (branchCode) {
                    queryParams.append('branch', branchCode);
                }
            }
            
            const response = await fetch(`/api/jobs?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Error fetching jobs: ${response.statusText}`);
            }
            
            const data = await response.json();
            setActiveJobs(data);
            
            // Then fetch counts for all categories
            const allJobsResponse = await fetch('/api/jobs?counts=true');
            if (allJobsResponse.ok) {
                const counts = await allJobsResponse.json();
                
                setActiveJobCounts({
                    all: counts.all || 0,
                    west: counts.west || 0,
                    turbotville: counts.turbotville || 0,
                    hatfield: counts.hatfield || 0,
                    archived: counts.archived || 0
                });
            }
        } catch (error) {
            console.error("Error loading active jobs:", error);
            toast.error("Failed to load active jobs. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, startLoading, stopLoading]);
    const fetchNextJobNumber = useCallback(async () => {
        try {
            const response = await fetch('/api/jobs/next-job-number');
            if (!response.ok) {
                throw new Error('Failed to fetch next job number');
            }

            const data = await response.json();
            setNextJobNumber(data.nextJobNumber);

            if (data.nextJobNumber) {
                const parts = data.nextJobNumber.split('-');
                if (parts.length === 3) {
                    const yearAndSequential = parts[2]; // e.g., "2025001"
                    const year = yearAndSequential.substring(0, 4); // e.g., "2025"
                    const sequential = yearAndSequential.substring(4); // e.g., "001"

                    setJobNumberYear(year);
                    setJobNumberSequential(sequential);
                }
            }
        } catch (error) {
            console.error("Error fetching next job number:", error);
        }
    }, []);

    const handleUpdateJobNumber = useCallback(async (newSequential: string) => {
        try {
            const parts = nextJobNumber.split('-');
            if (parts.length !== 3) {
                throw new Error('Invalid job number format');
            }

            const branchCode = parts[0];
            const ownerTypeCode = parts[1];
            const sequentialNumber = parseInt(newSequential, 10);

            const checkResponse = await fetch('/api/jobs/check-job-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    branchCode,
                    ownerTypeCode,
                    year: parseInt(jobNumberYear, 10),
                    sequentialNumber
                }),
            });

            const checkData = await checkResponse.json();

            if (!checkData.isAvailable) {
                toast.error('This job number is already taken. Please choose another.');
                return false;
            }

            const newJobNumber = `${branchCode}-${ownerTypeCode}-${jobNumberYear}${newSequential}`;
            setNextJobNumber(newJobNumber);
            setJobNumberSequential(newSequential);

            return true;
        } catch (error) {
            console.error('Error updating job number:', error);
            toast.error('Failed to update job number');
            return false;
        }
    }, [nextJobNumber, jobNumberYear]);

    // This effect will run whenever activeSegment changes
    // Function to fetch job counts for all segments
    const fetchJobCounts = useCallback(async () => {
        if (!isAvailableJobs) return;

        try {
            startLoading();

            // Fetch all jobs with no status filter to get the true total count
            // Use a high limit to ensure we get all records
            const allJobs = await fetchBids({ limit: 1000 });

            // Fetch counts for each status separately
            const [unsetJobs, noBidJobs, bidJobs, archivedJobs] = await Promise.all([
                fetchBids({ status: "Unset", limit: 1000 }),   // Unset jobs
                fetchBids({ status: "No Bid", limit: 1000 }),  // No Bid jobs
                fetchBids({ status: "Bid", limit: 1000 }),     // Bid jobs
                fetchBids({ status: "archived", limit: 1000 }) // Archived jobs
            ]);

            setJobCounts({
                all: allJobs.length,          // Actual count from API without status filter
                unset: unsetJobs.length,      // Count of Unset jobs
                'no-bid': noBidJobs.length,   // Count of No Bid jobs
                bid: bidJobs.length,          // Count of Bid jobs
                archived: archivedJobs.length // Count of Archived jobs
            });
        } catch (error) {
            console.error("Error fetching job counts:", error);
            toast.error("Failed to fetch job counts");
        } finally {
            stopLoading();
        }
    }, [isAvailableJobs, startLoading, stopLoading]);

    useEffect(() => {
        if (isAvailableJobs) {
            loadAvailableJobs();
            fetchJobCounts();
        } else if (isActiveBids) {
            loadActiveBids();
        } else if (isActiveJobs) {
            loadActiveJobs();
        }
    }, [isAvailableJobs, isActiveBids, isActiveJobs, loadAvailableJobs, loadActiveBids, loadActiveJobs, activeSegment, fetchJobCounts]);

    // This effect will run when the job type changes
    useEffect(() => {
        if (job === "available") {
            loadAvailableJobs();
            fetchJobCounts();
        } else if (job === "active-bids") {
            loadActiveBids();
        } else if (job === "active-jobs") {
            loadActiveJobs();
            fetchNextJobNumber(); // Fetch next job number when active-jobs is selected
        }
    }, [job, loadAvailableJobs, loadActiveBids, loadActiveJobs, fetchJobCounts, fetchNextJobNumber]);

    useEffect(() => {
        console.log("Sheet state changed:", {
            isActiveBids,
            createActiveBidSheetOpen,
        });
    }, [isActiveBids, createActiveBidSheetOpen]);

    const createButtonLabel = isAvailableJobs ? "Create Open Bid" : isActiveBids ? "Create Active Bid" : "Create Active Job";

    const data: JobPageData[] = isAvailableJobs ? availableJobs : isActiveBids ? activeBids : activeJobs;

    // Custom columns for active jobs that match the image
    const DISPLAYED_ACTIVE_JOBS_COLUMNS = [
        { key: "jobNumber", title: "Job Number" },
        { key: "bidNumber", title: "Bid Number" },
        { key: "projectStatus", title: "Project Status" },
        { key: "billingStatus", title: "Billing Status" },
        { key: "contractNumber", title: "Contract Number" },
        { key: "location", title: "Location" },
        { key: "county", title: "County" },
        { key: "branch", title: "Branch" },
        { key: "contractor", title: "Contractor" },
        { key: "startDate", title: "Start Date" },
        { key: "endDate", title: "End Date" },
    ];

    const columns = isAvailableJobs ? availableJobsColumns : isActiveBids ? ACTIVE_BIDS_COLUMNS : DISPLAYED_ACTIVE_JOBS_COLUMNS;

    const handleMarkAsBidJob = useCallback((job: AvailableJob) => {
        console.log('Marking job as bid job:', job);

        const queryParams = new URLSearchParams({
            jobId: job.id.toString(),
            source: 'available-jobs'
        }).toString();

        router.push(`/active-bid?${queryParams}`);
    }, [router]);

    const handleUpdateStatus = useCallback(async (job: AvailableJob, status: 'Bid' | 'No Bid' | 'Unset') => {
        try {
            startLoading();
            await changeBidStatus(job.id, status);
            toast.success(`Job status updated to ${status}`);
            await loadAvailableJobs();
            await fetchJobCounts();
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('Failed to update job status');
        } finally {
            stopLoading();
        }
    }, [loadAvailableJobs, fetchJobCounts, startLoading, stopLoading]);

    const handleUpdateActiveBidStatus = useCallback(async (bid: ActiveBid, status: 'Won' | 'Pending' | 'Lost' | 'Draft' | 'Won - Pending') => {
        try {
            startLoading();
            await changeActiveBidStatus(bid.id, status);

            setActiveBids(prevBids =>
                prevBids.map(item =>
                    item.id === bid.id ? { ...item, status } : item
                )
            );

            toast.success(`Bid status updated to ${status}`);
        } catch (error) {
            console.error('Error updating bid status:', error);
            toast.error('Failed to update bid status');
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    const handleEdit = (item: AvailableJob) => {
        console.log('Edit clicked:', item)
        setSelectedJob(item)
        setEditJobSheetOpen(true)
    }

    const initiateArchiveJobs = (selectedJobs: AvailableJob[]) => {
        setSelectedJobsToArchive(selectedJobs);
        setShowArchiveJobsDialog(true);
    };

    //active jobs i.e. jobs 
    const initiateArchiveActiveJobs = (selectedJobs: ActiveJob[]) => {
        setSelectedActiveJobsToArchive(selectedJobs);
        setShowArchiveActiveJobsDialog(true);
    };
    const initiateDeleteActiveJobs = (selectedJobs: ActiveJob[]) => {
        console.log('initiateDeleteActiveJobs called with:', selectedJobs);

        if (activeSegment === 'archived') {
            setSelectedActiveJobsToDelete(selectedJobs);
            setShowDeleteActiveJobsDialog(true);
            return;
        }

        const archivedJobs = selectedJobs.filter(job => {
            return job.status.toLowerCase().includes('archived');
        });

        if (archivedJobs.length === 0) {
            console.log('No archived jobs found, showing error');
            toast.error('Only archived jobs can be deleted. Please select archived jobs.');
            return;
        }

        if (archivedJobs.length !== selectedJobs.length) {
            toast.warning(`${selectedJobs.length - archivedJobs.length} non-archived job(s) will be skipped.`);
        }

        console.log('Setting selected jobs to delete and showing dialog');
        setSelectedActiveJobsToDelete(archivedJobs);
        setShowDeleteActiveJobsDialog(true);
    };
    const handleArchiveActiveJobs = async () => {
        try {
            startLoading();
            const ids = selectedActiveJobsToArchive.map(job => job.jobNumber);

            await archiveActiveJobs(ids)

            toast.success(`Successfully archived ${ids.length} job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveJobs();

            // Reset row selection after successful archive
            if (activeJobsTableRef.current) {
                activeJobsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error archiving jobs:', error);
            toast.error('Failed to archive jobs. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };
    const handleDeleteActiveJobs = async () => {
        try {
            startLoading();
            const ids = selectedActiveJobsToDelete.map(job => job.jobNumber);

            await deleteArchivedActiveJobs(ids)

            const count = ids.length;

            toast.success(`Successfully deleted ${count} archived job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveJobs();

            if (activeJobsTableRef.current) {
                activeJobsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error deleting archived jobs:', error);
            toast.error('Failed to delete archived jobs. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };

    const handleArchiveActiveJob = (item: ActiveJob) => {
        console.log('Archive clicked for active job:', item);

        if ('jobNumber' in item) {
            // This is an active job
            initiateArchiveActiveJobs([item as ActiveJob]);
        }
    };

    // Implementation of handleJobDeletion (for single job deletion)
    const handleDeleteActiveJob = (item: ActiveJob) => {
        console.log('Delete clicked for active job:', item);

        if ('jobNumber' in item) {
            if (item.status.toLowerCase().includes('archived')) {
                initiateDeleteActiveJobs([item]);
            } else {
                toast.error('Only archived jobs can be deleted');
            }
        }
    };

    const handleArchiveAvailableJobs = async () => {
        try {
            startLoading();
            const ids = selectedJobsToArchive.map(job => job.id);

            await archiveJobs(ids);

            toast.success(`Successfully archived ${ids.length} job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadAvailableJobs();

            // Reset row selection after successful archive
            if (availableJobsTableRef.current) {
                availableJobsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error archiving jobs:', error);
            toast.error('Failed to archive jobs. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };

    const initiateArchiveBids = (selectedBids: ActiveBid[]) => {
        setSelectedBidsToArchive(selectedBids);
        setShowArchiveBidsDialog(true);
    };

    const initiateDeleteJobs = (selectedJobs: AvailableJob[]) => {
        console.log('initiateDeleteJobs called with:', selectedJobs);

        if (activeSegment === 'archived') {
            setSelectedJobsToDelete(selectedJobs);
            setShowDeleteJobsDialog(true);
            return;
        }

        const archivedJobs = selectedJobs.filter(job => {
            return job.status?.toLowerCase().includes('archived');
        });

        if (archivedJobs.length === 0) {
            console.log('No archived jobs found, showing error');
            toast.error('Only archived jobs can be deleted. Please select archived jobs.');
            return;
        }

        if (archivedJobs.length !== selectedJobs.length) {
            toast.warning(`${selectedJobs.length - archivedJobs.length} non-archived job(s) will be skipped.`);
        }

        console.log('Setting selected jobs to delete and showing dialog');
        setSelectedJobsToDelete(archivedJobs);
        setShowDeleteJobsDialog(true);
    };

    const handleDeleteArchivedJobs = async () => {
        try {
            startLoading();
            const ids = selectedJobsToDelete.map(job => job.id);

            const result = await deleteArchivedJobs(ids);

            toast.success(`Successfully deleted ${result.count} archived job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadAvailableJobs();

            if (availableJobsTableRef.current) {
                availableJobsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error deleting archived jobs:', error);
            toast.error('Failed to delete archived jobs. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };

    const initiateDeleteBids = (selectedBids: ActiveBid[]) => {
        console.log('initiateDeleteBids called with:', selectedBids);

        if (activeSegment === 'archived') {
            setSelectedBidsToDelete(selectedBids);
            setShowDeleteBidsDialog(true);
            return;
        }

        const archivedBids = selectedBids.filter(bid => {
            return bid.status.toLowerCase().includes('archived');
        });

        if (archivedBids.length === 0) {
            toast.error('Only archived bids can be deleted. Please select archived bids.');
            return;
        }

        if (archivedBids.length !== selectedBids.length) {
            toast.warning(`${selectedBids.length - archivedBids.length} non-archived bid(s) will be skipped.`);
        }

        setSelectedBidsToDelete(archivedBids);
        setShowDeleteBidsDialog(true);
    };

    const handleDeleteArchivedBids = async () => {
        try {
            startLoading();
            const ids = selectedBidsToDelete.map(bid => bid.id);

            const result = await deleteArchivedActiveBids(ids);

            toast.success(`Successfully deleted ${result.count} archived bid(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveBids();

            if (activeBidsTableRef.current) {
                activeBidsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error deleting archived bids:', error);
            toast.error('Failed to delete archived bids. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };

    const handleArchiveActiveBids = async () => {
        try {
            startLoading();
            const ids = selectedBidsToArchive.map(bid => bid.id);

            const nonArchivedBids = selectedBidsToArchive.filter(bid => !bid.status.toLowerCase().includes('archived'));
            if (nonArchivedBids.length !== selectedBidsToArchive.length) {
                toast.warning(`${selectedBidsToArchive.length - nonArchivedBids.length} bid(s) are already archived and will be skipped.`);
            }

            if (nonArchivedBids.length === 0) {
                toast.error('No bids to archive. All selected bids are already archived.');
                return false;
            }

            await archiveActiveBids(ids);

            toast.success(`Successfully archived ${ids.length} bid(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveBids();

            // Reset row selection after successful archive
            if (activeBidsTableRef.current) {
                activeBidsTableRef.current.resetRowSelection();
            }

            return true;
        } catch (error) {
            console.error('Error archiving bids:', error);
            toast.error('Failed to archive bids. Please try again.', {
                duration: 5000,
                position: 'top-center'
            });
            return false;
        } finally {
            stopLoading();
        }
    };

    const handleViewDetails = (item: AvailableJob) => {
        setSelectedJob(item)
        setJobDetailsSheetOpen(true)
    }

    const segments = isAvailableJobs
        ? [
            { label: `All (${jobCounts.all || 0})`, value: "all" },
            { label: `Unset (${jobCounts.unset || 0})`, value: "unset" },
            { label: `No Bid (${jobCounts['no-bid'] || 0})`, value: "no-bid" },
            { label: `Bid (${jobCounts.bid || 0})`, value: "bid" },
            { label: `Archived (${jobCounts.archived || 0})`, value: "archived" },
        ]
        : isActiveBids
            ? ACTIVE_BIDS_SEGMENTS
            : [
                { label: `All (${activeJobCounts.all || 0})`, value: "all" },
                { label: `West (${activeJobCounts.west || 0})`, value: "west" },
                { label: `Turbotville (${activeJobCounts.turbotville || 0})`, value: "turbotville" },
                { label: `Hatfield (${activeJobCounts.hatfield || 0})`, value: "hatfield" },
                { label: `Archived (${activeJobCounts.archived || 0})`, value: "archived" },
            ];

    const handleCreateClick = () => {
        if (isAvailableJobs) {
            setOpenBidSheetOpen(true);
        } else if (isActiveBids) {
            // Route to the active-bid page instead of opening a sheet
            router.push("/active-bid");
        } else if (isActiveJobs) {
            setCreateJobSheetOpen(true);
        }
    }

    const handleActiveJobViewDetails = (item: ActiveJob) => {
        console.log('View details clicked:', item)
        setSelectedActiveJob(item)
        setActiveJobDetailsSheetOpen(true)
    }

    const handleActiveJobEdit = (item: ActiveJob) => {
        console.log('Edit clicked:', item)
        setSelectedActiveJob(item)
        setEditActiveJobSheetOpen(true)
    }

    const handleArchive = (item: AvailableJob) => {
        console.log('Archive clicked:', item)
        initiateArchiveJobs([item])
    }

    const ActiveBidsTable = ({ bids }: { bids: ActiveBid[] }) => {
        const [selectedBid, setSelectedBid] = useState<ActiveBid | undefined>(undefined);
        const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
        const [editSheetOpen, setEditSheetOpen] = useState(false);

        const handleRowClick = (item: JobPageData) => {
            if ('lettingDate' in item) { // Check if it's an ActiveBid
                setSelectedBid(item as ActiveBid);
                setDetailsSheetOpen(true);
            }
        };

        const handleEdit = (item: JobPageData) => {
            if ('lettingDate' in item) { // Check if it's an ActiveBid
                setSelectedBid(item as ActiveBid);
                setDetailsSheetOpen(false);
                setEditSheetOpen(true);
            }
        };

        const handleEditSuccess = () => {
            setEditSheetOpen(false);
            // TODO: Refresh the bids data
        };

        return (
            <>
                <DataTable<ActiveBid>
                    columns={ACTIVE_BIDS_COLUMNS}
                    data={bids}
                    onRowClick={handleRowClick}
                    segments={ACTIVE_BIDS_SEGMENTS}
                    segmentValue={activeSegment}
                    onSegmentChange={handleSegmentChange}
                    stickyLastColumn
                    onArchiveSelected={initiateArchiveBids}
                    onDeleteSelected={initiateDeleteBids}
                    tableRef={activeBidsTableRef}
                    onViewDetails={(item) => {
                        if ('lettingDate' in item) {
                            setSelectedBid(item as ActiveBid);
                            setDetailsSheetOpen(true);
                        }
                    }}
                    onEdit={handleEdit}
                    onUpdateStatus={(item, status) => {
                        if ('lettingDate' in item) {
                            // For active bids, the status passed from the DataTable component is already
                            // in the correct format ('Won', 'Pending', 'Lost', etc.) because we're showing those
                            // exact values in the dropdown menu
                            const bidStatus = status as 'Won' | 'Pending' | 'Lost' | 'Draft' | 'Won - Pending';
                            handleUpdateActiveBidStatus(item as ActiveBid, bidStatus);
                        }
                    }}
                />
                <ActiveBidDetailsSheet
                    open={detailsSheetOpen}
                    onOpenChange={setDetailsSheetOpen}
                    bid={selectedBid}
                    onEdit={handleEdit}
                />
                <EditActiveBidSheet
                    open={editSheetOpen}
                    onOpenChange={setEditSheetOpen}
                    bid={selectedBid}
                    onSuccess={handleEditSuccess}
                />
            </>
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
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <CardActions
                                            createButtonLabel={createButtonLabel}
                                            onCreateClick={handleCreateClick}
                                            onImportSuccess={isAvailableJobs ? loadAvailableJobs : isActiveBids ? loadActiveBids : undefined}
                                            importType={isAvailableJobs ? 'available-jobs' : 'active-bids'}
                                        />
                                    </div>
                                    {isActiveJobs && nextJobNumber && (
                                        <div className="text-sm text-muted-foreground px-6 flex items-center justify-end gap-2">
                                            <span className="font-medium">Next job number:</span> {nextJobNumber.split('-')[2]}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setEditJobNumberOpen(true)}
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <SectionCards data={cards} />

                            {isAvailableJobs ? (
                                <DataTable<AvailableJob>
                                    data={data as AvailableJob[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    onSegmentChange={handleSegmentChange}
                                    onArchiveSelected={initiateArchiveJobs}
                                    onDeleteSelected={initiateDeleteJobs}
                                    tableRef={availableJobsTableRef}
                                    onViewDetails={handleViewDetails}
                                    onEdit={handleEdit}
                                    onArchive={handleArchive}
                                    onMarkAsBidJob={handleMarkAsBidJob}
                                    onUpdateStatus={(item, status: string) => {
                                        // Map segment values to proper status values if needed
                                        let statusValue: 'Bid' | 'No Bid' | 'Unset';

                                        if (status === 'Bid' || status === 'No Bid' || status === 'Unset') {
                                            statusValue = status as 'Bid' | 'No Bid' | 'Unset';
                                        } else if (status === 'bid') {
                                            statusValue = 'Bid';
                                        } else if (status === 'no-bid') {
                                            statusValue = 'No Bid';
                                        } else if (status === 'unset') {
                                            statusValue = 'Unset';
                                        } else {
                                            console.error('Invalid status value:', status);
                                            return;
                                        }

                                        handleUpdateStatus(item, statusValue);
                                    }}
                                    stickyLastColumn
                                />
                            ) : isActiveBids ? (
                                <ActiveBidsTable bids={data as ActiveBid[]} />
                            ) : (
                                <DataTable<ActiveJob>
                                    data={data as ActiveJob[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    onSegmentChange={handleSegmentChange}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveActiveJobs}
                                    onDeleteSelected={initiateDeleteActiveJobs}
                                    tableRef={activeJobsTableRef}
                                    onViewDetails={(item) => {
                                        if ('jobNumber' in item) {
                                            handleActiveJobViewDetails(item as ActiveJob);
                                        }
                                    }}
                                    onEdit={(item) => {
                                        if ('jobNumber' in item) {
                                            handleActiveJobEdit(item as ActiveJob);
                                        }
                                    }}
                                    onArchive={handleArchiveActiveJob}
                                />
                            )}

                            {isAvailableJobs && (
                                <>
                                    <OpenBidSheet
                                        open={openBidSheetOpen}
                                        onOpenChange={setOpenBidSheetOpen}
                                        onSuccess={loadAvailableJobs}
                                    />
                                    <JobDetailsSheet
                                        open={jobDetailsSheetOpen}
                                        onOpenChange={setJobDetailsSheetOpen}
                                        job={selectedJob || undefined}
                                        onEdit={handleEdit}
                                    />
                                    <OpenBidSheet
                                        open={editJobSheetOpen}
                                        onOpenChange={setEditJobSheetOpen}
                                        onSuccess={loadAvailableJobs}
                                        job={selectedJob || undefined}
                                    />
                                </>
                            )}

                            {isActiveJobs && (
                                <>
                                    <ActiveJobDetailsSheet
                                        open={activeJobDetailsSheetOpen}
                                        onOpenChange={setActiveJobDetailsSheetOpen}
                                        job={selectedActiveJob || undefined}
                                        onEdit={handleActiveJobEdit}
                                    />
                                    <EditActiveJobSheet
                                        open={editActiveJobSheetOpen}
                                        onOpenChange={setEditActiveJobSheetOpen}
                                        job={selectedActiveJob || undefined}
                                        onSuccess={loadAvailableJobs}
                                    />
                                </>
                            )}

                            {createJobSheetOpen && <CreateJobSheet open={createJobSheetOpen} onOpenChange={setCreateJobSheetOpen} customSequentialNumber={jobNumberSequential} onSuccess={loadActiveJobs} />}
                            {createActiveBidSheetOpen && <CreateActiveBidSheet open={createActiveBidSheetOpen} onOpenChange={setCreateActiveBidSheetOpen} />}

                            <ConfirmArchiveDialog
                                isOpen={showArchiveJobsDialog}
                                onClose={() => setShowArchiveJobsDialog(false)}
                                onConfirm={handleArchiveAvailableJobs}
                                itemCount={selectedJobsToArchive.length}
                                itemType="job"
                            />

                            <ConfirmArchiveDialog
                                isOpen={showArchiveBidsDialog}
                                onClose={() => setShowArchiveBidsDialog(false)}
                                onConfirm={handleArchiveActiveBids}
                                itemCount={selectedBidsToArchive.length}
                                itemType="bid"
                            />

                            <ConfirmDeleteDialog
                                isOpen={showDeleteJobsDialog}
                                onClose={() => setShowDeleteJobsDialog(false)}
                                onConfirm={handleDeleteArchivedJobs}
                                itemCount={selectedJobsToDelete.length}
                                itemType="job"
                            />

                            <ConfirmDeleteDialog
                                isOpen={showDeleteBidsDialog}
                                onClose={() => setShowDeleteBidsDialog(false)}
                                onConfirm={handleDeleteArchivedBids}
                                itemCount={selectedBidsToDelete.length}
                                itemType="bid"
                            />

                            <ConfirmArchiveDialog
                                isOpen={showArchiveActiveJobsDialog}
                                onClose={() => setShowArchiveActiveJobsDialog(false)}
                                onConfirm={handleArchiveActiveJobs}
                                itemCount={selectedActiveJobsToArchive.length}
                                itemType="job"
                            />

                            <ConfirmDeleteDialog
                                isOpen={showDeleteActiveJobsDialog}
                                onClose={() => setShowDeleteActiveJobsDialog(false)}
                                onConfirm={handleDeleteActiveJobs}
                                itemCount={selectedActiveJobsToDelete.length}
                                itemType="job"
                            />

                            <EditJobNumberDialog
                                isOpen={editJobNumberOpen}
                                onClose={() => setEditJobNumberOpen(false)}
                                currentSequential={jobNumberSequential}
                                year={jobNumberYear}
                                onSave={handleUpdateJobNumber}
                            />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
