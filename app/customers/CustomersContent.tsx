'use client'
import { useCallback, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CardActions } from '../../components/card-actions'
import { DataTable } from '../../components/data-table'
import { CustomerDrawer } from '../../components/customer-drawer'
import { Customer } from '../../types/Customer'
import { useCustomersSWR } from '../../hooks/use-customers-swr'

interface Column {
  key: keyof Customer,
  title: string,
  className?: string
}

const COLUMNS: Column[] = [
  { key: "name", title: "Name" },
  { key: "customerNumber", title: "Customer Number" },
  { key: "address", title: "Address" },
  { key: "city", title: "City" },
  { key: "state", title: "State" },
  { key: "zip", title: "ZIP" },
  { key: 'created', title: 'Created' },
  { key: 'updated', title: 'Last Updated' }
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "1%10", value: "1%10" },
  { label: "COD", value: "COD" },
  { label: "CC", value: "CC" },
  { label: "NET15", value: "NET15" },
  { label: "NET30", value: "NET30" }
];

const ITEMS_PER_PAGE = 25;

const CustomersContent = () => {
  const [currentPage, setCurrentPage] = useState(0); // DataTable uses 0-indexed pages
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [selectedSegment, setSelectedSegment] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<Customer[]>([]);
  const [allRowsSelected, setAllRowsSelected] = useState(false);

  // Segment counts state
  const [segmentCounts, setSegmentCounts] = useState({
    all: 0,
    '1%10': 0,
    COD: 0,
    CC: 0,
    NET15: 0,
    NET30: 0
  });

  const { customers, totalCount, isLoading, error, mutate } = useCustomersSWR({
    page: currentPage + 1,
    pageSize: pageSize,
    paymentTerms: selectedSegment === "all" ? undefined : selectedSegment,
    search: searchTerm || undefined,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleViewCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    const index = customers.findIndex(c => c.id === customer.id);
    setSelectedIndex(index >= 0 ? index : -1);
    setIsViewMode(true);
    setDrawerOpen(true);
  }, [customers]);

  const handleCreateCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setIsViewMode(false);
    setDrawerOpen(true);
  }, []);

  // Fetch counts for each segment
  const fetchCounts = useCallback(async () => {
    try {
      console.log('Fetching customer counts...');
      const response = await fetch('/api/customers?counts=true');
      const data = await response.json();
      console.log('Customer counts response:', data);

      if (data.success) {
        const newCounts = {
          all: data.counts.all || 0,
          '1%10': data.counts['1%10'] || 0,
          COD: data.counts.COD || 0,
          CC: data.counts.CC || 0,
          NET15: data.counts.NET15 || 0,
          NET30: data.counts.NET30 || 0
        };
        console.log('Setting segment counts:', newCounts);
        setSegmentCounts(newCounts);
      } else {
        console.error("Error fetching segment counts:", data.error);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    mutate();
    fetchCounts(); // Refresh counts when customer is created/updated
  }, [mutate, fetchCounts]);


  const handleSegmentChange = useCallback((value: string) => {
    setSelectedSegment(value);
    setCurrentPage(0);
  }, []);


  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);


  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!customers.length || !drawerOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        // If no customer is selected yet, start from the beginning
        if (prev < 0) prev = 0;
        const newIndex = prev < customers.length - 1 ? prev + 1 : prev;
        setSelectedCustomer(customers[newIndex]);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (prev < 0) prev = 0;
        const newIndex = prev > 0 ? prev - 1 : prev;
        setSelectedCustomer(customers[newIndex]);
        return newIndex;
      });
    }
  }, [customers, drawerOpen]);

  // Add this handler
  const handleDeleteSelected = useCallback((selectedRows: Customer[]) => {
    console.log('Selected customers for deletion:', selectedRows);
    // Minimal handler to trigger checkbox rendering
  }, []);

  // Only add event listener when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  // Load counts when component mounts
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Calculate total pages for DataTable based on current page size
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="flex items-center justify-between px-0 -mb-3 ml-auto">
        <CardActions
          createButtonLabel="Create Customer"
          hideCalendar
          goUpActions
          onCreateClick={handleCreateCustomer}
        />
      </div>

      {!isLoading && (
        <div className='w-full mt-3'>
          <DataTable<Customer>
            columns={COLUMNS}
            segments={SEGMENTS}
            segmentValue={selectedSegment}
            segmentCounts={segmentCounts}
            stickyLastColumn
            enableSearch={true}
            searchPlaceholder="Search by company name or customer number..."
            searchableColumns={["name", "customerNumber"]}
            data={customers}
            onViewDetails={handleViewCustomer}
            selectedItem={selectedCustomer || undefined}
            onSegmentChange={handleSegmentChange}
            pageCount={pageCount}
            pageIndex={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            totalCount={totalCount}
            onDeleteSelected={handleDeleteSelected}
            setSelectedRows={setSelectedRows}
            onAllRowsSelectedChange={setAllRowsSelected}
            allRowsSelected={allRowsSelected}
          />
        </div>
      )}

      <CustomerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        customer={selectedCustomer}
        isViewMode={isViewMode}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default CustomersContent;
