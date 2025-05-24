import { ActiveJob } from '@/data/active-jobs';

/**
 * Mock active jobs data for testing
 */
export const mockActiveJobs: ActiveJob[] = [
  {
    jobNumber: 'W-PD-2025001',
    bidNumber: 'BID-001',
    projectStatus: 'Active',
    billingStatus: 'Unbilled',
    contractNumber: 'C123456',
    location: 'Philadelphia',
    county: 'Philadelphia',
    branch: 'West',
    contractor: 'ABC Construction',
    startDate: '2025-01-15',
    endDate: '2025-06-30',
    laborRate: 75.5,
    fringeRate: 25.3,
    mpt: true,
    rental: false,
    permSigns: true,
    flagging: true,
    saleItems: false,
    overdays: 0,
    createdAt: '2025-01-01T12:00:00Z',
    status: 'Active'
  },
  {
    jobNumber: 'T-PD-2025002',
    bidNumber: 'BID-002',
    projectStatus: 'Active',
    billingStatus: 'Billed',
    contractNumber: 'C789012',
    location: 'Harrisburg',
    county: 'Dauphin',
    branch: 'Turbotville',
    contractor: 'XYZ Builders',
    startDate: '2025-02-01',
    endDate: '2025-07-15',
    laborRate: 85.0,
    fringeRate: 28.5,
    mpt: false,
    rental: true,
    permSigns: false,
    flagging: true,
    saleItems: true,
    overdays: 2,
    createdAt: '2025-01-15T09:30:00Z',
    status: 'Active'
  },
  {
    jobNumber: 'H-PD-2025003',
    bidNumber: 'BID-003',
    projectStatus: 'Active',
    billingStatus: 'Partially Billed',
    contractNumber: 'C345678',
    location: 'Allentown',
    county: 'Lehigh',
    branch: 'Hatfield',
    contractor: 'DEF Contractors',
    startDate: '2025-03-01',
    endDate: '2025-08-31',
    laborRate: 80.0,
    fringeRate: 27.0,
    mpt: true,
    rental: true,
    permSigns: true,
    flagging: false,
    saleItems: true,
    overdays: 0,
    createdAt: '2025-02-01T14:45:00Z',
    status: 'Active'
  }
];

/**
 * Mock segments for testing
 */
export const mockSegments = [
  { value: 'all', label: 'All (3)' },
  { value: 'west', label: 'West (1)' },
  { value: 'turbotville', label: 'Turbotville (1)' },
  { value: 'hatfield', label: 'Hatfield (1)' },
  { value: 'archived', label: 'Archived (0)' }
];

/**
 * Mock segment counts for testing
 */
export const mockSegmentCounts = {
  all: 3,
  west: 1,
  turbotville: 1,
  hatfield: 1,
  archived: 0
};

/**
 * Mock pagination props for testing
 */
export const mockPaginationProps = {
  pageCount: 1,
  pageIndex: 0,
  pageSize: 10,
  totalCount: 3
};
