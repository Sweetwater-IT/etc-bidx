"use client";

import { AppSidebar } from "../../../components/app-sidebar";
import { SectionCards } from "../../../components/section-cards";
import { Button } from "../../../components/ui/button";
import { DataTable } from "../../../components/data-table";
import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import { SiteHeader } from "../../../components/site-header";
import { availableJobsColumns, AvailableJobServices } from "../../../data/available-jobs";
import { FilterOption } from "../../../components/table-controls";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ConfirmArchiveDialog } from "../../../components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "../../../components/confirm-delete-dialog";
import { OpenBidSheet } from "../../../components/open-bid-sheet";
import { CardActions } from "../../../components/card-actions";
import { JobDetailsSheet } from "../../../components/job-details-sheet";
import { fetchBids, archiveJobs, deleteArchivedJobs, changeBidStatus } from "../../../lib/api-client";
import { toast } from "sonner";
import { useLoading } from "../../../hooks/use-loading";
import { EditJobNumberDialog } from "../../../components/edit-job-number-dialog";
import { PencilIcon } from "lucide-react";
import { AvailableJob } from "../../../data/available-jobs";
import { DateRange } from "react-day-picker";
import { useCustomers } from "@/hooks/use-customers";
import { exportAvailableJobsToExcel } from "@/lib/exportAvailableJobsToExcel";
import { safeNumber } from "@/lib/safe-number";
import { formatDate } from "@/lib/formatUTCDate";
import { useJobsShared } from "@/hooks/useJobsShared";

// Map between UI status and database status
const mapUiStatusToDbStatus = (uiStatus?: string): "Bid" | "No Bid" | "Unset" | undefined => {
    if (uiStatus === "bid") return "Bid";
    if (uiStatus === "no-bid") return "No Bid";
    if (uiStatus === "unset") return "Unset";
    return undefined;
};

export default function BidBoardPage() {
    const router = useRouter();
    const { customers, getCustomers } = useCustomers();

    const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false);
    const [isCreatingAvailableJob, setIsCreatingAvailableJob] = useState<boolean>(false);
    const [isEditingAvailableJob, setIsEditingAvailableJob] = useState<boolean>(false);
    const [allAvailableJobRowsSelected, setAllAvailableJobRowsSelected] = useState<boolean>(false);
    const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
    const [availableJobsPageIndex, setAvailableJobsPageIndex] = useState(0);
    const [availableJobsPageSize, setAvailableJobsPageSize] = useState(25);
    const [availableJobsPageCount, setAvailableJobsPageCount] = useState(0);
    const [availableJobsTotalCount, setAvailableJobsTotalCount] = useState(0);
    const [selectedAvailableJobs, setSelectedAvailableJobs] = useState<AvailableJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
    const [showArchiveJobsDialog, setShowArchiveJobsDialog] = useState(false);
    const [showDeleteJobsDialog, setShowDeleteJobsDialog] = useState(false);
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [cardData, setCardData] = useState<{ title: string, value: string }[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showFilters, setShowFilters] = useState(false);
    const [activeSegment, setActiveSegment] = useState("all");

    // Reference data for dropdowns and filters
    const [referenceData, setReferenceData] = useState<{
        counties: { id: number; name: string }[];
        owners: { id: number; name: string }[];
        branches: { id: number; name: string; code: string }[];
        estimators: { id: number; name: string }[];
        contractors: { id: number; name: string }[];
    }>({
        counties: [],
        owners: [],
        branches: [],
        estimators: [],
        contractors: [],
    });

    // Define filter options for the Available Jobs table
    const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

    const availableJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        getCustomers();
    }, [getCustomers]);

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

                // Fetch contractors
                const contractorsResponse = await fetch('/api/reference-data?type=contractors');
                const contractorsData = await contractorsResponse.json();

                setReferenceData({
                    counties: countiesData.data || [],
                    owners: ownersData.data || [],
                    branches: branchesData.data || [],
                    estimators: estimatorsData.data || [],
                    contractors: contractorsData.data || [],
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
                    label: 'Requestor',
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
                        value: branch.name
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

    // Extract filter options from filterOptions state
    const branchOptions = filterOptions?.find(opt => opt.field === 'branch')?.options || [];
    const ownerOptions = filterOptions?.find(opt => opt.field === 'owner')?.options || [];
    const countyOptions = filterOptions?.find(opt => opt.field === 'county')?.options || [];
    const estimatorOptions = filterOptions?.find(opt => opt.field === 'requestor')?.options || [];

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

            // Correctly handle archived segment
            if (activeSegment === "archived") {
                options.archived = true; // Filter for archived jobs
                console.log("Using archived filter");
            } else if (activeSegment !== "all") {
                const dbStatus = mapUiStatusToDbStatus(activeSegment);
                options.status = dbStatus; // Filter by status for other segments
                console.log("Mapped DB status:", dbStatus);
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
                };

                return {
                    id: job.id,
                    contractNumber: contractNumberValue,
                    status: job.status || 'Unset',
                    requestor: requestorValue,
                    owner: ownerValue,
                    lettingDate: job.letting_date ? formatDate(job.letting_date) : '-',
                    dueDate: job.due_date ? formatDate(job.due_date) : '-',
                    county: { main: countyValue, secondary: branchValue },
                    countyValue: countyValue,
                    branch: branchValue,
                    dbe: dbeValue,
                    createdAt: job.created_at ? job.created_at : '-',
                    location: locationValue,
                    platform: platformValue,
                    noBidReason,
                    stateRoute,
                    services,
                    archived: job.archived === true
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

    const fetchAvailableJobCounts = useCallback(async (startDate?: string, endDate?: string) => {
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
    }, [startLoading, stopLoading]);

    const [jobCounts, setJobCounts] = useState<Record<string, number>>({
        all: 0,
        unset: 0,
        'no-bid': 0,
        bid: 0,
        archived: 0
    });

    useEffect(() => {
        loadAvailableJobs();
        fetchAvailableJobCounts();
    }, [loadAvailableJobs, fetchAvailableJobCounts, activeSegment, activeFilters, sortBy, sortOrder]);

    useEffect(() => {
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
    }, [dateRange?.from, dateRange?.to, fetchAvailableJobCounts]);

    const handleSegmentChange = (value: string) => {
        setActiveSegment(value);
    };

    const handleMarkAsBidJob = useCallback((job: AvailableJob) => {
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

    const handleViewDetails = (item: AvailableJob) => {
        setSelectedJob(item)
        setOpenBidSheetOpen(true)
    }

    const handleEdit = (item: AvailableJob) => {
        console.log('Edit clicked:', item)
        setSelectedJob(item)
        setIsEditingAvailableJob(true)
    }

    const initiateArchiveJobs = (selectedJobs: AvailableJob[]) => {
        setSelectedAvailableJobs(selectedJobs);
        setShowArchiveJobsDialog(true);
    };

    const initiateDeleteJobs = (selectedJobs: AvailableJob[]) => {
        setSelectedAvailableJobs(selectedJobs);
        setShowDeleteJobsDialog(true);
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
                archived: job.archived === true
            };
        });
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

    const handleUnarchiveAvailableJob = async (item: AvailableJob) => {
        try {
            startLoading();
            const response = await fetch('/api/bids/unarchive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [item.id] }),
            });
            if (!response.ok) throw new Error('Failed to unarchive job');
            toast.success('Job unarchived successfully');
            await loadAvailableJobs();
            await fetchAvailableJobCounts();
        } catch (error) {
            console.error('Error unarchiving job:', error);
            toast.error('Failed to unarchive job');
        } finally {
            stopLoading();
        }
    };

    const onDeleteItems = async (element) => {
        const elementId = element.id;
        if (!elementId) return;

        let response;
        try {
            response = await fetch('/api/bids/deleteForever?id=' + elementId, { method: 'DELETE' });
            const result = await response.json()

            if (result.success) {
                setAvailableJobs((prev) => prev.filter((aj) => aj.id !== element.id));
                toast.success(result.message);
            }
            console.log('Eliminación completada');
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

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

    const handleCreateClick = () => {
        setIsCreatingAvailableJob(true);
    }

    const createButtonLabel = "Create Open Bid";

    const data = useMemo(() => {
        return availableJobs;
    }, [availableJobs]);

    const segments = [
        { label: `All (${jobCounts.all ?? 0})`, value: "all" },
        { label: `Unset (${jobCounts.unset || 0})`, value: "unset" },
        { label: `No Bid (${jobCounts['no-bid'] || 0})`, value: "no-bid" },
        { label: `Bid (${jobCounts.bid || 0})`, value: "bid" },
        { label: `Archived (${jobCounts.archived || 0})`, value: "archived" },
    ];

    const columns = availableJobsColumns;

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
                                            onImportSuccess={loadAvailableJobs}
                                            date={dateRange}
                                            setDate={setDateRange}
                                            importType={'available-jobs'}
                                            onExport={handleExportAvailableJobs}
                                            showFilterButton={false}
                                            showFilters={showFilters}
                                            setShowFilters={setShowFilters}
                                            hideImport={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            <SectionCards data={cardData} />

                            <DataTable<AvailableJob>
                                data={data}
                                columns={columns}
                                segments={segments}
                                segmentValue={activeSegment}
                                segmentCounts={jobCounts}
                                onSegmentChange={handleSegmentChange}
                                onArchiveSelected={initiateArchiveJobs}
                                onDeleteSelected={initiateDeleteJobs}
                                tableRef={availableJobsTableRef}                           
                                enableSearch={true}  
                                searchPlaceholder="Search by contract, requestor, status, county, owner, letting, or due date..."
                                searchableColumns={["contractNumber", "requestor", "status", "owner", "county", "lettingDate", "dueDate"]}  
                                onViewDetails={handleViewDetails}
                                onRowClick={handleViewDetails}
                                onEdit={handleEdit}
                                onArchive={initiateArchiveJobs}
                                onMarkAsBidJob={handleMarkAsBidJob}
                                handleMultiDelete={handleDeleteArchivedJobs}
                                setSelectedRows={setSelectedAvailableJobs}
                                allRowsSelected={allAvailableJobRowsSelected}
                                onAllRowsSelectedChange={setAllAvailableJobRowsSelected}
                                selectedItem={openBidSheetOpen && selectedJob ? selectedJob : undefined}
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
                                onUnarchive={handleUnarchiveAvailableJob}
                                onDeleteItem={onDeleteItems}
                            />

                            {isCreatingAvailableJob ? (
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

                            <ConfirmArchiveDialog
                                isOpen={showArchiveJobsDialog}
                                onClose={() => setShowArchiveJobsDialog(false)}
                                onConfirm={handleArchiveAvailableJobs}
                                itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
                                itemType="job"
                            />

                            <ConfirmDeleteDialog
                                isOpen={showDeleteJobsDialog}
                                onClose={() => setShowDeleteJobsDialog(false)}
                                onConfirm={handleDeleteArchivedJobs}
                                itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
                                itemType="job"
                            />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
