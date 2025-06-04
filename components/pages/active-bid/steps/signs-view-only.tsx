import { DataTable } from '@/components/data-table'
import { useEstimate } from '@/contexts/EstimateContext'
import { PrimarySign, SecondarySign } from '@/types/MPTEquipment'
import React from 'react'

//displaying designation, description, dimensions (width and heigh in one cell so 12' x 24'), sheeting, structure, blights, covers
const SignsViewOnly = () => {

    const { mptRental } = useEstimate();

    const SIGN_COLUMNS = [
        {
            key: 'designation',
            title: 'Designation'
        },
        {
            key: 'description',
            title: 'Description'
        },
        {
            key: 'dimensions',
            title: 'Dimensions'
        },
        {
            key: 'sheeting',
            title: 'Sheeting'
        },
        {
            key: 'associatedStructure',
            title: 'Structure'
        },
        {
            key: 'bLights',
            title: 'B Lights'
        },
        {
            key: 'covers',
            title: 'Covers'
        }
    ]

    interface ExtendedSign extends PrimarySign {
        dimensions: string
    }

    return (
        <>
            {mptRental && mptRental.phases.map((phase, index) =>
                <div key={index} >
                    <div className="text-sm font-semibold mb-2 pl-6">Phase {index + 1} {phase.name.trim() !== '' && ''} {phase.name}</div>
                    <DataTable<ExtendedSign>
                        data={phase.signs.map(sign => ({...sign, dimensions: `${sign.width} x ${sign.height}`} as ExtendedSign))}
                        columns={SIGN_COLUMNS}
                        hideDropdown
                    />
                </div>)}
        </>
    )
}

export default SignsViewOnly
