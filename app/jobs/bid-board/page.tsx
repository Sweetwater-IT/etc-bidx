"use client";

import { Suspense } from "react";
import { SectionCards } from "../../../components/section-cards";
import { DataTable } from "../../../components/data-table";
import { availableJobsColumns } from "../../../data/available-jobs";
import { FilterOption } from "../../../components/table-controls";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { ConfirmArchiveDialog } from "../../../components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "../../../components/confirm-delete-dialog";
import { OpenBidSheet } from "../../../components/open-bid-sheet";
import { CardActions } from "../../../components/card-actions";
import { JobDetailsSheet } from "../../../components/job-details-sheet";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { AvailableJob } from "../../../data/available-jobs";
import { DateRange } from "react-day-picker";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "sonner";

// Fallback for SectionCards
function SectionCardsFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// Fallback for DataTable
function DataTableFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded-md animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 h-10 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function BidBoardPage() {
  const router = useRouter();
  const { customers, getCustomers } = useCustomers();
  const {
    availableJobs,
    availableJobsPageIndex,
    availableJobsPageSize,
    availableJobsPageCount,
    availableJobsTotalCount,
    selectedAvailableJobs,
    selectedJob,
    sortBy,
    sortOrder,
    activeFilters,
    dateRange,
    activeSegment,
    jobCounts,
    referenceData,
    filterOptions,
    loadAvailableJobs,
    fetchAvailableJobCounts,
    handleSegmentChange,
    handleMarkAsBidJob,
    handleUpdateStatus,
    handleSortChange,
    handleFilterChange,
    handleResetControls,
    handleExportAvailableJobs,
    handleArchiveAvailableJobs,
    handleDeleteArchivedJobs,
    handleUnarchiveAvailableJob,
    setAvailableJobsPageIndex,
    setAvailableJobsPageSize,
    setSelectedAvailableJobs,
    setSelectedJob,
    setDateRange,
    setActiveSegment,
    setSortBy,
    setSortOrder,
    setActiveFilters,
    setJobCounts,
  } = useAvailableJobs();

  const [openBidSheetOpen, setOpenBidSheetOpen] = useState(false);
  const [isCreatingAvailableJob, setIsCreatingAvailableJob] = useState<boolean>(false);
  const [isEditingAvailableJob, setIsEditingAvailableJob] = useState<boolean>(false);
  const [allAvailableJobRowsSelected, setAllAvailableJobRowsSelected] = useState<boolean>(false);
  const [showArchiveJobsDialog, setShowArchiveJobsDialog] = useState(false);
  const [showDeleteJobsDialog, setShowDeleteJobsDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cardData, setCardData] = useState<{ title: string, value: string }[]>([]);

  const availableJobsTableRef = useRef<{ resetRowSelection: () => void }>(null);

  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  // Update cardData from fetchAvailableJobCounts return value
  useEffect(() => {
    fetchAvailableJobCounts().then((stats) => {
      setCardData(stats || []);
    });
  }, [fetchAvailableJobCounts]);

  const handleJobNavigation = (direction: 'up' | 'down') => {
    if (!selectedJob || !availableJobs.length) return;

    const currentIndex = availableJobs.findIndex(job =>
      job.contractNumber === selectedJob.contractNumber
    );

    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'down') {
      nextIndex = (currentIndex + 1) % availableJobs.length;
    } else {
      nextIndex = (currentIndex - 1 + availableJobs.length) % availableJobs.length;
    }

    setSelectedJob(availableJobs[nextIndex]);
  };

  const handleViewDetails = (item: AvailableJob) => {
    setSelectedJob(item);
    setOpenBidSheetOpen(true);
  };

  const handleEdit = (item: AvailableJob) => {
    console.log('Edit clicked:', item);
    setSelectedJob(item);
    setIsEditingAvailableJob(true);
  };

  const initiateArchiveJobs = (selectedJobs: AvailableJob[]) => {
    setSelectedAvailableJobs(selectedJobs);
    setShowArchiveJobsDialog(true);
  };

  const initiateDeleteJobs = (selectedJobs: AvailableJob[]) => {
    setSelectedAvailableJobs(selectedJobs);
    setShowDeleteJobsDialog(true);
  };

  const onDeleteItems = async (element: AvailableJob) => {
    const elementId = element.id;
    if (!elementId) return;
  
    try {
      const response = await fetch(`/api/bids/deleteForever?id=${elementId}`, { method: 'DELETE' });
      const result = await response.json();
  
      if (result.success) {
        toast.success(result.message || "Item deleted successfully");
        await loadAvailableJobs(); // Refresh the table
        fetchAvailableJobCounts().then((stats) => setCardData(stats || [])); // Optional: refresh cards
      } else {
        toast.error(result.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Unexpected error during deletion");
    }
  };

  const handleCreateClick = () => {
    setIsCreatingAvailableJob(true);
  };

  const createButtonLabel = "Create Open Bid";

  const data = useMemo(() => availableJobs, [availableJobs]);

  const segments = [
    { label: `All (${jobCounts.all ?? 0})`, value: "all" },
    { label: `Unset (${jobCounts.unset || 0})`, value: "unset" },
    { label: `No Bid (${jobCounts['no-bid'] || 0})`, value: "no-bid" },
    { label: `Bid (${jobCounts.bid || 0})`, value: "bid" },
    { label: `Archived (${jobCounts.archived || 0})`, value: "archived" },
  ];

  const columns = availableJobsColumns;

  // Extract filter options
  const branchOptions = filterOptions?.find(opt => opt.field === 'branch')?.options || [];
  const ownerOptions = filterOptions?.find(opt => opt.field === 'owner')?.options || [];
  const countyOptions = filterOptions?.find(opt => opt.field === 'county')?.options || [];
  const estimatorOptions = filterOptions?.find(opt => opt.field === 'requestor')?.options || [];

  return (
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
                onExport={() => handleExportAvailableJobs(allAvailableJobRowsSelected)}
                showFilterButton={false}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                hideImport={false}
              />
            </div>
          </div>
        </div>

        <Suspense fallback={<SectionCardsFallback />}>
          <SectionCards data={cardData} />
        </Suspense>

        <Suspense fallback={<DataTableFallback />}>
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
            handleMultiDelete={() => handleDeleteArchivedJobs(allAvailableJobRowsSelected, selectedAvailableJobs)}
            setSelectedRows={setSelectedAvailableJobs}
            allRowsSelected={allAvailableJobRowsSelected}
            onAllRowsSelectedChange={setAllAvailableJobRowsSelected}
            selectedItem={openBidSheetOpen && selectedJob ? selectedJob : undefined}
            onUpdateStatus={handleUpdateStatus}
            stickyLastColumn
            pageCount={availableJobsPageCount}
            pageIndex={availableJobsPageIndex}
            pageSize={availableJobsPageSize}
            onPageChange={setAvailableJobsPageIndex}
            onPageSizeChange={setAvailableJobsPageSize}
            totalCount={availableJobsTotalCount}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
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
        </Suspense>

        {isCreatingAvailableJob ? (
          <OpenBidSheet
            open={isCreatingAvailableJob}
            onOpenChange={setIsCreatingAvailableJob}
            onSuccess={() => {
              loadAvailableJobs();
              fetchAvailableJobCounts().then((stats) => setCardData(stats || []));
            }}
            job={undefined}
          />
        ) : isEditingAvailableJob ? (
          <OpenBidSheet
            open={isEditingAvailableJob}
            onOpenChange={setIsEditingAvailableJob}
            onSuccess={() => {
              loadAvailableJobs();
              fetchAvailableJobCounts().then((stats) => setCardData(stats || []));
            }}
            job={selectedJob || undefined}
          />
        ) : (
          <JobDetailsSheet
            open={openBidSheetOpen}
            onOpenChange={setOpenBidSheetOpen}
            job={selectedJob || undefined}
            onEdit={handleEdit}
            onNavigate={handleJobNavigation}
          />
        )}

        <ConfirmArchiveDialog
          isOpen={showArchiveJobsDialog}
          onClose={() => setShowArchiveJobsDialog(false)}
          onConfirm={() => handleArchiveAvailableJobs(allAvailableJobRowsSelected, selectedAvailableJobs)}
          itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
          itemType="job"
        />

        <ConfirmDeleteDialog
          isOpen={showDeleteJobsDialog}
          onClose={() => setShowDeleteJobsDialog(false)}
          onConfirm={() => handleDeleteArchivedJobs(allAvailableJobRowsSelected, selectedAvailableJobs)}
          itemCount={allAvailableJobRowsSelected ? availableJobsTotalCount : selectedAvailableJobs.length}
          itemType="job"
        />
      </div>
    </div>
  );
}
