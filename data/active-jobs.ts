export type ActiveJob = {
  jobNumber: string
  bidNumber: string
  projectStatus: string
  billingStatus: string
  contractNumber: string
  location: string
  county: string
  branch: string
  contractor: string
  startDate: string
  endDate: string
  laborRate: number
  fringeRate: number
  mpt: boolean
  rental: boolean
  permSigns: boolean
  flagging: boolean
  saleItems: boolean
  overdays: number
  createdAt: string
}

export const ACTIVE_JOBS_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "West", value: "west" },
  { label: "Turbotville", value: "turbotville" },
  { label: "Hatfield", value: "hatfield" },
]

export const ACTIVE_JOBS_COLUMNS = [
  { key: "jobNumber", title: "Job Number" },
  { key: "bidNumber", title: "Bid Number" },
  { key: "projectStatus", title: "Project Status" },
  { key: "billingStatus", title: "Billing Status" },
  { key: "contractNumber", title: "Contract Number" },
  { key: "location", title: "Location" },
  { key: "county", title: "County" },
  { key: "branch", title: "Branch" },
  { key: "contractor", title: "Contractor" },
  { key: "startDate", title: "Start Date" },
  { key: "endDate", title: "End Date" },
  { key: "laborRate", title: "Labor Rate", className: "text-right" },
  { key: "fringeRate", title: "Fringe Rate", className: "text-right" },
  { key: "mpt", title: "MPT" },
  { key: "rental", title: "Rental" },
  { key: "permSigns", title: "Perm. Signs" },
  { key: "flagging", title: "Flagging" },
  { key: "saleItems", title: "Sale Items" },
  { key: "overdays", title: "Overdays", className: "text-right" },
  { key: "createdAt", title: "Created At" },
]

export const activeJobsData: ActiveJob[] = [
  {
    jobNumber: "J001",
    bidNumber: "B001",
    projectStatus: "In Progress",
    billingStatus: "Current",
    contractNumber: "CNT001",
    location: "Philadelphia",
    county: "Philadelphia",
    branch: "West",
    contractor: "Contractor A",
    startDate: "2024-01-15",
    endDate: "2024-06-15",
    laborRate: 45.50,
    fringeRate: 15.75,
    mpt: true,
    rental: false,
    permSigns: true,
    flagging: true,
    saleItems: false,
    overdays: 0,
    createdAt: "2024-01-01",
  },
  {
    jobNumber: "J002",
    bidNumber: "B002",
    projectStatus: "Planned",
    billingStatus: "Pending",
    contractNumber: "CNT002",
    location: "Pittsburgh",
    county: "Allegheny",
    branch: "Turbotville",
    contractor: "Contractor B",
    startDate: "2024-02-01",
    endDate: "2024-08-01",
    laborRate: 42.75,
    fringeRate: 14.25,
    mpt: false,
    rental: true,
    permSigns: true,
    flagging: false,
    saleItems: true,
    overdays: 2,
    createdAt: "2024-01-05",
  },
  // Add more example data as needed
] 