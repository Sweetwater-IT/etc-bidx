import { DataTable } from '@/components/data-table'
import { useEstimate } from '@/contexts/EstimateContext'
import { sortSignsBySecondary } from '@/lib/sortSignsBySecondary';
import { lightAndDrumList, Phase, standardEquipmentList } from '@/types/MPTEquipment';
import React, { useState } from 'react'
import { TripAndLaborSummary } from './trip-and-labor-summary';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
    const [expandedStructureIndex, setExpandedStructureIndex] = useState<number | null>(null);

    const toggleStructureExpand = (index: number) => {
        setExpandedStructureIndex(prev => (prev === index ? null : index));
    };

    const toggleTripExpand = (index: number) => {
        setExpandedTripIndex(prev => (prev === index ? null : index));
    };

    const toggleExpand = (index: number) => {
        setExpandedPhaseIndex(expandedPhaseIndex === index ? null : index)
    }

    const hasStructures = (phase: any) => 
        phase.signs?.some(
            (s: any) =>
                !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
        ) ?? false;

    const structureCount = (phase: any) =>
        phase.signs?.filter(
            (s: any) =>
                !['none', 'loose'].includes(s.displayStructure?.toLowerCase() || '') &&
                !['none', 'loose'].includes(s.associatedStructure?.toLowerCase() || '')
        ).length || 0;

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
                {mptRental.phases.map((phase: any, index: number) => {
                    const phaseName = phase.name || `Phase ${index + 1}`;
                    const phaseIdentifier = `Phase ${index + 1}${phase.name ? ` - ${phase.name}` : ''}`;
                    const signCount = phase.signs?.length || 0;
                    const structureCnt = structureCount(phase);
                    const hasStruct = hasStructures(phase);
                    const days = phase.days || 0;
                    const personnel = phase.personnel || 0;
                    const isPhaseExpanded = expandedPhaseIndex === index;
                    const isStructureExpanded = expandedStructureIndex === index;
                    const isTripExpanded = expandedTripIndex === index;

                    return (
                        <React.Fragment key={index}>
                            <TableRow className="hover:bg-gray-50">
                                <TableCell className="px-2 py-4 w-6 text-center">
                                    {signCount > 0 && (
                                        <div className="cursor-pointer" onClick={() => toggleExpand(index)}>
                                            {isPhaseExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-gray-600" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-600" />
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="px-2 py-4 font-semibold">{phaseName}</TableCell>
                                <TableCell className="px-2 py-4">{phase.itemNumber || '-'}</TableCell>
                                <TableCell className="px-2 py-4">{phase.startDate ? new Date(phase.startDate).toLocaleDateString() : '-'}</TableCell>
                                <TableCell className="px-2 py-4">{phase.endDate ? new Date(phase.endDate).toLocaleDateString() : '-'}</TableCell>
                                <TableCell className="px-2 py-4 text-center">
                                    {signCount > 0 ? (
                                        <div 
                                            className="text-blue-700 cursor-pointer hover:underline"
                                            onClick={() => toggleExpand(index)}
                                        >
                                            {signCount} {signCount === 1 ? 'sign' : 'signs'}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="px-2 py-4 text-center">
                                    {hasStruct ? (
                                        <div 
                                            className="flex items-center gap-1 justify-center text-blue-700 cursor-pointer hover:underline"
                                            onClick={() => toggleStructureExpand(index)}
                                        >
                                            {isStructureExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                            {structureCnt} {structureCnt === 1 ? 'structure' : 'structures'}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="px-2 py-4 text-center">
                                    <div 
                                        className="flex items-center gap-1 justify-center text-blue-700 cursor-pointer hover:underline"
                                        onClick={() => toggleTripExpand(index)}
                                    >
                                        {isTripExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        {days} days, {personnel} personnel
                                    </div>
                                </TableCell>
                            </TableRow>
                            {isPhaseExpanded && (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-4 bg-white border-t transition-all duration-300 ease-in-out">
                                        <div className="mb-2">
                                            <h5 className="text-sm font-medium text-gray-600">{phaseIdentifier}</h5>
                                            <h4 className="font-semibold">Signs</h4>
                                        </div>
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
                            {isStructureExpanded && structureCnt > 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-4 border-t transition-all duration-300 ease-in-out">
                                        <div className="mb-4 pl-6">
                                            <h5 className="text-sm font-medium text-gray-600 mb-1">{phaseIdentifier}</h5>
                                            <h4 className="font-semibold">MPT Equipment</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
                                            {standardEquipmentList.map((equipmentKey) => {
                                                const quantity = phase.standardEquipment?.[equipmentKey]?.quantity || 0
                                                const formatLabel = (key: string) =>
                                                    labelMapping[key as keyof typeof labelMapping] ||
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
                            {isTripExpanded && (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-4 bg-white border-t transition-all duration-300 ease-in-out">
                                        <div className="mb-2">
                                            <h5 className="text-sm font-medium text-gray-600">{phaseIdentifier}</h5>
                                            <h4 className="font-semibold">Trip & Labor Details</h4>
                                        </div>
                                        <TripAndLaborSummary phase={phase} phaseIndex={index} adminData={adminData} mptRental={mptRental} />
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    )
}

export default PhasesViewOnly
