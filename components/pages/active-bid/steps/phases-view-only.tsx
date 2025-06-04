import { DataTable } from '@/components/data-table'
import { useEstimate } from '@/contexts/EstimateContext'
import { Phase } from '@/types/MPTEquipment';
import React from 'react'

const PhasesViewOnly = () => {

    const { mptRental } = useEstimate();

    const PHASES_COLUMNS = [
        {
            key: 'name',
            title: 'Name'
        },
        {
            key: 'startDate',
            title: 'Start Date'
        },
        {
            key: 'endDate',
            title: 'End Date'
        }
    ]

  return (
    <DataTable<Phase>
        data={mptRental.phases.map(p => ({...p, name: (p.name && p.name.trim() !== '') ? p.name : '-'}))}
        columns={PHASES_COLUMNS}
        hideDropdown={true}
    />
  )
}

export default PhasesViewOnly
