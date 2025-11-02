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
  alreadyBid?: boolean;
  services: Record<AvailableJobServices, boolean>
  service_items?: Array<any[]>
};

export type AvailableJobServices = 'MPT' | 'Flagging' | 'Perm Signs' | 'Equipment Rental' | 'Other'

export const AVAILABLE_JOB_SERVICES = ["MPT", "Flagging", "Perm Signs", "Equipment Rental", "Other"]

export type AvailableJobStatus = 'Bid' | 'No Bid' | 'Unset' | "Archived"

export const availableJobsColumns = [
  { key: "contractNumber", title: "Contract Number", sortable: true },
  { key: "status", title: "Status", sortable: false },
  { key: "requestor", title: "Requestor", sortable: true },
  { key: "owner", title: "Owner", sortable: true },
  { key: "lettingDate", title: "Letting Date", sortable: false },
  { key: "dueDate", title: "Due Date", sortable: false },
  { key: "county", title: "County", sortable: true },
  { key: "dbe", title: "DBE", sortable: false },
  { key: "createdAt", title: "Created At", sortable: true },
] as const 