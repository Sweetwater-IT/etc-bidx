import { DataTable } from '@/components/data-table'
import { useEstimate } from '@/contexts/EstimateContext'
import { sortSignsBySecondary } from '@/lib/sortSignsBySecondary'
import { AssociatedStructures, DisplayStructures, PrimarySign, SecondarySign } from '@/types/MPTEquipment'
import React from 'react'

interface Props {
    phaseNumber?: number
}

//displaying designation, description, dimensions (width and heigh in one cell so 12' x 24'), sheeting, structure, blights, covers
const SignsViewOnly = ({ phaseNumber }: Props) => {

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
            key: 'quantity',
            title: 'Quantity'
        },
        {
            key: 'sheeting',
            title: 'Sheeting'
        },
        {
            key: 'displayStructure',
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

    function getDisplayFromStructure (structure : AssociatedStructures) : DisplayStructures {
        if(structure === 'fourFootTypeIII'){
            return '4\' T-III LEFT'
        } else if (structure === 'hStand') {
            return 'H-FOOT'
        } else if (structure === 'post') {
            return '12\' POST'
        } else return 'LOOSE'
    }

    return (
        <>
            {mptRental && phaseNumber ? (
                <div>
                    <div className="text-sm font-semibold mb-2 pl-6">Phase {phaseNumber + 1} {mptRental.phases[phaseNumber].name.trim() !== '' && ''} {mptRental.phases[phaseNumber].name}</div>
                    <DataTable<ExtendedSign>
                        data={mptRental.phases[phaseNumber].signs.length === 0 ? [{ description: '-', designation: '-', associatedStructure: '-', bLights: '-', covers: '-', sheeting: '-', dimensions: '-' } as any] :
                        //sort signs by secondary and if they are, add a > in front of the designation
                            sortSignsBySecondary(mptRental.phases[phaseNumber].signs).map(sign => ({ ...sign, dimensions: `${sign.width} x ${sign.height}` } as ExtendedSign))}
                        columns={SIGN_COLUMNS}
                        hideDropdown
                    />
                </div>
            ) : mptRental.phases.map((phase, index) =>
                <div key={index} >
                    <div className="text-sm font-semibold mb-2 pl-6">Phase {index + 1} {phase.name.trim() !== '' && ''} {phase.name}</div>
                    <DataTable<ExtendedSign>
                        data={phase.signs.length === 0 ? [{ description: '-', designation: '-', associatedStructure: '-', bLights: '-', covers: '-', sheeting: '-', dimensions: '-' } as any] :
                        sortSignsBySecondary(phase.signs).map(sign => ({ ...sign, dimensions: `${sign.width} x ${sign.height}`, 
                            //for historical data where displayStructure does not exist
                            displayStructure: Object.hasOwn(sign, 'associatedStructure') ? (sign as PrimarySign).displayStructure ? (sign as PrimarySign).displayStructure : getDisplayFromStructure((sign as PrimarySign).associatedStructure)  : '' } as ExtendedSign))}
                        columns={SIGN_COLUMNS}
                        hideDropdown
                    />
                </div>)}
        </>
    )
}

export default SignsViewOnly
