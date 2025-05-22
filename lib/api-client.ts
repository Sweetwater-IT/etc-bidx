import { createQuoteEmailHtml } from '@/app/quotes/create/ProposalHTML';
import { AttachmentNames, QuoteStatus, TermsNames } from '@/app/quotes/create/QuoteFormProvider';
import { PaymentTerms } from '@/components/pages/quote-form/QuoteAdminInformation';
import { Customer } from '@/types/Customer';
import { Database } from '@/types/database.types';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';
import { EstimateCompleteView } from '@/types/estimate-view';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import { QuoteItem } from '@/types/IQuoteItem';
import { MPTRentalEstimating } from '@/types/MPTEquipment';
import { AdminData } from '@/types/TAdminData';
import { County } from '@/types/TCounty';
import { Flagging } from '@/types/TFlagging';
import { SaleItem } from '@/types/TSaleItem';

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
export async function fetchBidById(id: number): Promise<any> {
  const response = await fetch(`/api/active-bids/${id}`);

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
export async function fetchActiveBidByContractNumber(contractNumber: string): Promise<EstimateCompleteView> {
  const response = await fetch(`/api/active-bids/${contractNumber}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch active bid with ID ${contractNumber}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new estimate
 */
export async function createActiveBid(
  adminData: AdminData,
  mptRental: MPTRentalEstimating,
  equipmentRental: EquipmentRentalItem[],
  flagging: Flagging | null,
  serviceWork: Flagging | null,
  saleItems: SaleItem[]
): Promise<{ id: number }> {
  // Ensure division and owner fields have valid values
  const processedAdminData = {
    ...adminData,
    division: adminData.division || 'PUBLIC', // Set default value if empty
    owner: adminData.owner || 'PENNDOT' // Set default value if empty
  };
  
  const response = await fetch('/api/active-bids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        adminData: processedAdminData,
        mptRental,
        equipmentRental,
        flagging,
        serviceWork,
        saleItems
      }
    }),
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
export async function updateActiveBid(id: number, data: any): Promise<BidEstimate> {
  try {
    // If the data contains adminData, ensure division and owner fields have valid values
    if (data.adminData && typeof data.adminData === 'object') {
      if (data.adminData.division === '') {
        data.adminData.division = 'PUBLIC'; // Set default value if empty
      }
      if (data.adminData.owner === '') {
        data.adminData.owner = 'PENNDOT'; // Set default value if empty
      }
    }
    
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
 * Change an active bid's status
 */
export async function changeActiveBidStatus(
  id: number,
  status: 'WON' | 'PENDING' | 'LOST' | 'DRAFT'
): Promise<BidEstimate> {
  return updateActiveBid(id, { status });
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
export async function fetchReferenceData(type: 'counties' | 'users' | 'owners' | 'contractors' | 'mpt equipment') {
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
 * Archive multiple active jobs
 */
export async function archiveActiveJobs(ids: string[]): Promise<{ count: number }> {
  //putting this in active-jobs folder for now, in the future we need to move this to open bids
  const response = await fetch('/api/jobs/active-jobs/archive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to archive active jobs');
  }

  const result = await response.json();
  return { count: result.count };
}

/**
 * 
 * @param ids job numbers
 * @returns count of how many active jobs were deleted
 */
export async function deleteArchivedActiveJobs(ids: string[]): Promise<{ count: number }> {
  //putting this in active-jobs folder for now, in the future we need to move this to open bids
  const response = await fetch('/api/jobs/active-jobs/archive', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to archive active jobs');
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
try {
  const response = await fetch('/api/archived-active-bids/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete archived active bids');
  }

  return await response.json();
} catch (error) {
  console.error('Error deleting archived active bids:', error);
  throw error;
}
}

/**
 * Soft delete a customer contact by setting is_deleted flag to true
 * @param contactId ID of the contact to delete
 * @returns Promise resolving to the deleted contact data
 */
export async function deleteCustomerContact(contactId: number): Promise<any> {
try {
  const response = await fetch(`/api/customer-contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to delete customer contact (${response.status})`);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('Error deleting customer contact:', error);
  throw error;
}
}

/**
 * Create a new customer contact
 * @param data Contact data including contractor_id (customer ID), name, role, email, phone
 * @returns Promise resolving to the created contact data
 */
export async function createCustomerContact(data: {
  contractor_id: number;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
try {
  const response = await fetch('/api/customer-contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to create customer contact (${response.status})`);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('Error creating customer contact:', error);
  throw error;
}
}

/**
 * Update an existing customer contact
 * @param contactId ID of the contact to update
 * @param data Contact data to update including name, role, email, phone
 * @returns Promise resolving to the updated contact data
 */
export async function updateCustomerContact(contactId: number, data: {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
try {
  const response = await fetch(`/api/customer-contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`API error (${response.status}):`, errorData);
    throw new Error(errorData.error || `Failed to update customer contact (${response.status})`);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('Error updating customer contact:', error);
  throw error;
}
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

/**
 * Sends a quote email with optional attachments.
 * @param recipientEmail Primary recipient email address
 * @param quoteData Quote information
 * @param options Additional email options like CC, BCC, attachments
 * @returns Promise resolving to boolean indicating success
 */
export async function sendQuoteEmail(
  quoteData: {
    adminData?: AdminData;
    date: Date;
    quoteNumber: string;
    customerName: string;
    customers: Customer[];
    totalAmount: number;
    createdBy: string;
    createdAt: string;
    customTerms?: string;
    items: QuoteItem[];
    paymentTerms: PaymentTerms;
    includedTerms: Record<TermsNames, boolean>;
    ecmsPoNumber?: string;
    stateRoute?: string;
    county?: string;
    notes?: string;
    status: QuoteStatus;
    estimate_id?: number;
    job_id?: number;
    attachmentFlags: Record<AttachmentNames, boolean>;
    uniqueToken: string;
    quoteType: 'estimate' | 'job' | 'new'
    associatedContract: string;
  },
  options: {
    pointOfContact: { name: string; email: string };
    fromEmail: string;
    recipients: Array<{
      email: string;
      contactId: number | undefined;
      cc?: boolean;
      bcc?: boolean;
      point_of_contact?: boolean;
    }>;
    subject: string;
    body: string;
    cc: string[];
    bcc: string[];
    files?: File[];
    standardDocs?: string[];
  }
): Promise<boolean> {
  try {
    // Create FormData to handle files and other data
    const formData = new FormData();

    // Add quote information
    formData.append('to', options.pointOfContact.email);
    formData.append('pocName', options.pointOfContact.name);

    // Point of contact contactId might be undefined for manually entered emails
    const pocContactId = options.recipients.find(r => r.point_of_contact)?.contactId;
    if (pocContactId !== undefined) {
      formData.append('pocContactId', pocContactId.toString());
    }

    formData.append('quoteNumber', quoteData.quoteNumber);
    formData.append('status', quoteData.status);
    formData.append('uniqueToken', quoteData.uniqueToken);

    formData.append('quoteType', quoteData.quoteType);
    formData.append('associatedContract', quoteData.associatedContract || '');

    // Add admin information
    if (quoteData.adminData) {
      formData.append('adminData', JSON.stringify(quoteData.adminData));
    }

    // Add customer information
    formData.append('customers', JSON.stringify(quoteData.customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.emails[0] || '',
      contactIds: c.contactIds || []
    }))));

    formData.append('fromEmail', options.fromEmail);

    // Add subject line and email body
    formData.append('subject', options.subject);
    formData.append('emailBody', options.body);

    // Add all recipients data for database storage, including those with undefined contactId
    formData.append('recipients', JSON.stringify(options.recipients));

    // Add terms and conditions flags
    formData.append('includedTerms', JSON.stringify(quoteData.includedTerms));

    // Add attachment flags
    formData.append('attachmentFlags', JSON.stringify(quoteData.attachmentFlags));

    // Add custom terms if present
    if (quoteData.customTerms) {
      formData.append('customTerms', quoteData.customTerms);
    }

    // Add notes if present
    if (quoteData.notes) {
      formData.append('notes', quoteData.notes);
    }

    // Add payment terms
    formData.append('paymentTerms', quoteData.paymentTerms);

    // Add ECMS PO number, state route, and county if present
    if (quoteData.ecmsPoNumber) {
      formData.append('ecmsPoNumber', quoteData.ecmsPoNumber);
    }
    if (quoteData.stateRoute) {
      formData.append('stateRoute', quoteData.stateRoute);
    }
    if (quoteData.county) {
      formData.append('county', quoteData.county);
    }

    // Add quote items
    formData.append('quoteItems', JSON.stringify(quoteData.items));

    // Generate HTML content for the email
    const htmlContent = createQuoteEmailHtml(
      quoteData.adminData ?? defaultAdminObject,
      quoteData.items,
      quoteData.customers.map(c => c.name),
      quoteData.quoteNumber,
      quoteData.date,
      quoteData.paymentTerms,
      quoteData.county || "",
      quoteData.stateRoute || "",
      quoteData.ecmsPoNumber || "",
      quoteData.includedTerms,
      quoteData.customTerms || "",
      options.body,
      quoteData.uniqueToken
    );
    formData.append('htmlContent', htmlContent);

    // Add CC and BCC recipients
    if (options.cc && options.cc.length > 0) {
      options.cc.forEach(email => formData.append('cc', email));
    }

    if (options.bcc && options.bcc.length > 0) {
      options.bcc.forEach(email => formData.append('bcc', email));
    }

    // Add standard documents
    if (options.standardDocs && options.standardDocs.length > 0) {
      formData.append('standardDocs', options.standardDocs.join(','));
    }

    // Add additional files
    if (options.files && options.files.length > 0) {
      options.files.forEach(file => formData.append('files', file));
    }

    // Send the request
    const response = await fetch('/api/quotes/send-email', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending quote email:', errorData);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending quote email:', error);
    return false;
  }
}