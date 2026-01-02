import React from 'react'

import { DataTable, type DataTableProps } from '../data-table'
import { availableJobsColumns } from '@/data/available-jobs'
import type { AvailableJob } from '@/data/available-jobs'

interface BidBoardTableProps extends Omit<DataTableProps<AvailableJob>, 'columns'> {}

export function BidBoardTable(props: BidBoardTableProps) {
  return (
    <DataTable
      columns={availableJobsColumns}
      {...props}
    />
  )
}
