import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLoading } from './use-loading';
import { fetchBids, archiveJobs, deleteArchivedJobs, changeBidStatus } from '@/lib/api-client';
import { exportAvailableJobsToExcel } from '@/lib/exportAvailableJobsToExcel';
import { safeNumber } from '@/lib/safe-number';
import { formatDate } from '@/lib/formatUTCDate';
import { AvailableJob } from '@/data/available-jobs';
import { FilterOption } from '@/components/table-controls';
import { DateRange } from 'react-day-picker';

const mapUiStatusToDbStatus = (uiStatus?: string): 'Bid' | 'No Bid' | 'Unset' | undefined => {
  if (uiStatus === 'bid') return 'Bid';
  if (uiStatus === 'no-bid') return 'No Bid';
  if (uiStatus === 'unset') return 'Unset';
  return undefined;
};

export const useAvailableJobs = () => {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [availableJobsPageIndex, setAvailableJobsPageIndex] = useState(0);
  const [availableJobsPageSize, setAvailableJobsPageSize] = useState(25);
  const [availableJobsPageCount, setAvailableJobsPageCount] = useState(0);
  const [availableJobsTotalCount, setAvailableJobsTotalCount] = useState(0);
  const [selectedAvailableJobs, setSelectedAvailableJobs] = useState<AvailableJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeSegment, setActiveSegment] = useState('all');
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({
    all: 0,
    unset: 0,
    'no-bid': 0,
    bid: 0,
    archived: 0,
  });
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
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

  const loadAvailableJobs = useCallback(async () => {
    try {
      console.log('Loading available jobs with activeSegment:', activeSegment);
      startLoading();

      const options: any = {
        limit: availableJobsPageSize,
        page: availableJobsPageIndex + 1,
      };

      if (sortBy) {
        options.sortBy = sortBy;
        options.sortOrder = sortOrder;
      }

      if (Object.keys(activeFilters).length > 0) {
        options.filters = JSON.stringify(activeFilters);
      }

      if (activeSegment === 'archived') {
        options.archived = true;
      } else if (activeSegment !== 'all') {
        const dbStatus = mapUiStatusToDbStatus(activeSegment);
        options.status = dbStatus;
      }

      const response = await fetch(`/api/bids?${new URLSearchParams(options).toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available jobs');
      }
      const result = await response.json();
      const { data, pagination } = result;

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
          '30': 'West',
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

        const services: Record<string, boolean> = {
          'MPT': job.mpt || false,
          'Flagging': job.flagging || false,
          'Equipment Rental': job.equipment_rental || false,
          'Perm Signs': job.perm_signs || false,
          'Other': job.other || false,
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
          countyValue,
          branch: branchValue,
          dbe: dbeValue,
          createdAt: job.created_at ? job.created_at : '-',
          location: locationValue,
          platform: platformValue,
          noBidReason,
          stateRoute,
          services,
          archived: job.archived === true,
        };
      });

      setAvailableJobs(uiJobs);
      setAvailableJobsPageCount(pagination.pageCount);
      setAvailableJobsTotalCount(pagination.totalCount);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
    } finally {
      stopLoading();
    }
  }, [activeSegment, availableJobsPageIndex, availableJobsPageSize, startLoading, stopLoading, sortBy, sortOrder, activeFilters]);

  const fetchAvailableJobCounts = useCallback(async (startDate?: string, endDate?: string) => {
    startLoading();
    try {
      const options: any = { limit: 1000, includeStats: true };

      if (startDate && endDate) {
        options.startDate = startDate;
        options.endDate = endDate;
      }

      const fetchedBidsData = await fetchBids(options);
      setJobCounts({
        all: fetchedBidsData.counts.all,
        unset: fetchedBidsData.counts.unset,
        'no-bid': fetchedBidsData.counts['no-bid'],
        bid: fetchedBidsData.counts.bid,
        archived: fetchedBidsData.counts.archived,
      });

      return fetchedBidsData.stats;
    } catch (error) {
      console.error('Error fetching job counts:', error);
      toast.error('Failed to fetch job counts');
      return [];
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [countiesRes, ownersRes, branchesRes, estimatorsRes, contractorsRes] = await Promise.all([
        fetch('/api/reference-data?type=counties'),
        fetch('/api/reference-data?type=owners'),
        fetch('/api/reference-data?type=branches'),
        fetch('/api/reference-data?type=estimators'),
        fetch('/api/reference-data?type=contractors'),
      ]);

      const [countiesData, ownersData, branchesData, estimatorsData, contractorsData] = await Promise.all([
        countiesRes.json(),
        ownersRes.json(),
        branchesRes.json(),
        estimatorsRes.json(),
        contractorsRes.json(),
      ]);

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
  }, []);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    if (referenceData.counties.length > 0 || referenceData.owners.length > 0 || referenceData.branches.length > 0) {
      const options: FilterOption[] = [
        {
          label: 'County',
          field: 'county',
          options: referenceData.counties.map((county) => ({
            label: county.name,
            value: county.name,
          })),
        },
        {
          label: 'Owner',
          field: 'owner',
          options: referenceData.owners.map((owner) => ({
            label: owner.name,
            value: owner.name,
          })),
        },
        {
          label: 'Requestor',
          field: 'requestor',
          options: referenceData.estimators.map((estimator) => ({
            label: estimator.name,
            value: estimator.name,
          })),
        },
        {
          label: 'Branch',
          field: 'branch',
          options: referenceData.branches.map((branch) => ({
            label: branch.name,
            value: branch.name,
          })),
        },
        {
          label: 'Status',
          field: 'status',
          options: [
            { label: 'Bid', value: 'Bid' },
            { label: 'No Bid', value: 'No Bid' },
            { label: 'Unset', value: 'Unset' },
          ],
        },
      ];
      setFilterOptions(options);
    }
  }, [referenceData]);

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
      startDate = dateRange.from.toISOString().split('T')[0];
      endDate = dateRange.to.toISOString().split('T')[0];
      fetchAvailableJobCounts(startDate, endDate);
    } else {
      fetchAvailableJobCounts();
    }
  }, [dateRange?.from, dateRange?.to, fetchAvailableJobCounts]);

  const handleSegmentChange = (value: string) => {
    setActiveSegment(value);
    setAvailableJobsPageIndex(0);
  };

  const handleMarkAsBidJob = useCallback(
    (job: AvailableJob) => {
      const queryParams = new URLSearchParams({
        jobId: job.id.toString(),
        source: 'available-jobs',
      }).toString();

      router.push(`/active-bid/new?${queryParams}`);
    },
    [router]
  );

  const handleUpdateStatus = useCallback(
    async (job: AvailableJob, status: 'Bid' | 'No Bid' | 'Unset') => {
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
    },
    [loadAvailableJobs, fetchAvailableJobCounts, startLoading, stopLoading]
  );

  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(direction);
    setAvailableJobsPageIndex(0);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    const formattedFilters: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'none' && value !== '') {
        formattedFilters[key] = Array.isArray(value) ? value : [value];
      }
    });
    setActiveFilters(formattedFilters);
    setAvailableJobsPageIndex(0);
  };

  const handleResetControls = () => {
    setActiveFilters({});
    setSortBy(undefined);
    setSortOrder('asc');
    setAvailableJobsPageIndex(0);
  };

  const handleExportAvailableJobs = async (allAvailableJobRowsSelected: boolean) => {
    try {
      startLoading();

      if (allAvailableJobRowsSelected) {
        const options: any = {
          limit: availableJobsTotalCount || 10000,
          page: 1,
        };

        if (Object.keys(activeFilters).length > 0) {
          options.filters = JSON.stringify(activeFilters);
        }

        if (activeSegment === 'archived') {
          options.status = 'archived';
        } else if (activeSegment !== 'all') {
          const dbStatus = mapUiStatusToDbStatus(activeSegment);
          options.status = dbStatus;
        }

        if (sortBy) {
          options.sortBy = sortBy;
          options.sortOrder = sortOrder;
        }

        const response = await fetch(`/api/bids?${new URLSearchParams(options).toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch all jobs for export');
        }

        const result = await response.json();
        const allJobs = result.data.map((job: any) => {
          // Same transformation as in loadAvailableJobs
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
            '30': 'West',
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
              secondary: branchValue,
            },
            countyValue,
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
              'Other': job.other || false,
            },
          };
        });

        exportAvailableJobsToExcel(allJobs);
        toast.success(`Exported all ${allJobs.length} jobs to Excel`);
      } else {
        if (selectedAvailableJobs.length === 0) {
          toast.error('Please select jobs in the table before exporting');
          return;
        }

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

  const fetchAllFilteredJobs = useCallback(async () => {
    const options: any = {
      limit: availableJobsTotalCount || 10000,
      page: 1,
    };

    if (Object.keys(activeFilters).length > 0) {
      options.filters = JSON.stringify(activeFilters);
    }

    if (activeSegment === 'archived') {
      options.status = 'archived';
    } else if (activeSegment !== 'all') {
      const dbStatus = mapUiStatusToDbStatus(activeSegment);
      options.status = dbStatus;
    }

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
        '30': 'West',
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

      const services: Record<string, boolean> = {
        'MPT': job.mpt || false,
        'Flagging': job.flagging || false,
        'Equipment Rental': job.equipment_rental || false,
        'Perm Signs': job.perm_signs || false,
        'Other': job.other || false,
      };

      return {
        id: job.id,
        contractNumber: contractNumberValue,
        status: job.status || 'Unset',
        requestor: requestorValue,
        owner: ownerValue,
        lettingDate: job.letting_date ? formatDate(job.letting_date) : '',
        dueDate: job.due_date ? formatDate(job.due_date) : '',
        county: { main: countyValue, secondary: branchValue },
        countyValue,
        branch: branchValue,
        dbe: dbeValue,
        createdAt: job.created_at || '',
        location: locationValue,
        platform: platformValue,
        noBidReason,
        stateRoute,
        services,
        archived: job.archived === true,
      };
    });
  }, [activeFilters, activeSegment, availableJobsTotalCount, sortBy, sortOrder]);

  const handleArchiveAvailableJobs = useCallback(
    async (allAvailableJobRowsSelected: boolean, selectedAvailableJobs: AvailableJob[]) => {
      try {
        startLoading();

        let jobsToArchive: AvailableJob[] = [];

        if (allAvailableJobRowsSelected) {
          jobsToArchive = await fetchAllFilteredJobs();
          jobsToArchive = jobsToArchive.filter((job) => !job.status?.toLowerCase().includes('archived'));
        } else {
          jobsToArchive = selectedAvailableJobs.filter((job) => !job.status?.toLowerCase().includes('archived'));
        }

        if (jobsToArchive.length === 0) {
          toast.error('No jobs to archive. All selected jobs are already archived.');
          return false;
        }

        const ids = jobsToArchive.map((job) => job.id);
        await archiveJobs(ids);

        toast.success(`Successfully archived ${jobsToArchive.length} job(s)`, {
          duration: 5000,
          position: 'top-center',
        });

        await loadAvailableJobs();
        await fetchAvailableJobCounts();

        return true;
      } catch (error) {
        console.error('Error archiving jobs:', error);
        toast.error('Failed to archive jobs. Please try again.', {
          duration: 5000,
          position: 'top-center',
        });
        return false;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading, loadAvailableJobs, fetchAvailableJobCounts, fetchAllFilteredJobs]
  );

  const handleDeleteArchivedJobs = useCallback(
    async (allAvailableJobRowsSelected: boolean, selectedAvailableJobs: AvailableJob[]) => {
      try {
        startLoading();

        let jobsToDelete: AvailableJob[] = [];

        if (allAvailableJobRowsSelected) {
          const allJobs = await fetchAllFilteredJobs();
          jobsToDelete = allJobs.filter((job) => activeSegment === 'archived' || job.status?.toLowerCase().includes('archived'));
        } else {
          if (activeSegment === 'archived') {
            jobsToDelete = selectedAvailableJobs;
          } else {
            jobsToDelete = selectedAvailableJobs.filter((job) => job.status?.toLowerCase().includes('archived'));
          }
        }

        if (jobsToDelete.length === 0) {
          toast.error('No archived jobs found to delete.');
          return false;
        }

        const ids = jobsToDelete.map((job) => job.id);
        const result = await deleteArchivedJobs(ids);

        toast.success(`Successfully deleted ${result.count} archived job(s)`, {
          duration: 5000,
          position: 'top-center',
        });

        await loadAvailableJobs();
        await fetchAvailableJobCounts();

        return true;
      } catch (error) {
        console.error('Error deleting archived jobs:', error);
        toast.error('Failed to delete archived jobs. Please try again.', {
          duration: 5000,
          position: 'top-center',
        });
        return false;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading, loadAvailableJobs, fetchAvailableJobCounts, fetchAllFilteredJobs, activeSegment]
  );

  const handleUnarchiveAvailableJob = useCallback(
    async (item: AvailableJob) => {
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
    },
    [startLoading, stopLoading, loadAvailableJobs, fetchAvailableJobCounts]
  );

  return {
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
    fetchAllFilteredJobs,
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
  };
};
