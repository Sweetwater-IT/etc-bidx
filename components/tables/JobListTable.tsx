import React from 'react'

import { DataTable, type DataTableProps } from '../data-table'
import type { ActiveJob } from '@/data/active-jobs'

const DISPLAYED_ACTIVE_JOBS_COLUMNS = [
  { key: "jobNumber", title: "Job Number", className: 'whitespace-nowrap' },
  { key: "bidNumber", title: "Bid Number" },
  { key: "projectStatus", title: "Project Status" },
  { key: "billingStatus", title: "Billing Status" },
  { key: "contractNumber", title: "Contract Number", className: 'truncate whitespace-nowrap max-w-40' },
  { key: "location", title: "Location", className: 'truncate whitespace-nowrap max-w-30' },
  { key: "county", title: "County" },
  { key: "contractor", title: "Contractor" },
  { key: "startDate", title: "Start Date", className: 'whitespace-nowrap' },
  { key: "endDate", title: "End Date", className: 'whitespace-nowrap' },
  { key: 'cpr', title: 'CPR' },
  { key: 'createdAt', title: 'Created At', className: 'whitespace-nowrap' }
] as const

interface JobListTableProps extends Omit<DataTableProps<ActiveJob>, 'columns'> {}

export function JobListTable(props: JobListTableProps) {
  return (
    <DataTable
      columns={DISPLAYED_ACTIVE_JOBS_COLUMNS}
      {...props}
    />
  )
}
