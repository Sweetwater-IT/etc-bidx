'use client'
import { useCallback, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CardActions } from '../../components/card-actions'
import { DataTable } from '../../components/data-table'
import { CustomerDrawer } from '../../components/customer-drawer'
import { DailyTrackerEntry } from '../../types/DailyTrackerEntry'
import { useCustomersSWR } from '../../hooks/use-customers-swr'
import { useDailyTrackerSWR } from '../../hooks/use-daily-tracker-swr'
import { AddItemModal } from '../../components/add-item-modal'
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

const DailyTrackerContent = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyTrackerEntry | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

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
    const index = dailyTrackerEntries.findIndex(e => e.id === entry.id);
    setSelectedIndex(index >= 0 ? index : -1);
    setIsViewMode(true);
    setModalOpen(true);
  }, [dailyTrackerEntries]);

  const handleCreateEntry = useCallback(() => {
    setSelectedEntry(null);
    setIsViewMode(false);
    setModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    mutate();
  }, [mutate]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!dailyTrackerEntries.length || !modalOpen) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (prev < 0) prev = 0;
        const newIndex = prev < dailyTrackerEntries.length - 1 ? prev + 1 : prev;
        setSelectedEntry(dailyTrackerEntries[newIndex]);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (prev < 0) prev = 0;
        const newIndex = prev > 0 ? prev - 1 : prev;
        setSelectedEntry(dailyTrackerEntries[newIndex]);
        return newIndex;
      });
    }
  }, [dailyTrackerEntries, modalOpen]);

  useEffect(() => {
    if (modalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalOpen, handleKeyDown]);

  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="flex items-center justify-between px-0 -mb-3 ml-auto">
        <CardActions
          createButtonLabel="Add Item"
          hideCalendar
          goUpActions
          onCreateClick={handleCreateEntry}
          hideImportExport
        />
      </div>
      
      {!isLoading && (
        <div className='w-full mt-3'>
          <SectionCards data={dailyTrackerCards} />
          <DataTable<DailyTrackerEntry>
            columns={COLUMNS}
            stickyLastColumn
            data={dailyTrackerEntries}
            onViewDetails={handleViewEntry}
            selectedItem={selectedEntry || undefined}
            pageCount={pageCount}
            pageIndex={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            totalCount={totalCount}
          />
        </div>
      )}
      
      <AddItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entry={selectedEntry}
        isViewMode={isViewMode}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default DailyTrackerContent; 