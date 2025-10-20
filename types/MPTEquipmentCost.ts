import { ContactInfo } from "@/app/quotes/view/[id]/QuoteViewContent"

export type MPTEquipmentCost = {
    cost : number
    revenue : number
    depreciationCost : number
    grossProfit : number
    grossMargin: number
    details?: {
        equipmentBreakdown: Array<{
            type: string
            quantity: number
            days: number
            cost: number
            revenue: number
        }>
        formula: string
    }
}
export interface Quote {
  id: number;
  quote_number?: string | null;
  contract_number?: string | null;
  status?: "DRAFT" | "Not Sent" | "Sent" | "Accepted" | null;
  created_at?: string | null;
  date_sent?: string | null;
  customer?: any;
  contact?: ContactInfo | null;
  ccEmails?: string[];
  bccEmails?: string[];
  requestor?: string | null;
  quote_date?: string | null;
  items?: any[];
  admin_data?: any | null;
  files?: any[];
  notes?: any | null;
  from_email?: string | null;
  subject?: string | null;
  body?: string | null;
  estimate_id?: number | null;
  job_id?: number | null;
  response_token?: string | null;
  custom_terms_conditions?: string | null;
  payment_terms?: string;
  county?: string | null;
  state_route?: string | null;
  ecms_po_number?: string | null;
  bedford_sell_sheet?: boolean;
  flagging_price_list?: boolean;
  flagging_service_area?: boolean;
  standard_terms?: boolean;
  rental_agreements?: boolean;
  equipment_sale?: boolean;
  flagging_terms?: boolean;
  updated_at?: string | null;
  type_quote: "straight_sale" | "to_project" | "estimate_bid";
  customer_contact?: Record<string, any>;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_job_number?: string;
  purchase_order?: string | null;
  etc_point_of_contact?: string;
  etc_poc_email?: string;
  etc_poc_phone_number?: string;
  etc_branch?: string;
  township?: string;
  sr_route?: string;
  job_address?: string;
  ecsm_contract_number?: string;
  bid_date?: string;
  start_date?: string;
  end_date?: string | null;
  duration?: number;
  pdf_url: string;
  digital_signature: string;
  comments: string;
  exclusionsText: string;
  termsText: string;
  aditionalTerms: boolean;
  selectedfilesids: any[];
  notesText: string;
  user_created: string;
  user_sent: string;

}
