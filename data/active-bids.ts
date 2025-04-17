export type ActiveBid = {
  lettingDate: string
  contractNumber: string
  contractor: string
  subcontractor: string
  owner: string
  county: string
  branch: string
  estimator: string
  status: string
  createdAt: string
}

export const ACTIVE_BIDS_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Won", value: "won" },
  { label: "Pending", value: "pending" },
  { label: "Lost", value: "lost" },
  { label: "Draft", value: "draft" },
  { label: "Won - Pending", value: "won-pending" },
]

export const ACTIVE_BIDS_COLUMNS = [
  { key: "lettingDate", title: "Letting date" },
  { key: "contractNumber", title: "Contract #" },
  { key: "contractor", title: "Contractor" },
  { key: "subcontractor", title: "Subcontractor" },
  { key: "owner", title: "Owner" },
  { key: "county", title: "County" },
  { key: "branch", title: "Branch" },
  { key: "estimator", title: "Estimator" },
  { key: "status", title: "Status" },
  { key: "createdAt", title: "Created At" },
]

export const activeBidsData: ActiveBid[] = [
  {
    lettingDate: "2024-01-15",
    contractNumber: "CNT001",
    contractor: "Contractor A",
    subcontractor: "Sub A",
    owner: "Owner Corp",
    county: "County A",
    branch: "Branch 1",
    estimator: "John Doe",
    status: "Won",
    createdAt: "2024-01-01",
  },
  {
    lettingDate: "2024-02-01",
    contractNumber: "CNT002",
    contractor: "Contractor B",
    subcontractor: "Sub B",
    owner: "Owner LLC",
    county: "County B",
    branch: "Branch 2",
    estimator: "Jane Smith",
    status: "Pending",
    createdAt: "2024-01-05",
  },
  // Add more example data as needed
] 