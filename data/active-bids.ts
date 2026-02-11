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
  service_work: any;
  estimator: string;
  etcRep: string;
  status: string;
  division: string;
  startDate: string;
  flagging: any;
  endDate: string;
  projectDays: number;
  totalHours: number;
  mptValue: string | number;
  permSignValue: string | number;
  rentalValue: string | number;
  createdAt: string;
  total?: string | number; // Add total field
  notes: {bid_id: number; text:string, created_at:Date, id: number, user_email?: string}[]
  adminData: any;
}

export const ACTIVE_BIDS_COLUMNS = [
  { key: "lettingDate", title: "Letting Date", className: 'whitespace-nowrap' },
  { key: "contractNumber", title: "Contract Number", className: 'max-w-40 truncate whitespace-nowrap' },
  { key: "contractor", title: "Contractor" },
  { key: "subcontractor", title: "Subcontractor" },
  { key: "owner", title: "Owner" },
  { key: "estimator", title: 'Estimator', className: 'min-w-35'},
  { key: "etcRep", title: 'ETC Rep', className: 'min-w-30'},
  { key: "county", title: "County", className: 'max-w-40' },
  { key: "status", title: "Status" },
  { key: "createdAt", title: "Created At", className: 'whitespace-nowrap' },
]
