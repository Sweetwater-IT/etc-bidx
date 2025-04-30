import { Database } from '@/types/database.types';
import { County } from '@/types/TCounty';

type AvailableJob = Database['public']['Tables']['available_jobs']['Row'];
type AvailableJobInsert = Database['public']['Tables']['available_jobs']['Insert'];
type AvailableJobUpdate = Database['public']['Tables']['available_jobs']['Update'];

type BidEstimate = Database['public']['Tables']['bid_estimates']['Row'];
type BidEstimateInsert = Database['public']['Tables']['bid_estimates']['Insert'];

/**
 * Fetch all available jobs with optional filtering
 */
export async function fetchBids(options?: {
  status?: 'Bid' | 'No Bid' | 'Unset' | 'archived' | string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}): Promise<AvailableJob[]> {
  const params = new URLSearchParams();

  if (options?.status) {
    params.append('status', options.status);
  }

  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }

  if (options?.orderBy) {
    params.append('orderBy', options.orderBy);
  }

  if (options?.ascending !== undefined) {
    params.append('ascending', options.ascending.toString());
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/bids${queryString}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch bids');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch a specific bid by ID
 */
export async function fetchBidById(id: number): Promise<AvailableJob> {
  const response = await fetch(`/api/bids/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch bid with ID ${id}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new bid
 */
export async function createBid(bid: AvailableJobInsert): Promise<AvailableJob> {
  const response = await fetch('/api/bids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bid),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create bid');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update an existing bid
 */
export async function updateBid(id: number, data: AvailableJobUpdate): Promise<AvailableJob> {
  try {
    const response = await fetch(`/api/bids/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update bid')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating bid:', error)
    throw error
  }
}

/**
 * Delete a bid
 */
export async function deleteBid(id: number): Promise<void> {
  const response = await fetch(`/api/bids/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete bid with ID ${id}`);
  }
}

/**
 * Change a bid's status
 */
export async function changeBidStatus(
  id: number,
  status: 'Bid' | 'No Bid' | 'Unset',
  noBidReason?: string
): Promise<AvailableJob> {
  const updates: AvailableJobUpdate = { status };

  if (status === 'No Bid' && noBidReason) {
    updates.no_bid_reason = noBidReason;
  }

  return updateBid(id, updates);
}

/**
 * Fetch all active bids from the bid_estimates table with optional filtering
 */
export async function fetchActiveBids(options?: {
  status?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}): Promise<BidEstimate[]> {
  const params = new URLSearchParams();

  if (options?.status) {
    params.append('status', options.status);
  }

  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }

  if (options?.orderBy) {
    params.append('orderBy', options.orderBy);
  }

  if (options?.ascending !== undefined) {
    params.append('ascending', options.ascending.toString());
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/active-bids${queryString}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch active bids');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch a specific active bid by ID
 */
export async function fetchActiveBidById(id: number): Promise<BidEstimate> {
  const response = await fetch(`/api/active-bids/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch active bid with ID ${id}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new active bid
 */
export async function createActiveBid(bid: BidEstimateInsert): Promise<BidEstimate> {
  const response = await fetch('/api/active-bids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bid),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create active bid');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update an existing active bid
 */
export async function updateActiveBid(id: number, data: Partial<BidEstimateInsert>): Promise<BidEstimate> {
  try {
    const response = await fetch(`/api/active-bids/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update active bid');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating active bid:', error);
    throw error;
  }
}

/**
 * Create a new MPT rental record for a bid estimate
 */
export async function createMptRental(data: {
  estimate_id: number;
  target_moic?: number;
  payback_period?: number;
  annual_utilization?: number;
  dispatch_fee?: number;
  mpg_per_truck?: number;
  revenue?: number;
  cost?: number;
  gross_profit?: number;
  hours?: number;
  static_equipment_info?: any;
}) {
  try {
    const response = await fetch('/api/estimate-mpt-rental', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create MPT rental record');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating MPT rental record:', error);
    throw error;
  }
}

/**
 * Fetch MPT rental data for a bid estimate
 */
export async function fetchMptRental(estimateId: number) {
  try {
    const response = await fetch(`/api/estimate-mpt-rental?estimate_id=${estimateId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No MPT rental record found
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch MPT rental record');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching MPT rental record:', error);
    throw error;
  }
}

/**
 * Fetch reference data for dropdowns
 */
export async function fetchReferenceData(type: 'counties' | 'users' | 'owners' | 'mpt equipment') {
  try {
    const response = await fetch(`/api/reference-data?type=${type}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch ${type}`);
    }

    const result = await response.json();

    let formattedData = result.data;
    if (type === 'counties') {
      // format database rows into County objects
      formattedData = result.data.map(countyRow => ({
        id: countyRow.id,
        name: countyRow.name,
        district: countyRow.district,
        branch: countyRow.branches.name,
        laborRate: countyRow.labor_rate,
        fringeRate: countyRow.fringe_rate,
        shopRate: countyRow.branches?.shop_rate,
        flaggingRate: countyRow.flagging_rate,
        flaggingBaseRate: countyRow.flagging_base_rate,
        flaggingFringeRate: countyRow.flagging_fringe_rate,
        ratedTargetGM: countyRow.flagging_rated_target_gm,
        nonRatedTargetGM: countyRow.flagging_non_rated_target_gm,
        insurance: countyRow.insurance,
        fuel: countyRow.fuel,
        market: (countyRow.market as 'MOBILIZATION' | 'CORE' | 'LOCAL')
      })) as County[];
    }
    
    return formattedData;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    throw error;
  }
}

/**
 * Fetch sign designations with their corresponding dimension options
 * @param search Optional search term to filter designations
 */
export async function fetchSignDesignations(search?: string) {
  try {
    const url = '/api/signs';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch sign designations: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching sign designations:', error);
    return [];
  }
}

/**
 * Import jobs from Excel data
 * @param data The Excel data to import
 * @param type The type of import (available-jobs or active-bids)
 */
/**
 * Archive multiple available jobs
 */
export async function archiveJobs(ids: number[]): Promise<{ count: number }> {
  const response = await fetch('/api/jobs/archive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to archive jobs');
  }

  const result = await response.json();
  return { count: result.count };
}

/**
 * Archive multiple active bids
 */
export async function archiveActiveBids(ids: number[]): Promise<{ count: number }> {
  const response = await fetch('/api/active-bids/archive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to archive active bids');
  }

  const result = await response.json();
  return { count: result.count };
}

/**
 * Delete multiple archived available jobs (soft delete)
 */
export async function deleteArchivedJobs(ids: number[]): Promise<{ count: number }> {
  const response = await fetch('/api/bids/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete archived jobs');
  }

  const result = await response.json();
  return { count: result.count };
}

/**
 * Delete multiple archived active bids (soft delete)
 */
export async function deleteArchivedActiveBids(ids: number[]): Promise<{ count: number }> {
  const response = await fetch('/api/active-bids/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete archived active bids');
  }

  const result = await response.json();
  return { count: result.count };
}

/**
 * Import jobs or bids from data
 */
export async function importJobs(
  data: any[],
  type: 'available-jobs' | 'active-bids' = 'available-jobs'
): Promise<{ count: number; errors?: string[] }> {
  // Use different endpoints based on import type
  const endpoint = type === 'available-jobs' ? '/api/jobs/import' : '/api/bids/import';

  console.log(`Importing ${type} data to ${endpoint}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobs: data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to import jobs');
  }

  return response.json();
}
