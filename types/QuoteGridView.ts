export interface QuoteGridView {
  id: number;
  quote_number: string;
  status: 'Not Sent' | 'Sent' | 'Accepted';
  date_sent: string;
  customer_name: string;
  point_of_contact: string;
  point_of_contact_email: string;
  total_items: number;
  county: string;
  created_at: string;
  updated_at: string;
  has_attachments: boolean;
  estimate_contract_number?: string;
  job_number?: string;
  estimate_id?: number | null;              
  job_id?: number | null;
  creator_name: string;
}
