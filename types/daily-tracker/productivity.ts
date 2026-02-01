export interface ProductivityEntry {
  date: string
  employee: string
  dimension_l: number
  dimension_w: number
  sqft: number
  type: "sale" | "mpt"
  quantity: number
  total_sqft: number
}

export interface EmployeeMetrics {
  employee: string
  totalSigns: number
  totalSqft: number
}

export interface TypeMetrics {
  type: "sale" | "mpt"
  totalSigns: number
  totalSqft: number
}