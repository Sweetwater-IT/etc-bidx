// types/TBidDetails.ts

export type EstimateBidDetails = {
  id: number;
  contract_number: string;
  notes: string | null;
  status: string;
  total_revenue: number | null;
  total_cost: number | null;
  total_gross_profit: number | null;
  admin_data_entries: {
    county: any;
    sr_route: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
  }[];
  equipment_rental_entries: any[];
  sale_items: any[];
  flagging_entries: any[];
  service_work_entries: any[];
  permanent_signs_entries: any[];
};

export type JobBidDetails = {
  id: number;
  job_number: string;
  created_at: string;
  billing_status: string;
  project_status: string;
  bid_estimates: {
    contract_number: string;
    status: string;
    total_revenue: number | null;
    total_cost: number | null;
    total_gross_profit: number | null;
  }[];
  admin_data_entries: {
    county: any;
    sr_route: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
  }[];
};

export type BidDetailsResponse = {
  data: EstimateBidDetails | JobBidDetails | null;
  error?: string;
};
