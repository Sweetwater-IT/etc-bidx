import React from 'react'

import { DataTable, type DataTableProps } from '../data-table'
import { ACTIVE_BIDS_COLUMNS } from '@/data/active-bids'
import type { ActiveBid } from '@/data/active-bids'

interface BidListTableProps extends Omit<DataTableProps<ActiveBid>, 'columns'> {}

export function BidListTable(props: BidListTableProps) {
  return (
    <DataTable
      columns={ACTIVE_BIDS_COLUMNS}
      {...props}
    />
  )
}
