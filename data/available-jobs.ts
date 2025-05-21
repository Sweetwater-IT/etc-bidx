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

export const availableJobsData: AvailableJob[] = [
  {
    id: 1,
    contractNumber: "2024-001",
    status: "Open",
    requestor: "John Smith",
    owner: "Mike Johnson",
    lettingDate: "2024-04-15",
    dueDate: "2024-04-01",
    county: "Miami-Dade",
    branch: "South Florida",
    createdAt: "2024-03-15T10:00:00Z"
  },
  {
    id: 2,
    contractNumber: "2024-002",
    status: "Urgent",
    requestor: "Sarah Wilson",
    owner: "David Brown",
    lettingDate: "2024-04-30",
    dueDate: "2024-04-15",
    county: "Broward",
    branch: "South Florida",
    createdAt: "2024-03-14T15:30:00Z"
  },
]

export const availableJobsColumns = [
  { key: "contractNumber", title: "Contract Number" },
  { key: "status", title: "Status" },
  { key: "requestor", title: "Requestor" },
  { key: "owner", title: "Owner" },
  { key: "lettingDate", title: "Letting Date" },
  { key: "dueDate", title: "Due Date" },
  { key: "county", title: "County" },
  { key: "dbe", title: "DBE" },
  { key: "createdAt", title: "Created At" },
] as const 