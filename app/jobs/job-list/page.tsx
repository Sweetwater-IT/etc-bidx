"use client";

import { SectionCards } from "../../../components/section-cards";
import { Button } from "../../../components/ui/button";
import { DataTable } from "../../../components/data-table";
import { type ActiveJob } from "../../../data/active-jobs";
import { FilterOption } from "../../../components/table-controls";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ConfirmArchiveDialog } from "../../../components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "../../../components/confirm-delete-dialog";
import { ActiveJobDetailsSheet } from "../../../components/active-job-details-sheet";
import { EditActiveJobSheet } from "../../../components/edit-active-job-sheet";
import { CreateJobSheet } from "../../../components/create-job-sheet";
import { CardActions } from "../../../components/card-actions";
import { archiveActiveJobs, deleteArchivedActiveJobs } from "../../../lib/api-client";
import { toast } from "sonner";
import { useLoading } from "../../../hooks/use-loading";
import { EditJobNumberDialog } from "../../../components/edit-job-number-dialog";
import { PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JobListPage() {
    const router = useRouter();

    const [allActiveJobRowsSelected, setAllActiveJobRowsSelected] = useState<boolean>(false);
    const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
    const [activeJobsPageIndex, setActiveJobsPageIndex] = useState(0);
    const [activeJobsPageSize, setActiveJobsPageSize] = useState(25);
    const [activeJobsPageCount, setActiveJobsPageCount] = useState(0);
    const [activeJobsTotalCount, setActiveJobsTotalCount] = useState(0);
    const [showArchiveActiveJobsDialog, setShowArchiveActiveJobsDialog] = useState<boolean>(false);
    const [showDeleteActiveJobsDialog, setShowDeleteActiveJobsDialog] = useState<boolean>(false);
    const [selectedActiveJobsToArchive, setSelectedActiveJobsToArchive] = useState<ActiveJob[]>([]);
    const [selectedActiveJobsToDelete, setSelectedActiveJobsToDelete] = useState<ActiveJob[]>([]);
    const [jobDetailsSheetOpen, setJobDetailsSheetOpen] = useState(false);
    const [editJobSheetOpen, setEditJobSheetOpen] = useState(false);
    const [selectedActiveJob, setSelectedActiveJob] = useState<ActiveJob | null>(null);
    const [activeJobDetailsSheetOpen, setActiveJobDetailsSheetOpen] = useState(false);
    const [editActiveJobSheetOpen, setEditActiveJobSheetOpen] = useState(false);
    const [activeSegment, setActiveSegment] = useState("all");
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [cardData, setCardData] = useState<{ title: string, value: string }[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [nextJobNumber, setNextJobNumber] = useState<string>("");
    const [editJobNumberOpen, setEditJobNumberOpen] = useState(false);
    const [jobNumberYear, setJobNumberYear] = useState<string>("");
    const [jobNumberSequential, setJobNumberSequential] = useState<string>("");
    const [createJobSheetOpen, setCreateJobSheetOpen] = useState(false);

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

    // Define filter options for the Active Jobs table
    const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

    const activeJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const { startLoading, stopLoading } = useLoading();

    const [activeJobCounts, setActiveJobCounts] = useState<Record<string, number>>({
        all: 0,
        west: 0,
        turbotville: 0,
        hatfield: 0,
        archived: 0
    });

    const [filteredBranchCounts, setFilteredBranchCounts] = useState<Record<string, number>>({});

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
                    label: 'Contractor',
                    field: 'contractor',
                    options: referenceData.contractors.map(contractor => ({
                        label: contractor.name,
                        value: contractor.name
                    }))
                },
                {
                    label: 'Project Status',
                    field: 'projectStatus',
                    options: [
                        { label: 'NOT STARTED', value: 'NOT_STARTED' },
                        { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
                        { label: 'COMPLETE', value: 'COMPLETE' }
                    ]
                },
                {
                    label: 'Billing Status',
                    field: 'billingStatus',
                    options: [
                        { label: 'NOT STARTED', value: 'NOT_STARTED' },
                        { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
                        { label: 'COMPLETE', value: 'COMPLETE' }
                    ]
                },
                {
                    label: 'County',
                    field: 'county',
                    options: referenceData.counties.map(county => ({
                        label: county.name,
                        value: county.name
                    }))
                },
                {
                    label: 'Branch',
                    field: 'branch',
                    options: referenceData.branches.filter(branch => branch.name !== 'tes').map(branch => ({
                        label: branch.name,
                        value: branch.name
                    }))
                }
            ];
            setFilterOptions(options);
        }
    }, [referenceData]);

    // Extract filter options from filterOptions state
    const branchOptions = filterOptions?.find(opt => opt.field === 'branch')?.options || [];
    const countyOptions = filterOptions?.find(opt => opt.field === 'county')?.options || [];
    const contractorOptions = filterOptions?.find(opt => opt.field === 'contractor')?.options || [];
    const projectStatusOptions = filterOptions?.find(opt => opt.field === 'projectStatus')?.options || [];
    const billingStatusOptions = filterOptions?.find(opt => opt.field === 'billingStatus')?.options || [];

    const loadActiveJobs = useCallback(async () => {        
        try {
            startLoading();

            const options: any = {
                limit: activeJobsPageSize,
                page: activeJobsPageIndex + 1, // API uses 1-based indexing
            };

            // Handle segment filtering for archived jobs
            if (activeSegment === "archived") {
                // For archived segment, filter by archived field
                options.archived = true;
                console.log("Using archived filter for active jobs");
            } else if (activeSegment !== "all") {
                // For non-archived segments, exclude archived items and filter by branch
                options.archived = false; // Explicitly exclude archived items
                options.branch = activeSegment;
            } else {
                // For "all" segment, explicitly exclude archived items
                options.archived = false;
            }

            // Add filter parameters if any are active
            if (Object.keys(activeFilters).length > 0) {
                options.filters = JSON.stringify(activeFilters);
                console.log(`Adding filters: ${JSON.stringify(activeFilters)}`);
            }

            // Add sorting parameters if available
            if (sortBy) {
                options.sortBy = sortBy;
                options.sortOrder = sortOrder;
                console.log(`Adding sort: ${sortBy} ${sortOrder}`);
            }

            console.log("Active jobs fetch options:", options);

            const response = await fetch(`/api/jobs?${new URLSearchParams(options).toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch active jobs');
            }
            const result = await response.json();
            const { data, stats, pagination } = result;

            const uiJobs = data.map((job: any) => ({
                id: job.id,
                jobNumber: job.jobNumber,
                bidNumber: job.bidNumber || "",
                projectStatus: job.projectStatus,
                billingStatus: job.billingStatus,
                contractNumber: job.contractNumber,
                cpr: job.cpr,
                location: job.location,
                county: (job.county.trim() === '' || job.county === 'Choose County') ? '-' : { main: job.countyJson.name, secondary: job.countyJson.branch },
                countyJson: job.countyJson,
                branch: job.countyJson.branch,
                contractor: job.contractor,
                startDate: job.startDate,
                endDate: job.endDate,
                createdAt: job.createdAt ? job.createdAt : "",
                wonBidItems: job.wonBidItems,
                archived: job.archived // Include archived status
            }));

            setActiveJobs(uiJobs);
            setActiveJobsPageCount(pagination.pageCount);
            setActiveJobsTotalCount(pagination.totalCount);
            setCardData([{
                title: 'Total Active Jobs',
                value: stats.totalActive
            },
            {
                title: 'Total Jobs Pending Billing',
                value: stats.totalPendingBilling
            },
            {
                title: 'Total Jobs Over Days',
                value: stats.overdays
            },
            {
                title: '# of Jobs Pending Start',
                value: '12'
            }
            ])
        } catch (error) {
            console.error("Error loading active jobs:", error);
            toast.error("Failed to load active jobs. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, activeJobsPageIndex, activeJobsPageSize, startLoading, stopLoading, activeFilters, sortBy, sortOrder]);

    const fetchActiveJobCounts = useCallback(async () => {
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
    }, [startLoading, stopLoading]);

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

    // Helper to get filters without branch
    const getFiltersWithoutBranch = useCallback(() => {
        const { branch, ...rest } = activeFilters;
        return rest;
    }, [activeFilters]);

    // Fetch total count for each branch with current filters (excluding branch filter)
    const fetchFilteredBranchCounts = useCallback(async () => {
        if (!branchOptions.length) return;
        // Remove 'branch' from filters for branch count API calls
        const { branch, ...filtersWithoutBranch } = activeFilters;
        const counts: Record<string, number> = {};
        await Promise.all(
            branchOptions.map(async (opt) => {
                const params = new URLSearchParams();
                params.set("limit", "1");
                params.set("page", "1");
                params.set("archived", "false");
                params.set("filters", JSON.stringify({ "branch": [opt.value] }));
                params.set("branch", opt.value);
                const res = await fetch(`/api/jobs?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    counts[opt.value] = data.pagination?.totalCount || 0;
                } else {
                    counts[opt.value] = 0;
                }
            })
        );
        // Also fetch 'All' count (no branch param, no branch in filters)
        const allParams = new URLSearchParams();
        allParams.set("limit", "1");
        allParams.set("page", "1");
        allParams.set("archived", "false");
        if (Object.keys(filtersWithoutBranch).length > 0) {
            allParams.set("filters", JSON.stringify(filtersWithoutBranch));
        }
        const allRes = await fetch(`/api/jobs?${allParams.toString()}`);
        let allCount = 0;
        if (allRes.ok) {
            const data = await allRes.json();
            allCount = data.pagination?.totalCount || 0;
        }
        setFilteredBranchCounts({ ...counts, all: allCount });
    }, [branchOptions, activeFilters, sortBy, sortOrder]);

    // Update branch counts when filters, sorting, or data reloads
    useEffect(() => {
        fetchFilteredBranchCounts();
    }, [fetchFilteredBranchCounts]);

    useEffect(() => {
        loadActiveJobs();
        fetchActiveJobCounts();
        fetchNextJobNumber();
    }, [loadActiveJobs, fetchActiveJobCounts, fetchNextJobNumber, activeSegment, activeFilters, sortBy, sortOrder]);

    const handleSegmentChange = (value: string) => {
        if (value === "all") {
            setActiveSegment("all");
            setActiveFilters(filters => {
                const { branch, ...rest } = filters;
                return rest;
            });
        } else if (value === "archived") {
            setActiveSegment("archived");
            setActiveFilters(filters => {
                const { branch, ...rest } = filters;
                return rest;
            });
        } else {
            // It's a branch value
            setActiveSegment(value); // Set to branch value for highlighting
            setActiveFilters(filters => ({ ...filters, branch: [value] }));
        }
    };

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
            const ids = selectedActiveJobsToArchive.map(job => job.id.toString());

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
            const ids = selectedActiveJobsToDelete.map(job => job.id.toString());

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

    const handleUnarchiveActiveJob = async (item: ActiveJob) => {
        try {
            startLoading();
            // Use the new unarchive endpoint
            const response = await fetch('/api/jobs/active-jobs/unarchive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [item.id] }),
            });
            if (!response.ok) throw new Error('Failed to unarchive job');
            toast.success('Job unarchived successfully');
            await loadActiveJobs();
            await fetchActiveJobCounts();
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
            response = await fetch('/api/jobs/deleteForever?id=' + elementId, { method: 'DELETE' });
            const result = await response.json()

            if (result.success) {
                setActiveJobs((prev) => prev.filter((aj) => aj.id !== element.id));
                toast.success(result.message);
            }
            console.log('Eliminación completada');
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    // Handler for sorting changes
    const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
        setSortBy(column);
        setSortOrder(direction);
        setActiveJobsPageIndex(0);
    };

    // Handler for filter changes
    const handleFilterChange = (filters: Record<string, any>) => {
        const formattedFilters: Record<string, string[]> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "all" && value !== "none" && value !== "") {
                formattedFilters[key] = Array.isArray(value) ? value : [value];
            }
        });
        setActiveFilters(formattedFilters);
        setActiveJobsPageIndex(0);
    };

    // Handler for resetting all filters and sorts
    const handleResetControls = () => {
        setActiveFilters({});
        setSortBy(undefined);
        setSortOrder('asc');
        setActiveJobsPageIndex(0);
    };

    const handleCreateClick = () => {
        setCreateJobSheetOpen(true);
    }

    const createButtonLabel = "Create Active Job";

    const data = useMemo(() => {
        return activeJobs;
    }, [activeJobs]);

    const DISPLAYED_ACTIVE_JOBS_COLUMNS = [
        { key: "jobNumber", title: "Job Number", className: 'whitespace-nowrap' },
        { key: "bidNumber", title: "Bid Number" },
        { key: "projectStatus", title: "Project Status" },
        { key: "billingStatus", title: "Billing Status" },
        { key: "contractNumber", title: "Contract Number", className: 'truncate whitespace-nowrap max-w-40' },
        { key: "location", title: "Location", className: 'truncate whitespace-nowrap max-w-30' },
        { key: "county", title: "County" },
        { key: "contractor", title: "Contractor" },
        { key: "startDate", title: "Start Date", className: 'whitespace-nowrap' },
        { key: "endDate", title: "End Date", className: 'whitespace-nowrap' },
        { key: 'cpr', title: 'CPR' },
        { key: 'createdAt', title: 'Created At', className: 'whitespace-nowrap' }
    ];

    const columns = DISPLAYED_ACTIVE_JOBS_COLUMNS;

    const segments = [
        { label: `All (${filteredBranchCounts.all ?? 0})`, value: "all" },
        ...branchOptions.map(opt => ({
            label: `${opt.label} (${filteredBranchCounts[opt.value] ?? 0})`,
            value: opt.value
        })),
        { label: `Archived (${activeJobCounts.archived ?? 0})`, value: "archived" }
    ];

    return (
        <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <CardActions
                                            createButtonLabel={createButtonLabel}
                                            onCreateClick={handleCreateClick}
                                            date={undefined}
                                            setDate={undefined}
                                            importType={undefined}
                                            onExport={undefined}
                                            showFilterButton={false}
                                            showFilters={showFilters}
                                            setShowFilters={setShowFilters}
                                            hideImport={true}
                                        />
                                    </div>
                                    {nextJobNumber && (
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

                            <DataTable<ActiveJob>
                                data={data}
                                columns={columns}
                                segments={segments}
                                segmentValue={activeSegment}
                                segmentCounts={activeJobCounts}
                                onSegmentChange={handleSegmentChange}
                                stickyLastColumn
                                enableSearch={true}
                                searchPlaceholder="Search by job number, bid number, project status, contract number, contractor, location, or county..."
                                searchableColumns={["jobNumber", "bidNumber", "projectStatus", "contractNumber", "contractor", "location", "county"]}

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
                                onUnarchive={handleUnarchiveActiveJob}
                                // Pagination props
                                pageCount={activeJobsPageCount}
                                pageIndex={activeJobsPageIndex}
                                pageSize={activeJobsPageSize}
                                onPageChange={setActiveJobsPageIndex}
                                onPageSizeChange={setActiveJobsPageSize}
                                totalCount={activeJobsTotalCount}
                                // Sorting props
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortChange={handleSortChange}
                                // Filtering props
                                filterOptions={filterOptions}
                                branchOptions={branchOptions}
                                countyOptions={countyOptions}
                                contractorOptions={contractorOptions}
                                projectStatusOptions={projectStatusOptions}
                                billingStatusOptions={billingStatusOptions}
                                activeFilters={activeFilters}
                                onFilterChange={handleFilterChange}
                                onReset={handleResetControls}
                                showFilters={showFilters}
                                setShowFilters={setShowFilters}
                                hideDropdown={true}
                                onDeleteItem={onDeleteItems}
                            />

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

                            {createJobSheetOpen &&
                                <CreateJobSheet open={createJobSheetOpen} onOpenChange={setCreateJobSheetOpen} customSequentialNumber={jobNumberSequential} onSuccess={loadActiveJobs} />}

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
            </div>
        );
}
