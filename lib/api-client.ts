import { Database } from '@/types/database.types';

type AvailableJob = Database['public']['Tables']['available_jobs']['Row'];
type AvailableJobInsert = Database['public']['Tables']['available_jobs']['Insert'];
type AvailableJobUpdate = Database['public']['Tables']['available_jobs']['Update'];

/**
 * Fetch all bids with optional filtering
 */
export async function fetchBids(options?: {
  status?: 'Bid' | 'No Bid' | 'Unset';
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
export async function updateBid(id: number, updates: AvailableJobUpdate): Promise<AvailableJob> {
  const response = await fetch(`/api/bids/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update bid with ID ${id}`);
  }
  
  const result = await response.json();
  return result.data;
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
 * Import jobs from Excel data
 */
export async function importJobs(data: any[]): Promise<{ count: number; errors?: string[] }> {
  const response = await fetch('/api/jobs/import', {
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
