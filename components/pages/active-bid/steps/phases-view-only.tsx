import { DataTable } from '@/components/data-table'
import { useEstimate } from '@/contexts/EstimateContext'
import { sortSignsBySecondary } from '@/lib/sortSignsBySecondary';
import { lightAndDrumList, Phase, standardEquipmentList } from '@/types/MPTEquipment';
import React, { useState } from 'react'
import { TripAndLaborSummary } from './trip-and-labor-summary';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const formatLabel = (key: string): string => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
}

const PhasesViewOnly = () => {
    const { mptRental, adminData } = useEstimate()
    const [expandedPhaseIndex, setExpandedPhaseIndex] = useState<number | null>(null)
    const [expandedTripIndex, setExpandedTripIndex] = useState<number | null>(null);
    const [expandedMutcdIndex, setExpandedMutcdIndex] = useState<number | null>(null);
    const [expandedStructureIndex, setExpandedStructureIndex] = useState<number | null>(null);

    const toggleStructureExpand = (index: number) => {
        setExpandedStructureIndex(prev => (prev === index ? null : index));
    };
    const toggleMutcdExpand = (index: number) => {
        setExpandedMutcdIndex(prev => (prev === index ? null : index));
    };

    const toggleTripExpand = (index: number) => {
        setExpandedTripIndex(prev => (prev === index ? null : index));
    };

    const toggleExpand = (index: number) => {
        setExpandedPhaseIndex(expandedPhaseIndex === index ? null : index)
    }

    return (
        <Table className="w-full">
            <TableHeader className="bg-gray-100">
                <TableRow>
                    {['', 'Phase', 'Item #', 'Start Date', 'End Date', 'MUTCD Signs', 'Structures', 'Trip & Labor'].map((col) => (
                        <TableHead key={col} className="px-2 py-1">{col}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {mptRental.phases.map((phase: any, index: number) => (
                    <React.Fragment key={index}>
                        <TableRow className="hover:bg-gray-50">
                            <TableCell className="px-2 py-4 w-6 text-center cursor-pointer" onClick={() => toggleExpand(index)}>
                                <div
                                    className={`transition-transform duration-300`}
                                    style={{ transform: expandedPhaseIndex === index ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                </div>
                            </TableCell>

                            <TableCell className="px-2 py-4 font-semibold">{phase.name || `Phase ${index + 1}`}</TableCell>
                            <TableCell className="px-2 py-4">{phase.itemNumber || '-'}</TableCell>
                            <TableCell className="px-2 py-4">{phase.startDate ? new Date(phase.startDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="px-2 py-4">{phase.endDate ? new Date(phase.endDate).toLocaleDateString() : '-'}</TableCell>

                            <TableCell
                                className="px-2 py-4 text-blue-700 cursor-pointer text-center"
                                onClick={() => toggleMutcdExpand(index)}
                            >
                                {phase.signs?.length || 0} <ChevronDown className="inline h-4 w-4 ml-1 text-blue-700 transition-transform duration-300" style={{ transform: expandedMutcdIndex === index ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </TableCell>
                            <TableCell
                                className={`px-2 py-4 text-blue-700 cursor-pointer text-center ${phase.signs?.some(
                                    (s) =>
                                        !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                                        !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
                                )
                                    ? ''
                                    : 'text-gray-400 cursor-default'
                                    }`}
                                onClick={() =>
                                    phase.signs?.some(
                                        (s) =>
                                            !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                                            !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
                                    )
                                        ? toggleStructureExpand(index)
                                        : undefined
                                }
                            >
                                {phase.signs?.filter(
                                    (s) =>
                                        !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                                        !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
                                ).length || '-'}{' '}
                                {phase.signs?.some(
                                    (s) =>
                                        !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                                        !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
                                ) && <ChevronDown className={`inline h-4 w-4 ml-1 text-blue-700 transition-transform duration-300`} style={{ transform: expandedStructureIndex === index ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
                            </TableCell>
                            <TableCell
                                className="px-2 py-4 text-blue-700 cursor-pointer text-center"
                                onClick={() => toggleTripExpand(index)}
                            >
                                <div
                                    className="inline-block mr-1 transition-transform duration-300"
                                    style={{ transform: expandedTripIndex === index ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                    <ChevronDown className="h-4 w-4 text-blue-700" />
                                </div>
                                {phase.days || 0} days, {phase.personnel || 0} personnes
                            </TableCell>

                        </TableRow>

                        {expandedPhaseIndex === index && (
                            <TableRow>
                                <TableCell colSpan={8} className="p-4 bg-white border-t transition-all duration-300 ease-in-out">
                                    <h4 className="font-semibold mb-2">Signs</h4>
                                    <Table className="w-full">
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                {['Designation', 'Description', 'Dimensions', 'Quantity', 'Sheeting', 'Structure', 'B Lights', 'Covers'].map((col) => (
                                                    <TableHead key={col} className="px-2 py-1">{col}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {phase.signs?.length ? sortSignsBySecondary(phase.signs).map((sign: any, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="px-2 py-1">{sign.designation}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.description}</TableCell>
                                                    <TableCell className="px-2 py-1">{`${sign.width} x ${sign.height}`}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.quantity}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.sheeting}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.displayStructure || sign.associatedStructure || '-'}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.bLights}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.covers}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-2">No signs</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableCell>
                            </TableRow>
                        )}

                        {expandedMutcdIndex === index && (
                            <TableRow>
                                <TableCell colSpan={8} className="p-4 bg-white border-t transition-all duration-300 ease-in-out">
                                    <h4 className="font-semibold mb-2">MUTCD Signs Details</h4>
                                    <Table className="w-full">
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                {['Designation', 'Description', 'Dimensions', 'Quantity', 'Sheeting', 'Structure', 'B Lights', 'Covers'].map((col) => (
                                                    <TableHead key={col} className="px-2 py-1">{col}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {phase.signs?.length ? sortSignsBySecondary(phase.signs).map((sign: any, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="px-2 py-1">{sign.designation}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.description}</TableCell>
                                                    <TableCell className="px-2 py-1">{`${sign.width} x ${sign.height}`}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.quantity}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.sheeting}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.displayStructure || sign.associatedStructure || '-'}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.bLights}</TableCell>
                                                    <TableCell className="px-2 py-1">{sign.covers}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-2">No MUTCD signs</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableCell>
                            </TableRow>
                        )}

                        {expandedTripIndex === index && (
                            <TableRow>
                                <TableCell colSpan={8} className="p-4 bg-white border-t transition-all duration-300 ease-in-out">
                                    <h4 className="font-semibold mb-2">Trip & Labor Details</h4>
                                    <TripAndLaborSummary phase={phase} phaseIndex={index} adminData={adminData} mptRental={mptRental} />
                                </TableCell>
                            </TableRow>
                        )}

                        {expandedStructureIndex === index && (
                            <TableRow>
                                <TableCell colSpan={8} className="p-4 border-t transition-all duration-300 ease-in-out">
                                    <h4 className="text-base font-semibold mb-4 pl-6">MPT Equipment</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
                                        {standardEquipmentList.map((equipmentKey) => {
                                            const quantity = phase.standardEquipment?.[equipmentKey]?.quantity || 0
                                            const price = mptRental?.staticEquipmentInfo?.[equipmentKey]?.price || 0

                                            const labelMapping: Record<string, string> = {
                                                fourFootTypeIII: "4' Type III",
                                                hStand: "H Stand",
                                                post: "Post",
                                                sandbag: "Sandbags",
                                                sixFootWings: "Six Foot Wings",
                                                metalStands: "Metal Stands",
                                                covers: "Covers",
                                                HIVP: "HI Vertical Panels",
                                                TypeXIVP: "Type XI Vertical Panels",
                                                BLights: "B-Lights",
                                                ACLights: "AC Lights",
                                                sharps: "Sharps",
                                            }

                                            const formatLabel = (key: string) =>
                                                labelMapping[key] ||
                                                key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())

                                            return (
                                                <div key={equipmentKey} className="flex flex-col">
                                                    <label className="text-sm font-semibold">{formatLabel(equipmentKey)}</label>
                                                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                                        Qty: {quantity}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
                ))}
            </TableBody>
        </Table>
    )
}

export default PhasesViewOnly
