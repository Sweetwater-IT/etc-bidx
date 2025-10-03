
export type QuoteStatus = "Not Sent" | "Sent" | "Accepted";

export type AttachmentNames =
    | "flagging-price-list"
    | "flagging-service-area"
    | "bedford-branch";

export type TermsNames =
    | "standard-terms"
    | "rental-agreements"
    | "equipment-sale"
    | "flagging-terms"
    | "custom-terms";

export interface PointOfContact {
    name: string;
    email: string;
}

export interface Quote {
    id?: number;
    quote_number?: string | null;
    type_quote: "straight_sale" | "to_project" | "estimate_bid",
    status?: "Not Sent" | "Sent" | "Accepted" | "DRAFT" | null;
    date_sent?: string | null;
    customer_name?: string;
    point_of_contact?: string;
    point_of_contact_email?: string;
    total_items?: number;
    county?: string | null;
    updated_at?: string | null;
    has_attachments?: boolean;
    estimate_contract_number?: string;
    estimate_id?: number | null;
    job_id?: number | null;
    created_at?: any
    project_title?: string;
    description?: string;
    selectedfilesids: any[];
    aditionalFiles: boolean;
    aditionalTerms: boolean;
    pdf_url: string;
    comment: "",
    digital_signature: "",
    notes: "",
    exclusions: string;
}

export interface StraightSaleQuote extends Quote {
    quoteCategory?: "Straight Sale";
    customer: any;
    customer_contact: any;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_job_number: string;
    purchase_order: string;
    etc_point_of_contact: string;
    etc_poc_email: string;
    etc_poc_phone_number: string;
    etc_branch: string;
    etc_job_number: string;
}

export interface ToProjectQuote extends Quote {
    quoteCategory?: "To Project";
    customer: any;
    customer_contact: any;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_job_number: string;
    purchase_order: string;

    etc_point_of_contact: string;
    etc_poc_email: string;
    etc_poc_phone_number: string;
    etc_branch: string;
    etc_job_number: string;

    township: string;
    county: string;
    sr_route: string;
    job_address: string;
    ecsm_contract_number: string;

    bid_date: string;
    start_date: string;
    end_date: string;
    duration: number;
}

export interface EstimateBidQuote extends Quote {
    quoteCategory?: "Estimate" | "Bid";
    customer: any;
    customer_contact: any;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_job_number: string;
    etc_point_of_contact: string;
    etc_poc_email: string;
    etc_poc_phone_number: string;
    etc_branch: string;
    etc_job_number: string;
    township: string;
    county: string;
    sr_route: string;
    job_address: string;
    ecsm_contract_number: string;
    bid_date: string;
    start_date: string;
    end_date: string;
    duration: number;
}

export type AnyPartialQuote =
    | Partial<Quote>
    | Partial<StraightSaleQuote>
    | Partial<ToProjectQuote>
    | Partial<EstimateBidQuote>;


export interface ContactInfo {
    name: string;
    email: string;
    phone: string;
}
