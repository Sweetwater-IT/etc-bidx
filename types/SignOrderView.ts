export interface SignOrderView {
  id: number;
  requestor: string;
  contractor_id?: number;
  job_number?: string;
  contract_number?: string;
  order_date?: string;
  need_date?: string;
  sale?: boolean;
  rental?: boolean;
  perm_signs?: boolean;
  status: string;
  shop_status?: string;
  order_number?: string;
  customer?: string;
  branch?: string;
  assigned_to?: string;
  type?: string;
  archived: boolean;
  created_at: string;
}
