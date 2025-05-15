export type ActiveBid = {
  id: number
  lettingDate: string
  contractNumber: string
  contractor: string
  subcontractor: string
  owner: string
  county: string
  branch: string
  estimator: string
  status: string
  division: string
  startDate: string
  endDate: string
  projectDays: number
  totalHours: number
  mptValue: string
  permSignValue: string
  rentalValue: string
  createdAt?: string
}

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
  { key: "division", title: "Division" },
  { key: "startDate", title: "Start Date" },
  { key: "endDate", title: "End Date" },
  { key: "projectDays", title: "Project Days" },
  { key: "totalHours", title: "Total Hours" },
  { key: "mptValue", title: "MPT Value" },
  { key: "permSignValue", title: "Perm Sign Value" },
  { key: "rentalValue", title: "Rental Value" },
]

export const activeBidsData: ActiveBid[] = [
  {
    id: 1,
    lettingDate: "2024-01-15",
    contractNumber: "CNT001",
    contractor: "Contractor A",
    subcontractor: "Sub A",
    owner: "Owner Corp",
    county: "County A",
    branch: "Branch 1",
    estimator: "John Doe",
    status: "Won",
    division: "Division 1",
    startDate: "2024-02-01",
    endDate: "2024-06-30",
    projectDays: 150,
    totalHours: 1200,
    mptValue: "$50,000",
    permSignValue: "$25,000",
    rentalValue: "$10,000",
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    lettingDate: "2024-02-01",
    contractNumber: "CNT002",
    contractor: "Contractor B",
    subcontractor: "Sub B",
    owner: "Owner LLC",
    county: "County B",
    branch: "Branch 2",
    estimator: "Jane Smith",
    status: "Pending",
    division: "Division 2",
    startDate: "2024-03-01",
    endDate: "2024-08-31",
    projectDays: 180,
    totalHours: 1440,
    mptValue: "$75,000",
    permSignValue: "$35,000",
    rentalValue: "$15,000",
    createdAt: "2024-01-05",
  },
] 
