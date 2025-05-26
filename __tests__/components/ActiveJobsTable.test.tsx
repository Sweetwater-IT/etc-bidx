import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ACTIVE_JOBS_COLUMNS } from '../../data/active-jobs';
import { DataTable } from '../mocks/components/DataTable';
import {
  mockActiveJobs,
  mockSegments,
  mockSegmentCounts,
  mockPaginationProps
} from '../mocks/data/activeJobsMockData';

global.fetch = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ActiveJobsTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockActiveJobs, pagination: { pageCount: 1, totalCount: 3 } })
    });
  });

  test('renders table with correct columns', () => {
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    ACTIVE_JOBS_COLUMNS.forEach(column => {
      expect(screen.getByText(column.title)).toBeInTheDocument();
    });
    
    expect(screen.getByText('W-PD-2025001')).toBeInTheDocument();
    expect(screen.getByText('W-PD-2025001')).toBeInTheDocument();
    expect(screen.getByText('C123456')).toBeInTheDocument();
    expect(screen.getByText('ABC Construction')).toBeInTheDocument();
  });

  test('handles segment change', async () => {
    const handleSegmentChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={handleSegmentChange}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    const westSegment = screen.getByText('West (1)');
    await user.click(westSegment);
    
    expect(handleSegmentChange).toHaveBeenCalledWith('west');
  });

  test('handles pagination', async () => {
    const handlePageChange = jest.fn();
    const handlePageSizeChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        pageCount={3}
        pageIndex={0}
        pageSize={1}
        totalCount={3}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    );
    
    const nextPageButton = screen.getByTestId('pagination-next');
    await user.click(nextPageButton);
    
    expect(handlePageChange).toHaveBeenCalledWith(1);
    
    const pageSizeSelect = screen.getByTestId('page-size-select');
    await user.click(pageSizeSelect);
    
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    
    expect(handlePageSizeChange).toHaveBeenCalledWith(25);
  });

  test('handles row selection and bulk actions', async () => {
    const handleArchiveSelected = jest.fn();
    const handleDeleteSelected = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={handleArchiveSelected}
        onDeleteSelected={handleDeleteSelected}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    const firstRowCheckbox = screen.getByTestId('row-checkbox-0');
    await user.click(firstRowCheckbox);
    
    expect(handleArchiveSelected).toHaveBeenCalledWith([mockActiveJobs[0]]);
    expect(handleDeleteSelected).toHaveBeenCalledWith([mockActiveJobs[0]]);
  });

  test('handles row actions (view, edit, archive)', async () => {
    const handleViewDetails = jest.fn();
    const handleEdit = jest.fn();
    const handleArchive = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onArchive={handleArchive}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    const viewDetailsButton = screen.getByTestId('view-details-0');
    await user.click(viewDetailsButton);
    
    expect(handleViewDetails).toHaveBeenCalledWith(mockActiveJobs[0]);
    
    const editButton = screen.getByTestId('edit-0');
    await user.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledWith(mockActiveJobs[0]);
    
    const archiveButton = screen.getByTestId('archive-0');
    await user.click(archiveButton);
    
    expect(handleArchive).toHaveBeenCalledWith(mockActiveJobs[0]);
  });

  test('handles filtering by branch', async () => {
    const handleFilterChange = jest.fn();
    const user = userEvent.setup();
    
    const filteredData = mockActiveJobs.filter(job => job.branch === 'West');
    
    const { rerender } = render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
        filterOptions={[
          {
            label: 'Branch',
            field: 'branch',
            options: [
              { label: 'West', value: 'West' },
              { label: 'Turbotville', value: 'Turbotville' },
              { label: 'Hatfield', value: 'Hatfield' }
            ]
          },
          {
            label: 'Contractor',
            field: 'contractor',
            options: [
              { label: 'ABC Construction', value: 'ABC Construction' },
              { label: 'XYZ Builders', value: 'XYZ Builders' },
              { label: 'DEF Contractors', value: 'DEF Contractors' }
            ]
          },
          {
            label: 'County',
            field: 'county',
            options: [
              { label: 'Philadelphia', value: 'Philadelphia' },
              { label: 'Dauphin', value: 'Dauphin' },
              { label: 'Lehigh', value: 'Lehigh' }
            ]
          }
        ]}
        onFilterChange={handleFilterChange}
      />
    );
    
    const filterButton = screen.getByTestId('filter-button');
    await user.click(filterButton);
    
    const applyButton = screen.getByTestId('apply-filters');
    await user.click(applyButton);
    
    expect(handleFilterChange).toHaveBeenCalledWith({ branch: ['West'] });
    
    rerender(
      <DataTable
        data={filteredData}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
        filterOptions={[
          {
            label: 'Branch',
            field: 'branch',
            options: [
              { label: 'West', value: 'West' },
              { label: 'Turbotville', value: 'Turbotville' },
              { label: 'Hatfield', value: 'Hatfield' }
            ]
          },
          {
            label: 'Contractor',
            field: 'contractor',
            options: [
              { label: 'ABC Construction', value: 'ABC Construction' },
              { label: 'XYZ Builders', value: 'XYZ Builders' },
              { label: 'DEF Contractors', value: 'DEF Contractors' }
            ]
          },
          {
            label: 'County',
            field: 'county',
            options: [
              { label: 'Philadelphia', value: 'Philadelphia' },
              { label: 'Dauphin', value: 'Dauphin' },
              { label: 'Lehigh', value: 'Lehigh' }
            ]
          }
        ]}
        onFilterChange={handleFilterChange}
      />
    );
    
    expect(filteredData.length).toBe(1);
    expect(filteredData[0].branch).toBe('West');
    
    expect(screen.getByTestId('cell-0-jobNumber').textContent).toBe('W-PD-2025001');
    
    expect(screen.queryByTestId('cell-1-jobNumber')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cell-2-jobNumber')).not.toBeInTheDocument();
  });

  test('handles sorting by column', async () => {
    const handleSortChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockActiveJobs}
        columns={ACTIVE_JOBS_COLUMNS}
        segments={mockSegments}
        segmentValue="all"
        segmentCounts={mockSegmentCounts}
        onSegmentChange={jest.fn()}
        stickyLastColumn={true}
        onArchiveSelected={jest.fn()}
        onDeleteSelected={jest.fn()}
        tableRef={{ current: null }}
        onViewDetails={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
        {...mockPaginationProps}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
        onSortChange={handleSortChange}
      />
    );
    
    const jobNumberHeader = screen.getByTestId('column-header-jobNumber');
    await user.click(jobNumberHeader);
    
    expect(handleSortChange).toHaveBeenCalledWith('jobNumber', 'asc');
  });
});
