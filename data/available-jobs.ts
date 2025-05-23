export interface AvailableJob {
  id: number
  contractNumber: string
  status: "Open" | "Urgent" | "Closed"
  requestor: string
  owner: string
  lettingDate: string | null
  dueDate: string | null
  county: string
  branch: string
  createdAt: string
  dbe?: number | null
}

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