'use client'
import { BidSummaryDrawer } from '@/components/bid-summary-drawer';
import { WorksheetDialog } from '@/components/sheets/WorksheetDialog';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEstimate } from '@/contexts/EstimateContext';
import { useLoading } from '@/hooks/use-loading';
import { createActiveBid } from '@/lib/api-client';
import { exportSignListToExcel } from '@/lib/exportSignListToExcel';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const DEFAULT_TOTALS = {
    revenue: '',
    grossProfit: '',
    grossMargin: '',
};

interface Props {
    mode: 'view' | 'edit' | 'new'
    status: string
}


const StepperSaveButtons = ({ mode, status }: Props) => {

    const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, ratesAcknowledged } = useEstimate();

    const [openPdfDialog, setOpenPdfDialog] = useState(false);
    const [selectedPdfType, setSelectedPdfType] = useState<string>('estimators');
    const [openWorksheetPopover, setOpenWorksheetPopover] = useState(false);

    const [isViewSummaryOpen, setIsViewSummaryOpen] = useState<boolean>(false)

    const [initialSubmission, setInitialSubmisison] = useState<boolean>(false)

    const { startLoading, stopLoading } = useLoading()

    const router = useRouter()

    const params = useSearchParams();

    const bidId = params?.get('bidId')

    const handleSubmit = async () => {
        try {
            startLoading();
            const idToUse = (bidId && bidId.trim() !== '') ? Number(bidId) : undefined
            await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems, 'PENDING', idToUse);
            toast.success(`Bid number ${adminData.contractNumber} successfully saved.`)
            stopLoading()
            router.replace('/jobs/active-bids')
        } catch (error) {
            console.error("Error creating bid:", error);
            stopLoading()
            toast.error('Bid not succesfully saved as draft: ' + error)
        }
    }

    useEffect(() => {
        if (mode === 'edit' && status !== 'DRAFT') {
            setInitialSubmisison(true)
        }
    }, [mode, status])

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
                {mode !== 'view' && initialSubmission && <><Popover open={openWorksheetPopover} onOpenChange={setOpenWorksheetPopover}>
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
                {mode === 'view' && <Button
                    variant="outline"
                    size='sm'
                    onClick={() => setIsViewSummaryOpen(true)}
                >
                    View Bid Summary
                </Button>}
                {mode === 'view' && status !== 'WON' && status!== 'LOST' && <Button className='p-4' size='sm' onClick={() => router.push(`/active-bid/edit?${params?.toString()}`)}>Edit{status === 'DRAFT' ? ' Draft' : ' Bid'}</Button>}
                {mode !== 'view' && <Button disabled={!ratesAcknowledged} className='p-4' size='sm' onClick={handleSubmit}>{(mode === 'new' || status === 'DRAFT') ? 'Create' : 'Update'} bid</Button>}
                {mode === 'view' && <BidSummaryDrawer open={isViewSummaryOpen} onOpenChange={setIsViewSummaryOpen} />}
            </div>
        </>
    )

}

export default StepperSaveButtons
