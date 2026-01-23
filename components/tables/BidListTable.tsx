import React from 'react'

import { DataTable } from '../data-table'
import { ACTIVE_BIDS_COLUMNS } from '@/data/active-bids'
import type { ActiveBid } from '@/data/active-bids'
import type { DataTableProps } from '../data-table'

export function BidListTable(props: Omit<DataTableProps<ActiveBid>, 'columns'>) {
  return (
    <DataTable
      columns={ACTIVE_BIDS_COLUMNS}
      {...props}
    />
  )
}
