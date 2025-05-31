import { County } from "@/types/TCounty"

export type ActiveJob = {
  jobNumber: string
  bidNumber: string
  projectStatus: string
  billingStatus: string
  contractNumber: string
  location: string
  county: {main: string, secondary: string} | string
  countyJson: County | undefined
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
  status: string
  wonBidItems: string[]
}

export const ACTIVE_JOBS_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "West", value: "west" },
  { label: "Turbotville", value: "turbotville" },
  { label: "Hatfield", value: "hatfield" },
  { label: "Archived", value: "archived" },
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