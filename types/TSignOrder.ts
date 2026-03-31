export interface SignOrder {
    id: number
    requestor: string
    contractor_id: number
    contact_id?: number | null
    contractors?: { name: string }
    contact?: {
      id: number
      name: string
      role: string
      email: string
      phone: string
    } | null
    branch?: string
    order_date: string
    need_date: string
    start_date: string
    end_date: string
    job_number: string
    contract_number: string
    sale: boolean
    rental: boolean
    perm_signs: boolean
    status: string
    shop_status?: string
    assigned_to?: string
    target_date?: string
  }
