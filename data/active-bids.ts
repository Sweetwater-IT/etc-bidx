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
  { key: "lettingDate", title: "Letting Date", className: 'whitespace-nowrap' },
  { key: "contractNumber", title: "Contract Number", className: 'max-w-40 truncate whitespace-nowrap' },
  { key: "contractor", title: "Contractor" },
  { key: "subcontractor", title: "Subcontractor" },
  { key: "owner", title: "Owner" },
  { key: "estimator", title: 'Estimator', className: 'min-w-35'},
  { key: "county", title: "County", className: 'max-w-40' },
  { key: "status", title: "Status" },
  { key: "createdAt", title: "Created At", className: 'whitespace-nowrap' },
]