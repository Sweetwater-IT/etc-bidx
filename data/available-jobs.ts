export type AvailableJob = {
  id: number;
  contractNumber: string;
  status: AvailableJobStatus
  requestor: string;
  owner: string;
  lettingDate: string | null;
  dueDate: string | null;
  county: {main: string, secondary: string};
  createdAt: string;
  location: string;
  platform: string;
  dbe? :string;
  noBidReason?: string;
  stateRoute?: string;
  mpt: boolean;
  flagging: boolean;
  perm_signs: boolean;
  equipment_rental: boolean;
  other: boolean;
};

export type AvailableJobStatus = 'Bid' | 'No Bid' | 'Unset' | "Archived"

export const availableJobsColumns = [
  { key: "contractNumber", title: "Contract Number", sortable: true },
  { key: "status", title: "Status" },
  { key: "requestor", title: "Requestor" },
  { key: "owner", title: "Owner" },
  { key: "lettingDate", title: "Letting Date", sortable: true },
  { key: "dueDate", title: "Due Date", sortable: true },
  { key: "county", title: "County" },
  { key: "dbe", title: "DBE" },
  { key: "createdAt", title: "Created At" },
] as const 