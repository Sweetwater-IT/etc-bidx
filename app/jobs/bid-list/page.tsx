"use client";

import { AppSidebar } from "../../../components/app-sidebar";
import { SectionCards } from "../../../components/section-cards";
import { DataTable } from "../../../components/data-table";
import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import { SiteHeader } from "../../../components/site-header";
import { ACTIVE_BIDS_COLUMNS, type ActiveBid } from "../../../data/active-bids";
import { FilterOption } from "../../../components/table-controls";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ConfirmArchiveDialog } from "../../../components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "../../../components/confirm-delete-dialog";
import { ActiveBidDetailsSheet } from "../../../components/active-bid-details-sheet";
import { CardActions } from "../../../components/card-actions";
import { changeActiveBidStatus, archiveActiveBids, deleteArchivedActiveBids } from "../../../lib/api-client";
import { toast } from "sonner";
import { useLoading } from "../../../hooks/use-loading";
import { useCustomers } from "@/hooks/use-customers";
import { EstimateData, exportBidsToExcel } from "@/lib/exportBidsToExcel";
import { EstimateProvider } from "@/contexts/EstimateContext";
import { BidSummaryDrawer } from "@/components/bid-summary-drawer";
import { formatDate } from "@/lib/formatUTCDate";

export default function BidListPage() {
    const router = useRouter();
    const { customers } = useCustomers();

    const [allActiveBidRowsSelected, setAllActiveBidRowsSelected] = useState<boolean>(false);
    const [selectedActiveBids, setSelectedActiveBids] = useState<ActiveBid[]>([]);
    const [activeBids, setActiveBids] = useState<ActiveBid[]>([]);
    const [activeBidsPageIndex, setActiveBidsPageIndex] = useState(0);
    const [activeBidsPageSize, setActiveBidsPageSize] = useState(25);
    const [activeBidsPageCount, setActiveBidsPageCount] = useState(0);
    const [activeBidsTotalCount, setActiveBidsTotalCount] = useState(0);
    const [showArchiveBidsDialog, setShowArchiveBidsDialog] = useState(false);
    const [showDeleteBidsDialog, setShowDeleteBidsDialog] = useState(false);
    const [selectedActiveBid, setSelectedActiveBid] = useState<ActiveBid | null>(null);
    const [activeBidDetailsSheetOpen, setActiveBidDetailsSheetOpen] = useState(false);
    const [allActiveBidsDetailed, setAllActiveBidsDetailed] = useState<EstimateData[]>([]);
    const [viewBidSummaryOpen, setViewBidSummaryOpen] = useState<boolean>(false);
    const [activeSegment, setActiveSegment] = useState("all");
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [cardData, setCardData] = useState<{ title: string, value: string }[]>([]);
    const [showFilters, setShowFilters] = useState(false);

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

    // Define filter options for the Active Bids table
    const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

    const activeBidsTableRef = useRef<{ resetRowSelection: () => void }>(null);
    const { startLoading, stopLoading } = useLoading();

    const [activeBidCounts, setActiveBidCounts] = useState<Record<string, number>>({
        all: 0,
        won: 0,
        pending: 0,
        lost: 0,
        draft: 0,
        'won-pending': 0,
        archived: 0
    });

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
                        { label: 'Won', value: 'Won' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Lost', value: 'Lost' },
                        { label: 'Draft', value: 'Draft' },
                        { label: 'Won - Pending', value: 'Won - Pending' }
                    ]
                }
            ];
            setFilterOptions(options);
        }
    }, [referenceData, customers]);

    // Extract filter options from filterOptions state
    const branchOptions = filterOptions?.find(opt => opt.field === 'branch')?.options || [];
    const ownerOptions = filterOptions?.find(opt => opt.field === 'owner')?.options || [];
    const countyOptions = filterOptions?.find(opt => opt.field === 'county')?.options || [];
    const estimatorOptions = filterOptions?.find(opt => opt.field === 'estimator')?.options || []; // Note: for bids, estimator is from referenceData.estimators, but field might be 'estimator'

    // Load active bids data
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

            // Add filter parameters if any are active
            if (Object.keys(activeFilters).length > 0) {
                options.filters = JSON.stringify(activeFilters);
                console.log(`Adding filters: ${JSON.stringify(activeFilters)}`);
            }

            // Handle segment filtering
            if (activeSegment === "archived") {
                // For archived segment, filter by archived field
                options.archived = true;
                console.log("Using archived filter");
            } else if (activeSegment !== "all") {
                // For non-archived segments, exclude archived items and filter by status/division
                options.archived = false; // Explicitly exclude archived items

                const statusValues = ['pending', 'won', 'lost', 'draft', 'won-pending'];

                if (statusValues.includes(activeSegment.toLowerCase())) {
                    options.status = activeSegment;
                } else {
                    options.division = activeSegment;
                }
            } else {
                // For "all" segment, explicitly exclude archived items
                options.archived = false;
            }

            // Add sorting parameters if available
            if (sortBy) {
                options.sortBy = sortBy;
                options.sortOrder = sortOrder;
                console.log(`Adding sort: ${sortBy} ${sortOrder}`);
            }

            console.log("Active bids fetch options:", options);

            const response = await fetch(`/api/active-bids?${new URLSearchParams(options).toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch active bids');
            }
            const result = await response.json();
            //raw data has all the info we need
            const { data, stats, pagination } = result;
            const transformedData = data.map(e => ({
                flagging: e.flagging ?? {},
                id: e.id,
                service_work: e.service_work ?? {},
                bid_notes: Array.isArray(e.notes)
                    ? e.notes
                    : JSON.parse(e.notes || "[]"),
                contractNumber: e.contractNumber,
                originalContractNumber: e.contractNumber,
                contractor: (e.contractor_name && customers) ? customers.find(c => c.name === e.contractor_name)?.displayName || customers.find(c => c.name === e.contractor_name)?.name : '-',
                subcontractor: e.subcontractor_name || '-',
                owner: e.admin_data.owner || 'Unknown',
                county: (e.admin_data?.county?.name === '' || e.admin_data?.county?.name === 'Choose County' || !e.admin_data?.county)
                    ? '-'
                    : {
                        main: e.admin_data.county.name,
                        secondary: e?.admin_data?.county?.branch ?? ''
                    },
                branch: e.admin_data?.county?.branch ?? '',
                estimator: e.admin_data.estimator || 'Unknown',
                status: e.status === 'won-pending' ? 'WON - PENDING' : e.status.toUpperCase(),
                division: e.admin_data.division,
                lettingDate: e.admin_data.lettingDate ? e.admin_data.lettingDate : "",
                startDate: e.admin_data.startDate ? e.admin_data.startDate : "",
                endDate: e.admin_data.endDate ? e.admin_data.endDate : "",
                projectDays: e.total_days ? e.total_days : (!!e.admin_data.startDate && !!e.admin_data.endDate) ?
                    Math.ceil((new Date(e.admin_data.endDate).getTime() - new Date(e.admin_data.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                totalHours: e.mpt_rental?._summary?.hours || 0,
                mptValue: e.mpt_rental?._summary.revenue || 0,
                permSignValue: 0,
                rentalValue: e.equipment_rental?.reduce((sum: number, item: any) =>
                    sum + (item.revenue || 0), 0) || 0,
                createdAt: e.created_at ? e.created_at : "",
                total: e.mpt_rental?._summary?.revenue || 0,
                adminData: e.admin_data,
            }));

            setActiveBids(transformedData);
            setActiveBidsPageCount(pagination.pageCount);
            setActiveBidsTotalCount(pagination.totalCount);
            setCardData([{
                title: 'Win / Loss Ratio',
                value: stats.winLossRatio + '%'
            },
            {
                title: 'Draft Bids',
                value: stats.draft
            },
            {
                title: 'Pending Bids',
                value: stats.pending
            },
            {
                title: 'Won Jobs Pending Creation',
                value: stats.wonPending
            }
            ])
        } catch (error) {
            console.error("Error loading active bids:", error);
            toast.error("Failed to load active bids. Please try again.");
        } finally {
            stopLoading();
        }
    }, [activeSegment, activeBidsPageIndex, activeBidsPageSize, startLoading, stopLoading, customers, activeFilters, sortBy, sortOrder]);

    const fetchActiveBidCounts = useCallback(async () => {
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
    }, [startLoading, stopLoading]);

    useEffect(() => {
        loadActiveBids();
        fetchActiveBidCounts();
    }, [loadActiveBids, fetchActiveBidCounts, activeSegment, activeFilters, sortBy, sortOrder]);

    const handleSegmentChange = (value: string) => {
        setActiveSegment(value);
    };

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

    const initiateArchiveBids = (selectedBids: ActiveBid[]) => {        
        setSelectedActiveBids(selectedBids);
        setShowArchiveBidsDialog(true);
    };

    const initiateDeleteBids = (selectedBids: ActiveBid[]) => {
        setSelectedActiveBids(selectedBids);
        setShowDeleteBidsDialog(true);
    };

    const fetchAllFilteredActiveBids = async () => {        
        const options: any = {
            limit: activeBidsTotalCount || 10000,
            page: 1,
            detailed: true
        };

        // Handle segment filtering
        if (activeSegment === "archived") {
            // For archived segment, filter by archived field
            options.archived = true;
        } else if (activeSegment !== "all") {
            // For non-archived segments, exclude archived items and filter by status/division
            options.archived = false;

            const statusValues = ['pending', 'won', 'lost', 'draft', 'won-pending'];
            if (statusValues.includes(activeSegment.toLowerCase())) {
                options.status = activeSegment;
            } else {
                options.division = activeSegment;
            }
        } else {
            // For "all" segment, explicitly exclude archived items
            options.archived = false;
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

        console.log("Fetch all filtered active bids options:", options);

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
            county: e.admin_data?.county?.name === '' || e.admin_data.county.name === 'Choose County' ? '-' : {
                main: e.admin_data.county.name ?? '',
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

    const handleUnarchiveActiveBid = async (item: ActiveBid) => {
        try {
            startLoading();
            const response = await fetch('/api/active-bids/unarchive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [item.id] }),
            });
            if (!response.ok) throw new Error('Failed to unarchive bid');
            toast.success('Bid unarchived successfully');
            await loadActiveBids();
            await fetchActiveBidCounts();
        } catch (error) {
            console.error('Error unarchiving bid:', error);
            toast.error('Failed to unarchive bid');
        } finally {
            stopLoading();
        }
    };

    const onDeleteItems = async (element) => {
        const elementId = element.id;
        if (!elementId) return;

        let response;
        try {
            response = await fetch('/api/active-bids/deleteForever?id=' + elementId, { method: 'DELETE' });
            const result = await response.json()

            if (result.success) {
                setActiveBids((prev) => prev.filter((aj) => aj.id !== element.id));
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
        setActiveBidsPageIndex(0);
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
        setActiveBidsPageIndex(0);
    };

    // Handler for resetting all filters and sorts
    const handleResetControls = () => {
        setActiveFilters({});
        setSortBy(undefined);
        setSortOrder('asc');
        setActiveBidsPageIndex(0);
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

    const handleCreateClick = () => {
        router.push("/active-bid/new");
    }

    const createButtonLabel = "Create Active Bid";

    const data = useMemo(() => {
        return activeBids;
    }, [activeBids]);

    const segments = [
        { label: `All (${activeBidCounts.all || 0})`, value: "all" },
        { label: `Won (${activeBidCounts.won || 0})`, value: "won" },
        { label: `Pending (${activeBidCounts.pending || 0})`, value: "pending" },
        { label: `Lost (${activeBidCounts.lost || 0})`, value: "lost" },
        { label: `Draft (${activeBidCounts.draft || 0})`, value: "draft" },
        { label: `Won - Pending (${activeBidCounts['won-pending'] || 0})`, value: "won-pending" },
        { label: `Archived (${activeBidCounts.archived || 0})`, value: "archived" }
    ];

    const columns = ACTIVE_BIDS_COLUMNS;

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
                                <div className="flex items-center justify-between">
                                    <CardActions
                                        createButtonLabel={createButtonLabel}
                                        onCreateClick={handleCreateClick}
                                        date={undefined}
                                        setDate={undefined}
                                        importType={'active-bids'}
                                        onExport={handleExportActiveBids}
                                        showFilterButton={false}
                                        showFilters={showFilters}
                                        setShowFilters={setShowFilters}
                                        hideImport={true}
                                    />
                                </div>
                            </div>

                            <SectionCards data={cardData} />

                            <DataTable<ActiveBid>
                                data={data}
                                columns={columns}
                                enableSearch={true}
                                searchPlaceholder="Search by letting date, contract number, contractor, owner, estimator, county, or status..."
                                searchableColumns={["lettingDate", "contractNumber", "contractor", "owner", "estimator", "county", "status"]}
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
                                hideDropdown={true}
                                onUnarchive={handleUnarchiveActiveBid}
                                onDeleteItem={onDeleteItems}
                            />

                            {selectedActiveBid && (
                                <>
                                    <ActiveBidDetailsSheet
                                        adminData={selectedActiveBid.adminData}
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
                                        onViewBidSummary={handleViewBidSummary}
                                        onUpdateStatus={handleUpdateActiveBidStatus}
                                    />

                                    <EstimateProvider>
                                        <BidSummaryDrawer defaultBid={allActiveBidsDetailed.find(abd => abd.id === selectedActiveBid.id)} open={viewBidSummaryOpen} onOpenChange={setViewBidSummaryOpen} />
                                    </EstimateProvider>
                                </>
                            )}

                            <ConfirmArchiveDialog
                                isOpen={showArchiveBidsDialog}
                                onClose={() => setShowArchiveBidsDialog(false)}
                                onConfirm={handleArchiveActiveBids}
                                itemCount={allActiveBidRowsSelected ? activeBidsTotalCount : selectedActiveBids.length}
                                itemType="bid"
                            />
                            <ConfirmDeleteDialog
                                isOpen={showDeleteBidsDialog}
                                onClose={() => setShowDeleteBidsDialog(false)}
                                onConfirm={handleDeleteArchivedBids}
                                itemCount={allActiveBidRowsSelected ? activeBidsTotalCount : selectedActiveBids.length}
                                itemType="bid"
                            />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
