import { useState, useEffect, useCallback } from 'react';
import { FilterOption } from '../components/table-controls';

interface ReferenceData {
    counties: { id: number; name: string }[];
    owners: { id: number; name: string }[];
    branches: { id: number; name: string; code: string }[];
    estimators: { id: number; name: string }[];
    contractors: { id: number; name: string }[];
}

interface UseJobsSharedProps {
    view: 'available' | 'bids' | 'jobs';
}

export const useJobsShared = ({ view }: UseJobsSharedProps) => {
    const [referenceData, setReferenceData] = useState<ReferenceData>({
        counties: [],
        owners: [],
        branches: [],
        estimators: [],
        contractors: [],
    });

    const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

    const fetchReferenceData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        if (referenceData.counties.length > 0 || referenceData.owners.length > 0 || referenceData.branches.length > 0) {
            let options: FilterOption[] = [];

            if (view === 'available') {
                options = [
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
            } else if (view === 'bids') {
                options = [
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
            } else if (view === 'jobs') {
                options = [
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
            }

            setFilterOptions(options);
        }
    }, [referenceData, view]);

    const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc', setPageIndex: (index: number) => void) => {
        console.log(`Sorting by ${column} ${direction}`);
        // setSortBy and setSortOrder would be passed or managed externally
        // For now, return the function
        return (setSortBy: (col: string | undefined) => void, setSortOrder: (order: 'asc' | 'desc') => void) => {
            setSortBy(column);
            setSortOrder(direction);
            setPageIndex(0);
        };
    }, []);

    const handleFilterChange = useCallback((filters: Record<string, any>, setActiveFilters: (filters: Record<string, string[]>) => void, setPageIndex: (index: number) => void) => {
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
        setPageIndex(0);
    }, []);

    const handleResetControls = useCallback((setActiveFilters: (filters: Record<string, string[]>) => void, setSortBy: (col: string | undefined) => void, setSortOrder: (order: 'asc' | 'desc') => void, setPageIndex: (index: number) => void) => {
        console.log('Resetting all filters and sorts');
        // Clear filters
        setActiveFilters({});
        // Clear sorting
        setSortBy(undefined);
        setSortOrder('asc');
        // Reset to first page
        setPageIndex(0);
    }, []);

    return {
        referenceData,
        filterOptions,
        fetchReferenceData,
        handleSortChange,
        handleFilterChange,
        handleResetControls,
    };
};
