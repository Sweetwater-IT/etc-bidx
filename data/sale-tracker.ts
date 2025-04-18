export type SaleTrackerItem = {
  id: string
  jobNumber: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  createdAt: string
}

export const SALE_TRACKER_COLUMNS = [
  { key: "jobNumber", title: "Job Number" },
  { key: "description", title: "Description" },
  { key: "quantity", title: "Quantity", className: "text-left" },
  { key: "unitPrice", title: "Unit Price", className: "text-left" },
  { key: "totalPrice", title: "Total Price", className: "text-left" },
  { key: "status", title: "Status", className: "text-left" },
  { key: "createdAt", title: "Created At" },
]

export const saleTrackerData: SaleTrackerItem[] = [
  {
    id: "ST001",
    jobNumber: "J001",
    description: "Traffic Control Signs",
    quantity: 50,
    unitPrice: 75.00,
    totalPrice: 3750.00,
    status: "Pending",
    createdAt: "2024-01-15",
  },
  {
    id: "ST002",
    jobNumber: "J002",
    description: "Safety Equipment",
    quantity: 25,
    unitPrice: 120.00,
    totalPrice: 3000.00,
    status: "Approved",
    createdAt: "2024-01-20",
  },
  // Add more example data as needed
] 