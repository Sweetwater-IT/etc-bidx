import React from 'react'

import { DataTable } from '../data-table'
import { availableJobsColumns } from '@/data/available-jobs'
import type { AvailableJob } from '@/data/available-jobs'
import type { DataTableProps } from '../data-table'

export function BidBoardTable(props: Omit<DataTableProps<AvailableJob>, 'columns'>) {
  return (
    <DataTable
      columns={availableJobsColumns}
      {...props}
    />
  )
}
