export type ActiveBid = {
  id: number;
  lettingDate: string;
  contractNumber: string | { main: string; secondary: string };
  originalContractNumber?: string; // Added for details drawer
  contractor: string;
  subcontractor: string;
  owner: string;
  county: string | { main: string; secondary: string };
  branch: string;
  estimator: string;
  status: string;
  division: string;
  startDate: string;
  endDate: string;
  projectDays: number;
  totalHours: number;
  mptValue: string | number;
  permSignValue: string | number;
  rentalValue: string | number;
  createdAt: string;
  total?: string | number; // Add total field
}

export const ACTIVE_BIDS_COLUMNS = [
  { key: "lettingDate", title: "Letting Date" },
  { key: "contractNumber", title: "Contract #" },
  { key: "contractor", title: "Contractor" },
  { key: "subcontractor", title: "Subcontractor" },
  { key: "owner", title: "Owner" },
  { key: "county", title: "County" },
  { key: "status", title: "Status" },
  { key: "total", title: "Total", className: "text-right" },
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
    total: "$85,000", // Add total value
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
    total: "$125,000", // Add total value
  },
] 
