'use client'
import { WorksheetDialog } from '@/components/sheets/WorksheetDialog';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEstimate } from '@/contexts/EstimateContext';
import { exportSignListToExcel } from '@/lib/exportSignListToExcel';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const DEFAULT_TOTALS = {
    revenue: '',
    grossProfit: '',
    grossMargin: '',
  };

interface Props {
    mode : 'view' | 'edit' | 'new'
    status: string
}
  

const StepperSaveButtons = ({mode, status}: Props) => {

    const {adminData, mptRental, equipmentRental, flagging, dispatch } = useEstimate();

    const [openPdfDialog, setOpenPdfDialog] = useState(false);
    const [selectedPdfType, setSelectedPdfType] = useState<string>('estimators');
    const [openWorksheetPopover, setOpenWorksheetPopover] = useState(false);

    const router = useRouter()

    const params = useSearchParams();

    return (
        <>
            <WorksheetDialog
                open={openPdfDialog}
                onOpenChange={setOpenPdfDialog}
                selectedPdfType={selectedPdfType}
                mptRental={mptRental}
                equipmentRental={equipmentRental}
                flagging={flagging}
                adminData={adminData}
                mptTotals={DEFAULT_TOTALS}
                allTotals={DEFAULT_TOTALS}
                rentalTotals={DEFAULT_TOTALS}
                saleTotals={DEFAULT_TOTALS}
                flaggingTotals={DEFAULT_TOTALS}
            />
            <div className="flex gap-x-2">
                {/* Worksheet Dropdown Button */}
                {mode !== 'view' && <><Popover open={openWorksheetPopover} onOpenChange={setOpenWorksheetPopover}>
                    <PopoverTrigger asChild>
                        <Button size='sm' variant="outline">
                            View Worksheet
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                <CommandItem
                                    value="estimators"
                                    onSelect={() => {
                                        setSelectedPdfType('estimators');
                                        setOpenWorksheetPopover(false);
                                        setOpenPdfDialog(true);
                                    }}
                                >
                                    For Estimators
                                </CommandItem>
                                <CommandItem
                                    value="project-managers"
                                    onSelect={() => {
                                        setSelectedPdfType('project-managers');
                                        setOpenWorksheetPopover(false);
                                        setOpenPdfDialog(true);
                                    }}
                                >
                                    For Project Managers
                                </CommandItem>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Button className='p-4' size='sm' onClick={() => exportSignListToExcel(adminData.contractNumber, mptRental)}>Export Sign List</Button>
                <Button className='p-4' size='sm'><Link href={`/quotes/create?contractNumber=${adminData.contractNumber}`}>Create Proposal</Link></Button></>}
                {status !== 'WON' && <Button className='p-4' size='sm' onClick={() => mode === 'view' ? router.push(`/active-bid/edit?${params?.toString()}`) : ''}>Edit Draft</Button>}
            </div>
        </>
    )

}

export default StepperSaveButtons
