"use client";

import { AppSidebar } from "../../../components/app-sidebar";
import { SectionCards } from "../../../components/section-cards";
import { Button } from "../../../components/ui/button";
import { DataTable } from "../../../components/data-table";
import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import { SiteHeader } from "../../../components/site-header";
import { availableJobsColumns, AvailableJobServices } from "../../../data/available-jobs";
import { FilterOption } from "../../../components/table-controls";
import { ACTIVE_BIDS_COLUMNS, type ActiveBid } from "../../../data/active-bids";
import { type ActiveJob } from "../../../data/active-jobs";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmArchiveDialog } from "../../../components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "../../../components/confirm-delete-dialog";
import { OpenBidSheet } from "../../../components/open-bid-sheet";
import { CardActions } from "../../../components/card-actions";
import { CreateJobSheet } from "../../../components/create-job-sheet";
import { fetchBids, fetchActiveBids, archiveJobs, archiveActiveJobs, archiveActiveBids, deleteArchivedJobs, deleteArchivedActiveBids, changeBidStatus, changeActiveBidStatus, deleteArchivedActiveJobs } from "../../../lib/api-client";
import { toast } from "sonner";
import { useLoading } from "../../../hooks/use-loading";
import { ActiveJobDetailsSheet } from "../../../components/active-job-details-sheet"
import { EditActiveJobSheet } from "../../../components/edit-active-job-sheet"
import { ActiveBidDetailsSheet } from "../../../components/active-bid-details-sheet"
import { EditJobNumberDialog } from "../../../components/edit-job-number-dialog";
import { PencilIcon } from "lucide-react";
import { AvailableJob } from "../../../data/available-jobs";
import { JobDetailsSheet } from "../../../components/job-details-sheet";
import BidItemsStep5 from "../../../components/pages/active-bid/steps/bid-items-step5";
import { DateRange } from "react-day-picker";
import { useCustomers } from "@/hooks/use-customers";
import { exportAvailableJobsToExcel } from "@/lib/exportAvailableJobsToExcel";
import { EstimateData, exportBidsToExcel } from "@/lib/exportBidsToExcel";
import { EstimateProvider } from "@/contexts/EstimateContext";
import { BidSummaryDrawer } from "@/components/bid-summary-drawer";

// Map between UI status and database status
const mapUiStatusToDbStatus = (uiStatus?: string): "Bid" | "No Bid" | "Unset" | undefined => {
    if (uiStatus === "bid") return "Bid";
    if (uiStatus === "no-bid") return "No Bid";
    if (uiStatus === "unset") return "Unset";
    return undefined;
};

interface JobPageContentProps {
    job: string;
}

export type JobPageData = AvailableJob | ActiveBid | ActiveJob;

export function JobPageContent({ job }: JobPageContentProps) {
    const router = useRouter();
    const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false);
    const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false);
    const [nextJobNumber, setNextJobNumber] = useState<string>("");
    const [editJobNumberOpen, setEditJobNumberOpen] = useState(false);
    const [jobNumberYear, setJobNumberYear] = useState<string>("");
    const [jobNumberSequential, setJobNumberSequential] = useState<string>("");
    const [activeSegment, setActiveSegment] = useState("all");
    //THESE ARE OPEN BIDS
    //sets the table data
    const [isCreatingAvailableJob, setIsCreatingAvailableJob] = useState<boolean>(false);
    const [allAvailableJobRowsSelected, setAllAvailableJobRowsSelected] = useState<boolean>(false);
    const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
    const [availableJobsPageIndex, setAvailableJobsPageIndex] = useState(0);
    const [availableJobsPageSize, setAvailableJobsPageSize] = useState(25);
    const [availableJobsPageCount, setAvailableJobsPageCount] = useState(0);
    const [availableJobsTotalCount, setAvailableJobsTotalCount] = useState(0);
    const [selectedAvailableJobs, setSelectedAvailableJobs] = useState<AvailableJob[]>([]);
    const [isEditingAvailableJob, setIsEditingAvailableJob] = useState<boolean>(false)
    //tracks individual selected open bids when clicking on the row to open the editing sidebar
    const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null)
    //opens the confirmation to archive the open bids
    const [showArchiveJobsDialog, setShowArchiveJobsDialog] = useState(false);
    //opens the confirmation to delete the open bids
    const [showDeleteJobsDialog, setShowDeleteJobsDialog] = useState(false);
    // Sorting state for available jobs
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    // Filtering state for available jobs
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [cardData, setCardData] = useState<{ title: string, value: string }[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showFilters, setShowFilters] = useState(false);

    const [allActiveBidRowsSelected, setAllActiveBidRowsSelected] = useState<boolean>(false);
    const [selectedActiveBids, setSelectedActiveBids] = useState<ActiveBid[]>([]);

    // Reference data for dropdowns and filters
    const [referenceData, setReferenceData] = useState<{
        counties: { id: number; name: string }[];
        owners: { id: number; name: string }[];
        branches: { id: number; name: string; code: string }[];
        estimators: { id: number; name: string }[];
    }>({
        counties: [],
        owners: [],
        branches: [],
        estimators: [],
    });

    // Define filter options for the Available Jobs table
    const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

    // Fetch reference data for filters
    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                // Fetch counties
                const countiesResponse = await fetch('/api/reference-data?type=counties');
                const countiesData = await countiesResponse.json();

                // Fetch owners
                const ownersResponse = await fetch('/api/reference-data?type=owners');
                const ownersData = await ownersResponse.json();

                // Fetch branches
                const branchesResponse = await fetch('/api/reference-data?type=branches');
                const branchesData = await branchesResponse.json();

                // Fetch estimators
                const estimatorsResponse = await fetch('/api/reference-data?type=estimators');
                const estimatorsData = await estimatorsResponse.json();

                setReferenceData({
                    counties: countiesData.data || [],
                    owners: ownersData.data || [],
                    branches: branchesData.data || [],
                    estimators: estimatorsData.data || [],
                });
            } catch (error) {
                console.error('Error fetching reference data:', error);
            }
        };

        fetchReferenceData();
    }, []);

    // Initialize filter options when reference data is loaded
    useEffect(() => {
        if (referenceData.counties.length > 0 || referenceData.owners.length > 0 || referenceData.branches.length > 0) {
            const options: FilterOption[] = [
                {
                    label: 'County',
                    field: 'county',
                    options: referenceData.counties.map(county => ({
                        label: county.name,
                        value: county.name
                    }))
                },
                {
                    label: 'Owner',
                    field: 'owner',
                    options: referenceData.owners.map(owner => ({
                        label: owner.name,
                        value: owner.name
                    }))
                },
                {
                    label: isAvailableJobs ? 'Requestor' : 'Estimator',
                    field: 'requestor',
                    options: referenceData.estimators.map(estimator => ({
                        label: estimator.name,
                        value: estimator.name
                    }))
                },
                {
                    label: 'Branch',
                    field: 'branch',
                    options: referenceData.branches.map(branch => ({
                        label: branch.name,
                        value: branch.code
                    }))
                },
                {
                    label: 'Status',
                    field: 'status',
                    options: [
                        { label: 'Bid', value: 'Bid' },
                        { label: 'No Bid', value: 'No Bid' },
                        { label: 'Unset', value: 'Unset' }
                    ]
                }
            ];
            setFilterOptions(options);
        }
    }, [referenceData]);

    // Branch options for filter dialog
    const branchOptions = referenceData.branches.map(branch => ({
        label: branch.name || '',
        value: branch.name || ''
    }));

    // Owner options for filter dialog
    const ownerOptions = referenceData.owners.map(owner => ({
        label: owner.name,
        value: owner.name
    }));

    // County options for filter dialog (searchable)
    const countyOptions = referenceData.counties.map(county => ({
        label: county.name,
        value: county.name
    }));

    // Estimator options for filter dialog
    const estimatorOptions = referenceData.estimators.map(estimator => ({
        label: estimator.name || '',
        value: estimator.id.toString()
    }));
    //THESE ARE ESTIMATES
    const [activeBids, setActiveBids] = useState<ActiveBid[]>([]);
    const [activeBidsPageIndex, setActiveBidsPageIndex] = useState(0);
    const [activeBidsPageSize, setActiveBidsPageSize] = useState(25);
    const [activeBidsPageCount, setActiveBidsPageCount] = useState(0);
    const [activeBidsTotalCount, setActiveBidsTotalCount] = useState(0);
    const [showArchiveBidsDialog, setShowArchiveBidsDialog] = useState(false);
    const [showDeleteBidsDialog, setShowDeleteBidsDialog] = useState(false);
    const [selectedActiveBid, setSelectedActiveBid] = useState<ActiveBid | null>(null);
    const [activeBidDetailsSheetOpen, setActiveBidDetailsSheetOpen] = useState(false);
    const [allActiveBidsDetailed, setAllActiveBidsDetailed] = useState<EstimateData[]>([])
    const [viewBidSummaryOpen, setViewBidSummaryOpen] = useState<boolean>(false)


    //ACTIVE JOBS (IE WON JOBS)
    const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
    const [activeJobsPageIndex, setActiveJobsPageIndex] = useState(0);
    const [activeJobsPageSize, setActiveJobsPageSize] = useState(25);
    const [activeJobsPageCount, setActiveJobsPageCount] = useState(0);
    const [activeJobsTotalCount, setActiveJobsTotalCount] = useState(0);
    const [showArchiveActiveJobsDialog, setShowArchiveActiveJobsDialog] = useState<boolean>(false);
    const [showDeleteActiveJobsDialog, setShowDeleteActiveJobsDialog] = useState<boolean>(false);
    const [selectedActiveJobsToArchive, setSelectedActiveJobsToArchive] = useState<ActiveJob[]>([]);
    const [selectedActiveJobsToDelete, setSelectedActiveJobsToDelete] = useState<ActiveJob[]>([]);
    const [jobDetailsSheetOpen, setJobDetailsSheetOpen] = useState(false)
    const [editJobSheetOpen, setEditJobSheetOpen] = useState(false)
    const [selectedActiveJob, setSelectedActiveJob] = useState<ActiveJob | null>(null)
    const [activeJobDetailsSheetOpen, setActiveJobDetailsSheetOpen] = useState(false)
    const [editActiveJobSheetOpen, setEditActiveJobSheetOpen] = useState(false)

    const activeJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);

    const [jobCounts, setJobCounts] = useState<Record<string, number>>({
        all: 0,
        unset: 0,
        'no-bid': 0,
        bid: 0,
        archived: 0
    });

    const [activeJobCounts, setActiveJobCounts] = useState<Record<string, number>>({
        all: 0,
        west: 0,
        turbotville: 0,
        hatfield: 0,
        archived: 0
    });

    const [activeBidCounts, setActiveBidCounts] = useState<Record<string, number>>({
        all: 0,
        won: 0,
        pending: 0,
        lost: 0,
        draft: 0,
        'won-pending': 0,
        archived: 0
    });

    const availableJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const activeBidsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const { startLoading, stopLoading } = useLoading();

    if (!["available", "active-bids", "active-jobs"].includes(job)) {
        notFound();
    }

    const isAvailableJobs = job === "available";
    const isActiveBids = job === "active-bids";
    const isActiveJobs = job === "active-jobs";



    const handleSegmentChange = (value: string) => {
        console.log("Segment changed to:", value);
        setActiveSegment(value);
    };

    const loadAvailableJobs = useCallback(async () => {
        try {
            console.log("Loading available jobs with activeSegment:", activeSegment);
            startLoading();

            // Special handling for archived segment
            const options: any = {
                limit: availableJobsPageSize,
                page: availableJobsPageIndex + 1, // API uses 1-based indexing
            };

            // Add sorting parameters if available
            if (sortBy) {
                options.sortBy = sortBy;
                options.sortOrder = sortOrder;
                console.log(`Adding sort: ${sortBy} ${sortOrder}`);
            }

            // Add filter parameters if any are active
            if (Object.keys(activeFilters).length > 0) {
                options.filters = JSON.stringify(activeFilters);
                console.log(`Adding filters: ${JSON.stringify(activeFilters)}`);
            }

            if (activeSegment === "archived") {
                options.status = "archived";
                console.log("Using archived filter");
            } else if (activeSegment !== "all") {
                const dbStatus = mapUiStatusToDbStatus(activeSegment);
                console.log("Mapped DB status:", dbStatus);
                options.status = dbStatus;
            }
            console.log("Fetch options:", options);

            const response = await fetch(`/api/bids?${new URLSearchParams(options).toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch available jobs');
            }
            const result = await response.json();
            const { data, pagination } = result;

            console.log("Fetched data:", data);
            console.log("Pagination:", pagination);

            const uiJobs = data.map((job: any) => {
                const isEffectivelyUnknown = (value: any): boolean => {
                    if (value === undefined || value === null) return true;
                    if (typeof value === 'string') {
                        const normalized = value.toLowerCase().trim();
                        return normalized === '' || normalized === 'unknown' || normalized === 'n/a' || normalized === '-';
                    }
                    return false;
                };

                let countyValue = '';
                if (typeof job.county === 'string' && !isEffectivelyUnknown(job.county)) {
                    countyValue = job.county;
                } else if (job.county?.name && !isEffectivelyUnknown(job.county.name)) {
                    countyValue = job.county.name;
                } else if (job.admin_data?.county) {
                    if (typeof job.admin_data.county === 'string' && !isEffectivelyUnknown(job.admin_data.county)) {
                        countyValue = job.admin_data.county;
                    } else if (job.admin_data.county?.name && !isEffectivelyUnknown(job.admin_data.county.name)) {
                        countyValue = job.admin_data.county.name;
                    }
                }

                const branchCode = job.branch_code || '';
                const branchMap: Record<string, string> = {
                    '10': 'Hatfield',
                    '20': 'Turbotville',
                    '30': 'West'
                };
                let branchValue = '';
                if (typeof job.branch === 'string' && !isEffectivelyUnknown(job.branch)) {
                    branchValue = job.branch.charAt(0).toUpperCase() + job.branch.slice(1).toLowerCase();
                } else if (branchMap[branchCode] && !isEffectivelyUnknown(branchMap[branchCode])) {
                    branchValue = branchMap[branchCode].charAt(0).toUpperCase() + branchMap[branchCode].slice(1).toLowerCase();
                } else if (job.admin_data?.branch && !isEffectivelyUnknown(job.admin_data.branch)) {
                    branchValue = job.admin_data.branch.charAt(0).toUpperCase() + job.admin_data.branch.slice(1).toLowerCase();
                }

                const locationValue = job.location || job.admin_data?.location || '';

                const platformValue = job.platform || job.admin_data?.platform || '';

                const requestorValue = job.requestor || job.admin_data?.requestor || '';

                const ownerValue = job.owner || job.admin_data?.owner || '';

                const contractNumberValue = job.contract_number || job.customer_contract_number || job.admin_data?.contractNumber || '';

                const dbeValue = job.dbe_percentage || job.admin_data?.dbePercentage || null;

                const noBidReason = job.no_bid_reason || null;

                const stateRoute = job.state_route || null;

                const services: Record<AvailableJobServices, boolean> = {
                    'MPT': job.mpt || false,
                    'Flagging': job.flagging || false,
                    'Equipment Rental': job.equipment_rental || false,
                    'Perm Signs': job.perm_signs || false,
                    'Other': job.other || false
                }

                return {
                    id: job.id,
                    contractNumber: contractNumberValue,
                    status: job.status || 'Unset',
                    requestor: requestorValue,
                    owner: ownerValue,
                    // Ensure dates are properly formatted and consistent
                    // Keep the original ISO date strings from the database to avoid timezone issues
                    lettingDate: job.letting_date || '',
                    dueDate: job.due_date || '',
                    // Add debug info to trace date issues
                    _debug_raw_letting_date: job.letting_date,
                    _debug_raw_due_date: job.due_date,
                    county: {
                        main: countyValue,
                        secondary: branchValue
                    },
                    countyValue: countyValue,
                    branch: branchValue,
                    dbe: dbeValue,
                    createdAt: job.created_at || '',
                    location: locationValue,
                    platform: platformValue,
                    noBidReason,
                    stateRoute,
                    services,
                    alreadyBid: job.alreadyBid || false
                };
            });

            setAvailableJobs(uiJobs);
            setAvailableJobsPageCount(pagination.pageCount);
            setAvailableJobsTotalCount(pagination.totalCount);
        } catch (error) {
            console.error("Error loading jobs:", error);
            toast.error("Failed to load jobs. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, availableJobsPageIndex, availableJobsPageSize, startLoading, stopLoading, sortBy, sortOrder, activeFilters]);

    // Load active bids data
    const handleJobNavigation = (direction: 'up' | 'down') => {
        if (!selectedJob || !availableJobs.length) return

        const currentIndex = availableJobs.findIndex(job =>
            job.contractNumber === selectedJob.contractNumber
        )

        if (currentIndex === -1) return

        let nextIndex
        if (direction === 'down') {
            nextIndex = (currentIndex + 1) % availableJobs.length
        } else {
            nextIndex = (currentIndex - 1 + availableJobs.length) % availableJobs.length
        }

        setSelectedJob(availableJobs[nextIndex])
    }

    const { customers, getCustomers } = useCustomers();

    useEffect(() => {
        getCustomers();
    }, [getCustomers])

    const loadActiveBids = useCallback(async () => {
        try {
            startLoading();
            const ops: any = {
                limit: activeBidsTotalCount || 10000,
                page: 1,
                detailed: true
            }

            if (sortBy) {
                ops.sortBy = sortBy
                ops.sortOrder = sortOrder
            }

            const res = await fetch(`/api/active-bids?${new URLSearchParams(ops).toString()}`);
            if (!res.ok) {
                throw new Error('Failed to fetch active bids');
            }

            const resu = await res.json()
            setAllActiveBidsDetailed(resu.data)

            const options: any = {
                limit: activeBidsPageSize,
                page: activeBidsPageIndex + 1, // API uses 1-based indexing
                detailed: true
            };

            if (activeSegment !== "all") {
                const statusValues = ['pending', 'won', 'lost', 'draft', 'won-pending', 'archived'];

                if (statusValues.includes(activeSegment.toLowerCase())) {
                    options.status = activeSegment;
                } else {
                    options.division = activeSegment;
                }
            }

            const response = await fetch(`/api/active-bids?${new URLSearchParams(options).toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch active bids');
            }
            const result = await response.json();
            //raw data has all the info we need
            const { data, pagination } = result;

            const transformedData = data.map(e => ({
                id: e.id,
                contractNumber: e.contractNumber,
                originalContractNumber: e.contractNumber,
                //TODO refactor estimate_complete view to return contractor display name by default then contractor name
                contractor: (e.contractor_name && customers) ? customers.find(c => c.name === e.contractor_name)?.displayName || customers.find(c => c.name === e.contractor_name)?.name : '-',
                subcontractor: e.subcontractor_name || '-',
                owner: e.admin_data.owner || 'Unknown',
                county: e.admin_data.county.name === '' || e.admin_data.county.name === 'Choose County' ? '-' : {
                    main: e.admin_data.county.name,
                    secondary: e.admin_data.county.branch
                },
                branch: e.admin_data.county.branch,
                estimator: e.admin_data.estimator || 'Unknown',
                status: e.status === 'won-pending' ? 'WON - PENDING' : e.status.toUpperCase(),
                division: e.admin_data.division,
                lettingDate: e.admin_data.lettingDate ? e.admin_data.lettingDate : "",
                startDate: e.admin_data.startDate ? e.admin_data.startDate : "",
                endDate: e.admin_data.endDate ? e.admin_data.endDate : "",
                projectDays: e.total_days ? e.total_days : (!!e.admin_data.startDate && !!e.admin_data.endDate) ?
                    Math.ceil((new Date(e.admin_data.endDate).getTime() - new Date(e.admin_data.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                totalHours: e.mpt_rental?._summary?.hours || 0,
                mptValue: e.mpt_rental._summary.revenue || 0,
                permSignValue: 0, // Not in the new structure
                rentalValue: e.equipment_rental?.reduce((sum: number, item: any) =>
                    sum + (item.revenue || 0), 0) || 0,
                createdAt: e.created_at ? e.created_at : "",
                total: e.mpt_rental._summary.revenue || 0
            }))

            setActiveBids(transformedData);
            setActiveBidsPageCount(pagination.pageCount);
            setActiveBidsTotalCount(pagination.totalCount);
        } catch (error) {
            console.error("Error loading active bids:", error);
            toast.error("Failed to load active bids. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, activeBidsPageIndex, activeBidsPageSize, startLoading, stopLoading, customers]);

    const loadActiveJobs = useCallback(async () => {
        try {
            startLoading();

            const options: any = {
                limit: activeJobsPageSize,
                page: activeJobsPageIndex + 1, // API uses 1-based indexing
            };

            if (activeSegment !== "all") {
                options.branch = activeSegment;
            }

            const response = await fetch(`/api/jobs?${new URLSearchParams(options).toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch active jobs');
            }
            const result = await response.json();
            const { data, pagination } = result;

            console.log("Fetched active jobs:", data);
            console.log("Pagination:", pagination);

            const uiJobs = data.map((job: any) => ({
                id: job.id,
                jobNumber: job.jobNumber,
                bidNumber: job.bidNumber || "",  // This field might not exist in the API response
                projectStatus: job.projectStatus,
                billingStatus: job.billingStatus,
                contractNumber: job.contractNumber,
                location: job.location,
                county: (job.county.trim() === '' || job.county === 'Choose County') ? '-' : { main: job.county, secondary: job.branch },
                countyJson: job.countyJson,
                branch: job.branch,
                contractor: job.contractor,
                startDate: job.startDate,
                endDate: job.endDate,
                createdAt: job.createdAt ? job.createdAt : "",
                wonBidItems: job.wonBidItems
            }));

            setActiveJobs(uiJobs);
            setActiveJobsPageCount(pagination.pageCount);
            setActiveJobsTotalCount(pagination.totalCount);
        } catch (error) {
            console.error("Error loading active jobs:", error);
            toast.error("Failed to load active jobs. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, activeJobsPageIndex, activeJobsPageSize, startLoading, stopLoading]);
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
    const fetchAvailableJobCounts = useCallback(async (startDate?: string, endDate?: string) => {
        if (!isAvailableJobs) return;
        startLoading();
        try {
            const options: any = { limit: 1000, includeStats: true };

            // Add date filters if provided
            if (startDate && endDate) {
                options.startDate = startDate;
                options.endDate = endDate;
            }

            const fetchedBidsData = await fetchBids(options);

            setJobCounts({
                all: fetchedBidsData.counts.all,
                unset: fetchedBidsData.counts.unset,
                'no-bid': fetchedBidsData.counts["no-bid"],
                bid: fetchedBidsData.counts.bid,
                archived: fetchedBidsData.counts.archived
            });

            setCardData(fetchedBidsData.stats);
        } catch (error) {
            console.error("Error fetching job counts:", error);
            toast.error("Failed to fetch job counts");
        } finally {
            stopLoading();
        }
    }, [isAvailableJobs, startLoading, stopLoading]);

    const fetchActiveJobCounts = useCallback(async () => {
        if (!isActiveJobs) return;

        try {
            startLoading();

            const response = await fetch('/api/jobs?counts=true');
            if (!response.ok) {
                throw new Error('Failed to fetch active job counts');
            }

            const countData = await response.json();
            console.log('Active job counts:', countData);

            setActiveJobCounts({
                all: countData.all || 0,
                west: countData.west || 0,
                turbotville: countData.turbotville || 0,
                hatfield: countData.hatfield || 0,
                archived: countData.archived || 0
            });
        } catch (error) {
            console.error("Error fetching active job counts:", error);
            toast.error("Failed to fetch active job counts");
        } finally {
            stopLoading();
        }
    }, [isActiveJobs, startLoading, stopLoading]);

    const fetchActiveBidCounts = useCallback(async () => {
        if (!isActiveBids) return;

        try {
            startLoading();

            const response = await fetch('/api/active-bids?counts=true');
            if (!response.ok) {
                throw new Error('Failed to fetch active bid counts');
            }

            const countData = await response.json();
            console.log('Active bid counts:', countData);

            setActiveBidCounts({
                all: countData.all || 0,
                won: countData.won || 0,
                pending: countData.pending || 0,
                lost: countData.lost || 0,
                draft: countData.draft || 0,
                'won-pending': countData['won-pending'] || 0,
                archived: countData.archived || 0
            });
        } catch (error) {
            console.error("Error fetching active bid counts:", error);
            toast.error("Failed to fetch active bid counts");
        } finally {
            stopLoading();
        }
    }, [isActiveBids, startLoading, stopLoading]);

    useEffect(() => {
        if (isAvailableJobs) {
            loadAvailableJobs();
            fetchAvailableJobCounts();
        } else if (isActiveBids) {
            loadActiveBids();
            setCardData([{
                title: 'Active Bids',
                value: '18'
            },
            {
                title: 'Success Rate',
                value: '72%'
            },
            {
                title: 'Average Bid',
                value: '$125,000'
            },
            {
                title: 'Response Time',
                value: '2.4 days'
            }
            ])
            fetchActiveBidCounts();
        } else if (isActiveJobs) {
            loadActiveJobs();
            fetchActiveJobCounts();
            fetchNextJobNumber();
            setCardData([{
                title: 'Current Jobs',
                value: '12'
            },
            {
                title: 'Completion Rate',
                value: '94%'
            },
            {
                title: 'Total Value',
                value: '$1.2M'
            },
            {
                title: 'Client Rating',
                value: '4.8/5'
            }
            ])
        }
    }, [
        isAvailableJobs,
        isActiveBids,
        isActiveJobs,
        loadAvailableJobs,
        loadActiveBids,
        loadActiveJobs,
        fetchAvailableJobCounts,
        fetchActiveBidCounts,
        fetchActiveJobCounts,
        fetchNextJobNumber,
        job,
        activeSegment
    ]);

    useEffect(() => {
        if (!isAvailableJobs) return;
        if (dateRange?.from && !dateRange.to) return;
        if (dateRange?.to && !dateRange.from) return;

        let startDate: string;
        let endDate: string;

        if (dateRange?.from && dateRange?.to) {
            // Use the selected date range
            startDate = dateRange.from.toISOString().split('T')[0];
            endDate = dateRange.to.toISOString().split('T')[0];
            fetchAvailableJobCounts(startDate, endDate);
        } else {
            fetchAvailableJobCounts();
        }

    }, [dateRange?.from, dateRange?.to, fetchAvailableJobCounts, isAvailableJobs]);

    const createButtonLabel = isAvailableJobs ? "Create Open Bid" : isActiveBids ? "Create Active Bid" : "Create Active Job";

    const data: JobPageData[] = isAvailableJobs ? availableJobs : isActiveBids ? activeBids : activeJobs;

    const handleActiveBidViewDetails = (item: ActiveBid) => {
        console.log('View details clicked:', item);
        setSelectedActiveBid(item);
        setActiveBidDetailsSheetOpen(true);
    };

    const handleViewBidSummary = (item: ActiveBid) => {
        setSelectedActiveBid(item);
        setViewBidSummaryOpen(true);
    }

    const handleActiveBidNavigation = (direction: 'up' | 'down') => {
        if (!selectedActiveBid || !activeBids.length) return;

        const currentIndex = activeBids.findIndex(bid =>
            bid.contractNumber === selectedActiveBid.contractNumber
        );

        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'down') {
            nextIndex = (currentIndex + 1) % activeBids.length;
        } else {
            nextIndex = (currentIndex - 1 + activeBids.length) % activeBids.length;
        }

        setSelectedActiveBid(activeBids[nextIndex]);
    };

    const DISPLAYED_ACTIVE_JOBS_COLUMNS = [
        { key: "jobNumber", title: "Job Number", className: 'whitespace-nowrap' },
        { key: "bidNumber", title: "Bid Number" },
        { key: "projectStatus", title: "Project Status" },
        { key: "billingStatus", title: "Billing Status" },
        { key: "contractNumber", title: "Contract Number", className: 'truncate whitespace-nowrap max-w-40' },
        { key: "location", title: "Location", className: 'truncate whitespace-nowrap max-w-30' },
        { key: "county", title: "County" },
        { key: "branch", title: "Branch" },
        { key: "contractor", title: "Contractor" },
        { key: "startDate", title: "Start Date", className: 'whitespace-nowrap' },
        { key: "endDate", title: "End Date", className: 'whitespace-nowrap' },
        { key: 'createdAt', title: 'Created At', className: 'whitespace-nowrap' }
    ];

    const columns = isAvailableJobs ? availableJobsColumns : isActiveBids ? ACTIVE_BIDS_COLUMNS : DISPLAYED_ACTIVE_JOBS_COLUMNS;

    const handleMarkAsBidJob = useCallback((job: AvailableJob) => {
        console.log('Marking job as bid job:', job);

        // Pass the job ID and source as query parameters
        // The API will fetch the complete job data using this ID
        const queryParams = new URLSearchParams({
            jobId: job.id.toString(),
            source: 'available-jobs'
        }).toString();

        router.push(`/active-bid/new?${queryParams}`);
    }, [router]);

    const handleUpdateStatus = useCallback(async (job: AvailableJob, status: 'Bid' | 'No Bid' | 'Unset') => {
        try {
            startLoading();
            await changeBidStatus(job.id, status);
            toast.success(`Job status updated to ${status}`);
            await loadAvailableJobs();
            await fetchAvailableJobCounts();
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('Failed to update job status');
        } finally {
            stopLoading();
        }
    }, [loadAvailableJobs, fetchAvailableJobCounts, startLoading, stopLoading]);

    const handleUpdateActiveBidStatus = useCallback(async (bid: ActiveBid, status: 'WON' | 'PENDING' | 'LOST' | 'DRAFT') => {
        try {
            startLoading();
            await changeActiveBidStatus(bid.id, status);

            loadActiveBids();

            toast.success(`Bid status updated to ${status}`);
        } catch (error) {
            console.error('Error updating bid status:', error);
            toast.error('Failed to update bid status');
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    const fetchAllFilteredJobs = async () => {
        const options: any = {
            limit: availableJobsTotalCount || 10000,
            page: 1,
        };

        // Apply current filters
        if (Object.keys(activeFilters).length > 0) {
            options.filters = JSON.stringify(activeFilters);
        }

        // Apply current segment filter
        if (activeSegment === "archived") {
            options.status = "archived";
        } else if (activeSegment !== "all") {
            const dbStatus = mapUiStatusToDbStatus(activeSegment);
            options.status = dbStatus;
        }

        // Apply current sorting
        if (sortBy) {
            options.sortBy = sortBy;
            options.sortOrder = sortOrder;
        }

        const response = await fetch(`/api/bids?${new URLSearchParams(options).toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch all jobs');
        }

        const result = await response.json();
        return result.data.map((job: any) => {
            // Use the same transformation logic from loadAvailableJobs
            const isEffectivelyUnknown = (value: any): boolean => {
                if (value === undefined || value === null) return true;
                if (typeof value === 'string') {
                    const normalized = value.toLowerCase().trim();
                    return normalized === '' || normalized === 'unknown' || normalized === 'n/a' || normalized === '-';
                }
                return false;
            };

            let countyValue = '';
            if (typeof job.county === 'string' && !isEffectivelyUnknown(job.county)) {
                countyValue = job.county;
            } else if (job.county?.name && !isEffectivelyUnknown(job.county.name)) {
                countyValue = job.county.name;
            } else if (job.admin_data?.county) {
                if (typeof job.admin_data.county === 'string' && !isEffectivelyUnknown(job.admin_data.county)) {
                    countyValue = job.admin_data.county;
                } else if (job.admin_data.county?.name && !isEffectivelyUnknown(job.admin_data.county.name)) {
                    countyValue = job.admin_data.county.name;
                }
            }

            const branchCode = job.branch_code || '';
            const branchMap: Record<string, string> = {
                '10': 'Hatfield',
                '20': 'Turbotville',
                '30': 'West'
            };
            let branchValue = '';
            if (typeof job.branch === 'string' && !isEffectivelyUnknown(job.branch)) {
                branchValue = job.branch.charAt(0).toUpperCase() + job.branch.slice(1).toLowerCase();
            } else if (branchMap[branchCode] && !isEffectivelyUnknown(branchMap[branchCode])) {
                branchValue = branchMap[branchCode].charAt(0).toUpperCase() + branchMap[branchCode].slice(1).toLowerCase();
            } else if (job.admin_data?.branch && !isEffectivelyUnknown(job.admin_data.branch)) {
                branchValue = job.admin_data.branch.charAt(0).toUpperCase() + job.admin_data.branch.slice(1).toLowerCase();
            }

            return {
                id: job.id,
                contractNumber: job.contract_number || job.customer_contract_number || job.admin_data?.contractNumber || '',
                status: job.status || 'Unset',
                requestor: job.requestor || job.admin_data?.requestor || '',
                owner: job.owner || job.admin_data?.owner || '',
                lettingDate: job.letting_date || '',
                dueDate: job.due_date || '',
                county: {
                    main: countyValue,
                    secondary: branchValue
                },
                countyValue: countyValue,
                branch: branchValue,
                dbe: job.dbe_percentage || job.admin_data?.dbePercentage || null,
                createdAt: job.created_at || '',
                location: job.location || job.admin_data?.location || '',
                platform: job.platform || job.admin_data?.platform || '',
                noBidReason: job.no_bid_reason || null,
                stateRoute: job.state_route || null,
                services: {
                    'MPT': job.mpt || false,
                    'Flagging': job.flagging || false,
                    'Equipment Rental': job.equipment_rental || false,
                    'Perm Signs': job.perm_signs || false,
                    'Other': job.other || false
                },
                alreadyBid: job.alreadyBid || false
            };
        });
    };

    const handleEdit = (item: AvailableJob) => {
        console.log('Edit clicked:', item)
        setSelectedJob(item)
        setIsEditingAvailableJob(true)
    }

    const initiateArchiveJobs = (selectedJobs: AvailableJob[]) => {
        setSelectedAvailableJobs(selectedJobs);
        setShowArchiveJobsDialog(true);
    };

    // 2. Fix initiateDeleteJobs function  
    const initiateDeleteJobs = (selectedJobs: AvailableJob[]) => {
        setSelectedAvailableJobs(selectedJobs);
        setShowDeleteJobsDialog(true);
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

    const handleArchiveActiveJob = (items: ActiveJob[]) => {
        console.log('Archive clicked for active job:', items);

        if ('jobNumber' in items[0]) {
            // This is an active job
            initiateArchiveActiveJobs(items);
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

            let jobsToArchive: AvailableJob[] = [];

            if (allAvailableJobRowsSelected) {
                console.log('Fetching all filtered jobs for archiving');
                jobsToArchive = await fetchAllFilteredJobs();
                // Filter out already archived jobs
                jobsToArchive = jobsToArchive.filter(job =>
                    !job.status?.toLowerCase().includes('archived')
                );
                console.log(`Archiving all ${jobsToArchive.length} filtered non-archived jobs`);
            } else {
                // Filter out already archived jobs from selection
                jobsToArchive = selectedAvailableJobs.filter(job =>
                    !job.status?.toLowerCase().includes('archived')
                );
                console.log(`Archiving ${jobsToArchive.length} selected non-archived jobs`);
            }

            if (jobsToArchive.length === 0) {
                toast.error('No jobs to archive. All selected jobs are already archived.');
                return false;
            }

            const ids = jobsToArchive.map(job => job.id);
            await archiveJobs(ids);

            toast.success(`Successfully archived ${jobsToArchive.length} job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadAvailableJobs();
            await fetchAvailableJobCounts();

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
        setSelectedActiveBids(selectedBids);
        setShowArchiveBidsDialog(true);
    };

    // 7. Fix initiateDeleteBids function
    const initiateDeleteBids = (selectedBids: ActiveBid[]) => {
        setSelectedActiveBids(selectedBids);
        setShowDeleteBidsDialog(true);
    };



    const handleDeleteArchivedJobs = async () => {
        try {
            startLoading();

            let jobsToDelete: AvailableJob[] = [];

            if (allAvailableJobRowsSelected) {
                console.log('Fetching all filtered jobs for deletion');
                const allJobs = await fetchAllFilteredJobs();
                // For deletion, we only want archived jobs
                jobsToDelete = allJobs.filter(job =>
                    activeSegment === 'archived' || job.status?.toLowerCase().includes('archived')
                );
                console.log(`Deleting all ${jobsToDelete.length} filtered archived jobs`);
            } else {
                // Filter for archived jobs from selection
                if (activeSegment === 'archived') {
                    // If we're in archived segment, all selected jobs can be deleted
                    jobsToDelete = selectedAvailableJobs;
                } else {
                    // If we're not in archived segment, only delete actually archived jobs
                    jobsToDelete = selectedAvailableJobs.filter(job =>
                        job.status?.toLowerCase().includes('archived')
                    );
                }
                console.log(`Deleting ${jobsToDelete.length} selected archived jobs`);
            }

            if (jobsToDelete.length === 0) {
                toast.error('No archived jobs found to delete.');
                return false;
            }

            const ids = jobsToDelete.map(job => job.id);
            const result = await deleteArchivedJobs(ids);

            toast.success(`Successfully deleted ${result.count} archived job(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadAvailableJobs();
            await fetchAvailableJobCounts();
            setShowArchiveJobsDialog(false)

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

    const fetchAllFilteredActiveBids = async () => {
        const options: any = {
            limit: activeBidsTotalCount || 10000,
            page: 1,
            detailed: true
        };

        // Apply current segment filter
        if (activeSegment !== "all") {
            const statusValues = ['pending', 'won', 'lost', 'draft', 'won-pending', 'archived'];
            if (statusValues.includes(activeSegment.toLowerCase())) {
                options.status = activeSegment;
            } else {
                options.division = activeSegment;
            }
        }

        // Apply current sorting if any
        if (sortBy) {
            options.sortBy = sortBy;
            options.sortOrder = sortOrder;
        }

        // Apply current filters if any
        if (Object.keys(activeFilters).length > 0) {
            options.filters = JSON.stringify(activeFilters);
        }

        const response = await fetch(`/api/active-bids?${new URLSearchParams(options).toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch all active bids');
        }

        const result = await response.json();
        return result.data.map((e: any) => ({
            id: e.id,
            contractNumber: e.contractNumber,
            originalContractNumber: e.contractNumber,
            contractor: (e.contractor_name && customers) ?
                customers.find(c => c.name === e.contractor_name)?.displayName ||
                customers.find(c => c.name === e.contractor_name)?.name : '-',
            subcontractor: e.subcontractor_name || '-',
            owner: e.admin_data.owner || 'Unknown',
            county: e.admin_data.county.name === '' || e.admin_data.county.name === 'Choose County' ? '-' : {
                main: e.admin_data.county.name,
                secondary: e.admin_data.county.branch
            },
            branch: e.admin_data.county.branch,
            estimator: e.admin_data.estimator || 'Unknown',
            status: e.status === 'won-pending' ? 'WON - PENDING' : e.status.toUpperCase(),
            division: e.admin_data.division,
            lettingDate: e.admin_data.lettingDate ? e.admin_data.lettingDate : "",
            startDate: e.admin_data.startDate ? e.admin_data.startDate : "",
            endDate: e.admin_data.endDate ? e.admin_data.endDate : "",
            projectDays: e.total_days ? e.total_days : (!!e.admin_data.startDate && !!e.admin_data.endDate) ?
                Math.ceil((new Date(e.admin_data.endDate).getTime() - new Date(e.admin_data.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            totalHours: e.mpt_rental?._summary?.hours || 0,
            mptValue: e.mpt_rental._summary.revenue || 0,
            permSignValue: 0,
            rentalValue: e.equipment_rental?.reduce((sum: number, item: any) =>
                sum + (item.revenue || 0), 0) || 0,
            createdAt: e.created_at ? e.created_at : "",
            total: e.mpt_rental._summary.revenue || 0
        }));
    };


    const handleDeleteArchivedBids = async () => {
        try {
            startLoading();

            let bidsToDelete: ActiveBid[] = [];

            if (allActiveBidRowsSelected) {
                console.log('Fetching all filtered bids for deletion');
                const allBids = await fetchAllFilteredActiveBids();
                // For deletion, we only want archived bids
                bidsToDelete = allBids.filter(bid =>
                    activeSegment === 'archived' || bid.status.toLowerCase().includes('archived')
                );
                console.log(`Deleting all ${bidsToDelete.length} filtered archived bids`);
            } else {
                // Filter for archived bids from selection
                if (activeSegment === 'archived') {
                    // If we're in archived segment, all selected bids can be deleted
                    bidsToDelete = selectedActiveBids;
                } else {
                    // If we're not in archived segment, only delete actually archived bids
                    bidsToDelete = selectedActiveBids.filter(bid =>
                        bid.status.toLowerCase().includes('archived')
                    );
                }
                console.log(`Deleting ${bidsToDelete.length} selected archived bids`);
            }

            if (bidsToDelete.length === 0) {
                toast.error('No archived bids found to delete.');
                return false;
            }

            const ids = bidsToDelete.map(bid => bid.id);
            const result = await deleteArchivedActiveBids(ids);

            toast.success(`Successfully deleted ${result.count} archived bid(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveBids();
            await fetchActiveBidCounts();

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

            let bidsToArchive: ActiveBid[] = [];

            if (allActiveBidRowsSelected) {
                console.log('Fetching all filtered bids for archiving');
                bidsToArchive = await fetchAllFilteredActiveBids();
                // Filter out already archived bids
                bidsToArchive = bidsToArchive.filter(bid =>
                    !bid.status.toLowerCase().includes('archived')
                );
                console.log(`Archiving all ${bidsToArchive.length} filtered non-archived bids`);
            } else {
                // Filter out already archived bids from selection
                bidsToArchive = selectedActiveBids.filter(bid =>
                    !bid.status.toLowerCase().includes('archived')
                );
                console.log(`Archiving ${bidsToArchive.length} selected non-archived bids`);
            }

            if (bidsToArchive.length === 0) {
                toast.error('No bids to archive. All selected bids are already archived.');
                return false;
            }

            const ids = bidsToArchive.map(bid => bid.id);
            await archiveActiveBids(ids);

            toast.success(`Successfully archived ${bidsToArchive.length} bid(s)`, {
                duration: 5000,
                position: 'top-center'
            });

            await loadActiveBids();
            await fetchActiveBidCounts();

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
        setOpenBidSheetOpen(true)
    }

    // Handler for sorting changes in the available jobs table
    const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
        console.log(`Sorting by ${column} ${direction}`);
        setSortBy(column);
        setSortOrder(direction);
        // Reset to first page when sorting changes
        setAvailableJobsPageIndex(0);
    };

    // Handler for filter changes in the available jobs table
    const handleFilterChange = (filters: Record<string, any>) => {
        console.log('Applying filters:', filters);
        // Convert the filters to the expected format
        const formattedFilters: Record<string, string[]> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "all" && value !== "none" && value !== "") {
                formattedFilters[key] = Array.isArray(value) ? value : [value];
            }
        });
        console.log('Setting formatted filters:', formattedFilters);
        setActiveFilters(formattedFilters);
        // Reset to first page when filters change
        setAvailableJobsPageIndex(0);
    };

    // Handler for resetting all filters and sorts
    const handleResetControls = () => {
        console.log('Resetting all filters and sorts');
        // Clear filters
        setActiveFilters({});
        // Clear sorting
        setSortBy(undefined);
        setSortOrder('asc');
        // Reset to first page
        setAvailableJobsPageIndex(0);
    };

    const segments = isAvailableJobs
        ? [
            { label: `All (${jobCounts.all || 0})`, value: "all" },
            { label: `Unset (${jobCounts.unset || 0})`, value: "unset" },
            { label: `No Bid (${jobCounts['no-bid'] || 0})`, value: "no-bid" },
            { label: `Bid (${jobCounts.bid || 0})`, value: "bid" },
            { label: `Archived (${jobCounts.archived || 0})`, value: "archived" },
        ]
        : isActiveBids
            ? [
                { label: `All (${activeBidCounts.all || 0})`, value: "all" },
                { label: `Won (${activeBidCounts.won || 0})`, value: "won" },
                { label: `Pending (${activeBidCounts.pending || 0})`, value: "pending" },
                { label: `Lost (${activeBidCounts.lost || 0})`, value: "lost" },
                { label: `Draft (${activeBidCounts.draft || 0})`, value: "draft" },
                { label: `Won - Pending (${activeBidCounts['won-pending'] || 0})`, value: "won-pending" },
                { label: `Archived (${activeBidCounts.archived || 0})`, value: "archived" }
            ]
            : [
                { label: `All (${activeJobCounts.all || 0})`, value: "all" },
                { label: `West (${activeJobCounts.west || 0})`, value: "west" },
                { label: `Turbotville (${activeJobCounts.turbotville || 0})`, value: "turbotville" },
                { label: `Hatfield (${activeJobCounts.hatfield || 0})`, value: "hatfield" },
                { label: `Archived (${activeJobCounts.archived || 0})`, value: "archived" },
            ];

    const handleCreateClick = () => {
        if (isAvailableJobs) {
            setIsCreatingAvailableJob(true);
        } else if (isActiveBids) {
            // Route to the active-bid page instead of opening a sheet
            router.push("/active-bid/new");
        } else if (isActiveJobs) {
            setCreateJobSheetOpen(true);
        }
    }

    const handleActiveJobViewDetails = (item: ActiveJob) => {
        console.log('View details clicked:', item)
        setSelectedActiveJob(item)
        setActiveJobDetailsSheetOpen(true)
    }

    const handleActiveJobNavigation = (direction: 'up' | 'down') => {
        if (!selectedActiveJob || !activeJobs.length) return;

        const currentIndex = activeJobs.findIndex(job =>
            job.jobNumber === selectedActiveJob.jobNumber
        );

        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'down') {
            nextIndex = (currentIndex + 1) % activeJobs.length;
        } else {
            nextIndex = (currentIndex - 1 + activeJobs.length) % activeJobs.length;
        }

        setSelectedActiveJob(activeJobs[nextIndex]);
    }

    const handleActiveJobEdit = (item: ActiveJob) => {
        console.log('Edit clicked:', item)
        setSelectedActiveJob(item)
        setEditActiveJobSheetOpen(true)
    }

    const handleExportAvailableJobs = async () => {
        try {
            startLoading();

            if (allAvailableJobRowsSelected) {
                // Fetch all jobs with current filters applied
                const options: any = {
                    limit: availableJobsTotalCount || 10000, // Use total count or a large number
                    page: 1,
                };

                // Apply current filters to get the same filtered dataset
                if (Object.keys(activeFilters).length > 0) {
                    options.filters = JSON.stringify(activeFilters);
                }

                // Apply current segment filter
                if (activeSegment === "archived") {
                    options.status = "archived";
                } else if (activeSegment !== "all") {
                    const dbStatus = mapUiStatusToDbStatus(activeSegment);
                    options.status = dbStatus;
                }

                // Apply current sorting
                if (sortBy) {
                    options.sortBy = sortBy;
                    options.sortOrder = sortOrder;
                }

                console.log("Fetching all jobs for export with options:", options);

                const response = await fetch(`/api/bids?${new URLSearchParams(options).toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch all jobs for export');
                }

                const result = await response.json();
                const allJobs = result.data.map((job: any) => {
                    // Use the same transformation logic from loadAvailableJobs
                    const isEffectivelyUnknown = (value: any): boolean => {
                        if (value === undefined || value === null) return true;
                        if (typeof value === 'string') {
                            const normalized = value.toLowerCase().trim();
                            return normalized === '' || normalized === 'unknown' || normalized === 'n/a' || normalized === '-';
                        }
                        return false;
                    };

                    let countyValue = '';
                    if (typeof job.county === 'string' && !isEffectivelyUnknown(job.county)) {
                        countyValue = job.county;
                    } else if (job.county?.name && !isEffectivelyUnknown(job.county.name)) {
                        countyValue = job.county.name;
                    } else if (job.admin_data?.county) {
                        if (typeof job.admin_data.county === 'string' && !isEffectivelyUnknown(job.admin_data.county)) {
                            countyValue = job.admin_data.county;
                        } else if (job.admin_data.county?.name && !isEffectivelyUnknown(job.admin_data.county.name)) {
                            countyValue = job.admin_data.county.name;
                        }
                    }

                    const branchCode = job.branch_code || '';
                    const branchMap: Record<string, string> = {
                        '10': 'Hatfield',
                        '20': 'Turbotville',
                        '30': 'West'
                    };
                    let branchValue = '';
                    if (typeof job.branch === 'string' && !isEffectivelyUnknown(job.branch)) {
                        branchValue = job.branch.charAt(0).toUpperCase() + job.branch.slice(1).toLowerCase();
                    } else if (branchMap[branchCode] && !isEffectivelyUnknown(branchMap[branchCode])) {
                        branchValue = branchMap[branchCode].charAt(0).toUpperCase() + branchMap[branchCode].slice(1).toLowerCase();
                    } else if (job.admin_data?.branch && !isEffectivelyUnknown(job.admin_data.branch)) {
                        branchValue = job.admin_data.branch.charAt(0).toUpperCase() + job.admin_data.branch.slice(1).toLowerCase();
                    }

                    return {
                        id: job.id,
                        contractNumber: job.contract_number || job.customer_contract_number || job.admin_data?.contractNumber || '',
                        status: job.status || 'Unset',
                        requestor: job.requestor || job.admin_data?.requestor || '',
                        owner: job.owner || job.admin_data?.owner || '',
                        lettingDate: job.letting_date || '',
                        dueDate: job.due_date || '',
                        county: {
                            main: countyValue,
                            secondary: branchValue
                        },
                        countyValue: countyValue,
                        branch: branchValue,
                        dbe: job.dbe_percentage || job.admin_data?.dbePercentage || null,
                        createdAt: job.created_at || '',
                        location: job.location || job.admin_data?.location || '',
                        platform: job.platform || job.admin_data?.platform || '',
                        noBidReason: job.no_bid_reason || null,
                        stateRoute: job.state_route || null,
                        services: {
                            'MPT': job.mpt || false,
                            'Flagging': job.flagging || false,
                            'Equipment Rental': job.equipment_rental || false,
                            'Perm Signs': job.perm_signs || false,
                            'Other': job.other || false
                        }
                    };
                });

                console.log(`Exporting all ${allJobs.length} jobs`);
                exportAvailableJobsToExcel(allJobs);
                toast.success(`Exported all ${allJobs.length} jobs to Excel`);

            } else {
                // Export only selected rows (existing logic)
                if (selectedAvailableJobs.length === 0) {
                    toast.error('Please select jobs in the table before exporting');
                    return;
                }

                console.log(`Exporting ${selectedAvailableJobs.length} selected jobs`);
                exportAvailableJobsToExcel(selectedAvailableJobs);
                toast.success(`Exported ${selectedAvailableJobs.length} selected jobs to Excel`);
            }

        } catch (error) {
            console.error('Error exporting jobs:', error);
            toast.error('Failed to export jobs. Please try again.');
        } finally {
            stopLoading();
        }
    };

    const handleExportActiveBids = async () => {
        startLoading();

        try {
            if (allActiveBidRowsSelected) {
                // Export all detailed bids when all rows are selected
                exportBidsToExcel(allActiveBidsDetailed);
                toast.success(`Exported all ${allActiveBidsDetailed.length} bids to Excel`);
            } else {
                // Export only selected rows
                if (selectedActiveBids.length === 0) {
                    toast.error('Please select bids in the table before exporting');
                    return;
                }

                // Filter the detailed bids based on selected active bids
                const selectedDetailedBids = allActiveBidsDetailed.filter(detailedBid =>
                    selectedActiveBids.some(selectedBid => selectedBid.id === detailedBid.id)
                );

                console.log(`Exporting ${selectedActiveBids.length} selected bids`);
                exportBidsToExcel(selectedDetailedBids);
                toast.success(`Exported ${selectedActiveBids.length} selected bids to Excel`);
            }
        } catch (error) {
            console.error('Error exporting bids:', error);
            toast.error('Failed to export bids. Please try again.');
        } finally {
            stopLoading();
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
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <CardActions
                                            createButtonLabel={createButtonLabel}
                                            onCreateClick={handleCreateClick}
                                            onImportSuccess={isAvailableJobs ? loadAvailableJobs : isActiveBids ? loadActiveBids : undefined}
                                            date={dateRange}
                                            setDate={setDateRange}
                                            importType={isAvailableJobs ? 'available-jobs' : 'active-bids'}
                                            onExport={isAvailableJobs ? handleExportAvailableJobs : handleExportActiveBids}
                                            showFilterButton={false}
                                            showFilters={showFilters}
                                            setShowFilters={setShowFilters}
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

                            <SectionCards data={cardData} />

                            {isAvailableJobs ? (
                                <DataTable<AvailableJob>
                                    data={data as AvailableJob[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    segmentCounts={jobCounts}
                                    onSegmentChange={handleSegmentChange}
                                    onArchiveSelected={initiateArchiveJobs}
                                    onDeleteSelected={initiateDeleteJobs}
                                    tableRef={availableJobsTableRef}
                                    onViewDetails={handleViewDetails}
                                    onRowClick={handleViewDetails}
                                    onEdit={handleEdit}
                                    onArchive={initiateArchiveJobs}
                                    onMarkAsBidJob={handleMarkAsBidJob}
                                    handleMultiDelete={handleDeleteArchivedJobs}
                                    setSelectedRows={setSelectedAvailableJobs}
                                    allRowsSelected={allAvailableJobRowsSelected}
                                    onAllRowsSelectedChange={setAllAvailableJobRowsSelected}
                                    selectedItem={jobDetailsSheetOpen && selectedJob ? selectedJob : undefined}
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
                                    // Pagination props
                                    pageCount={availableJobsPageCount}
                                    pageIndex={availableJobsPageIndex}
                                    pageSize={availableJobsPageSize}
                                    onPageChange={setAvailableJobsPageIndex}
                                    onPageSizeChange={setAvailableJobsPageSize}
                                    totalCount={availableJobsTotalCount}
                                    // Sorting props
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSortChange={handleSortChange}
                                    // Filtering props
                                    filterOptions={filterOptions}
                                    branchOptions={branchOptions}
                                    ownerOptions={ownerOptions}
                                    countyOptions={countyOptions}
                                    estimatorOptions={estimatorOptions}
                                    activeFilters={activeFilters}
                                    onFilterChange={handleFilterChange}
                                    onReset={handleResetControls}
                                    showFilters={showFilters}
                                    setShowFilters={setShowFilters}
                                    hideDropdown={true}
                                />
                            ) : isActiveBids ? (
                                <DataTable<ActiveBid>
                                    data={data as ActiveBid[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    segmentCounts={activeBidCounts}
                                    onSegmentChange={handleSegmentChange}
                                    selectedItem={activeBidDetailsSheetOpen && selectedActiveBid ? selectedActiveBid : undefined}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveBids}
                                    onDeleteSelected={initiateDeleteBids}
                                    tableRef={activeBidsTableRef}
                                    setSelectedRows={setSelectedActiveBids}
                                    allRowsSelected={allActiveBidRowsSelected}
                                    onAllRowsSelectedChange={setAllActiveBidRowsSelected}
                                    handleMultiDelete={handleDeleteArchivedBids}
                                    onViewDetails={handleActiveBidViewDetails}
                                    onRowClick={handleActiveBidViewDetails}
                                    onEdit={(item) => {
                                        const params = new URLSearchParams;
                                        params.append('bidId', item.id.toString());
                                        params.append('tuckSidebar', 'true');
                                        params.append('fullscreen', 'true');
                                        params.append('defaultEditable', 'false');
                                        router.push(`/active-bid/view?${params.toString()}`)
                                    }}
                                    onUpdateStatus={(item, status) => {
                                        if ('lettingDate' in item) {
                                            const bidStatus = status as 'WON' | 'PENDING' | 'LOST' | 'DRAFT';
                                            handleUpdateActiveBidStatus(item as ActiveBid, bidStatus);
                                        }
                                    }}
                                    // Pagination props
                                    viewBidSummaryOpen={viewBidSummaryOpen}
                                    onViewBidSummary={handleViewBidSummary}
                                    pageCount={activeBidsPageCount}
                                    pageIndex={activeBidsPageIndex}
                                    pageSize={activeBidsPageSize}
                                    onPageChange={setActiveBidsPageIndex}
                                    onPageSizeChange={setActiveBidsPageSize}
                                    totalCount={activeBidsTotalCount}

                                    // Sorting props
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSortChange={handleSortChange}
                                    // Filtering props
                                    filterOptions={filterOptions}
                                    branchOptions={branchOptions}
                                    ownerOptions={ownerOptions}
                                    countyOptions={countyOptions}
                                    estimatorOptions={estimatorOptions}
                                    activeFilters={activeFilters}
                                    onFilterChange={handleFilterChange}
                                    onReset={handleResetControls}
                                    showFilters={showFilters}
                                    setShowFilters={setShowFilters}
                                />
                            ) : (
                                <DataTable<ActiveJob>
                                    data={data as ActiveJob[]}
                                    columns={columns}
                                    segments={segments}
                                    segmentValue={activeSegment}
                                    segmentCounts={activeJobCounts}
                                    onSegmentChange={handleSegmentChange}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveActiveJobs}
                                    onDeleteSelected={initiateDeleteActiveJobs}
                                    tableRef={activeJobsTableRef}
                                    selectedItem={activeJobDetailsSheetOpen && selectedActiveJob ? selectedActiveJob : undefined}
                                    onViewDetails={(item) => {
                                        if ('jobNumber' in item) {
                                            handleActiveJobViewDetails(item as ActiveJob);
                                        }
                                    }}
                                    onRowClick={(item) => {
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
                                    // Pagination props
                                    pageCount={activeJobsPageCount}
                                    pageIndex={activeJobsPageIndex}
                                    pageSize={activeJobsPageSize}
                                    onPageChange={setActiveJobsPageIndex}
                                    onPageSizeChange={setActiveJobsPageSize}
                                    totalCount={activeJobsTotalCount}
                                />
                            )}

                            {isAvailableJobs && isCreatingAvailableJob ? (
                                <OpenBidSheet
                                    open={isCreatingAvailableJob}
                                    onOpenChange={setIsCreatingAvailableJob}
                                    onSuccess={() => {
                                        loadAvailableJobs();
                                        fetchAvailableJobCounts();
                                    }}
                                    job={undefined}
                                />
                            ) : isEditingAvailableJob ? <OpenBidSheet
                                open={isEditingAvailableJob}
                                onOpenChange={setIsEditingAvailableJob}
                                onSuccess={() => {
                                    loadAvailableJobs();
                                    fetchAvailableJobCounts();
                                }}
                                job={selectedJob || undefined}
                            /> : <JobDetailsSheet
                                open={openBidSheetOpen}
                                onOpenChange={setOpenBidSheetOpen}
                                job={selectedJob || undefined}
                                onEdit={handleEdit}
                                onNavigate={handleJobNavigation}
                            />}

                            {isActiveBids && selectedActiveBid && (
                                <>
                                    <ActiveBidDetailsSheet
                                        open={activeBidDetailsSheetOpen && !viewBidSummaryOpen}
                                        onOpenChange={setActiveBidDetailsSheetOpen}
                                        bid={selectedActiveBid}
                                        onEdit={(item) => {
                                            const params = new URLSearchParams;
                                            params.append('bidId', item.id.toString());
                                            params.append('tuckSidebar', 'true');
                                            params.append('fullscreen', 'true');
                                            params.append('defaultEditable', 'false');
                                            router.push(`/active-bid/view?${params.toString()}`)
                                        }}
                                        onNavigate={handleActiveBidNavigation}
                                        onRefresh={loadActiveBids}
                                    />

                                    <EstimateProvider>
                                        <BidSummaryDrawer defaultBid={allActiveBidsDetailed.find(abd => abd.id === selectedActiveBid.id)} open={viewBidSummaryOpen} onOpenChange={setViewBidSummaryOpen} />
                                    </EstimateProvider>

                                </>
                            )}

                            {isActiveJobs && (
                                <>
                                    <ActiveJobDetailsSheet
                                        open={activeJobDetailsSheetOpen}
                                        onOpenChange={setActiveJobDetailsSheetOpen}
                                        job={selectedActiveJob || undefined}
                                        onEdit={handleActiveJobEdit}
                                        onNavigate={handleActiveJobNavigation}
                                    />
                                    <EditActiveJobSheet
                                        open={editActiveJobSheetOpen}
                                        onOpenChange={setEditActiveJobSheetOpen}
                                        job={selectedActiveJob || undefined}
                                        onSuccess={loadActiveJobs}

                                    />
                                </>
                            )}

                            {createJobSheetOpen &&
                                <CreateJobSheet open={createJobSheetOpen} onOpenChange={setCreateJobSheetOpen} customSequentialNumber={jobNumberSequential} onSuccess={loadActiveJobs} />}

                            <ConfirmArchiveDialog
                                isOpen={showArchiveJobsDialog}
                                onClose={() => setShowArchiveJobsDialog(false)}
                                onConfirm={handleArchiveAvailableJobs}
                                itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
                                itemType="job"
                            />


                            <ConfirmArchiveDialog
                                isOpen={showArchiveBidsDialog}
                                onClose={() => setShowArchiveBidsDialog(false)}
                                onConfirm={handleArchiveActiveBids}
                                itemCount={allActiveBidRowsSelected ? activeBidsTotalCount : selectedActiveBids.length}
                                itemType="bid"
                            />
                            <ConfirmDeleteDialog
                                isOpen={showDeleteJobsDialog}
                                onClose={() => setShowDeleteJobsDialog(false)}
                                onConfirm={handleDeleteArchivedJobs}
                                itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
                                itemType="job"
                            />

                            <ConfirmDeleteDialog
                                isOpen={showDeleteBidsDialog}
                                onClose={() => setShowDeleteBidsDialog(false)}
                                onConfirm={handleDeleteArchivedBids}
                                itemCount={allActiveBidRowsSelected ? activeBidsTotalCount : selectedActiveBids.length}
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
