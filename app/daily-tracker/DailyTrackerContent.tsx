'use client'
import { useCallback, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DataTable } from '../../components/data-table'
import { DailyTrackerEntry } from '../../types/DailyTrackerEntry'
import { useDailyTrackerSWR } from '../../hooks/use-daily-tracker-swr'
import { SectionCards } from '../../components/section-cards'

interface Column {
  key: keyof DailyTrackerEntry,
  title: string,
  className?: string
}

const COLUMNS: Column[] = [
  { key: "created", title: "Created" },
  { key: "signDesignation", title: "Sign Designation" },
  { key: "dimension", title: "Dimension" },
  { key: "quantity", title: "Quantity" }
];

const ITEMS_PER_PAGE = 25;

const dailyTrackerCards = [
  {
    title: "Outstanding Signs",
    value: "0", // Placeholder value
    change: 0, // Placeholder value
    trend: "up", // Placeholder value
    description: "Total signs yet to be manufactured"
  },
  {
    title: "Signs Manufactured",
    value: "0", // Placeholder value
    change: 0, // Placeholder value
    trend: "up", // Placeholder value
    description: "Total signs manufactured today"
  },
  {
    title: "Total Square Footage",
    value: "0 sqft", // Placeholder value
    change: 0,
    trend: "up",
    description: "Total square footage of signs manufactured"
  },
  {
    title: "Cost to Manufacture",
    value: "$0.00", // Placeholder value
    change: 0,
    trend: "down",
    description: "Estimated cost to manufacture signs"
  }
];

interface DailyTrackerContentProps {
  setModalOpen: (open: boolean) => void;
  setIsViewMode: (isView: boolean) => void;
  setSelectedEntry: (entry: DailyTrackerEntry | null) => void;
  onModalSuccess: () => void;
}

const DailyTrackerContent = ({ setModalOpen, setIsViewMode, setSelectedEntry, onModalSuccess }: DailyTrackerContentProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  
  const { data: dailyTrackerEntries, totalCount = 0, isLoading, error, mutate } = useDailyTrackerSWR({
    page: currentPage + 1,
    pageSize: pageSize
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleViewEntry = useCallback((entry: DailyTrackerEntry) => {
    setSelectedEntry(entry);
    setIsViewMode(true);
    setModalOpen(true);
  }, [setModalOpen, setIsViewMode, setSelectedEntry]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  useEffect(() => {
    // No longer need to handle keydown for modal as it's managed by parent
    // window.addEventListener('keydown', handleKeyDown);
    // return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col items-center justify-between">
      {!isLoading && (
        <div className='w-full mt-3'>
          <SectionCards data={dailyTrackerCards} />
          <DataTable<DailyTrackerEntry>
            columns={COLUMNS}
            stickyLastColumn
            data={dailyTrackerEntries}
            onViewDetails={handleViewEntry}
            selectedItem={undefined}
            pageCount={pageCount}
            pageIndex={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            totalCount={totalCount}
          />
        </div>
      )}
    </div>
  );
};

export default DailyTrackerContent; 