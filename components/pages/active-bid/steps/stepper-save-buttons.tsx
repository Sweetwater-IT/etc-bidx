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
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

interface Props {
    mode: 'view' | 'edit' | 'new'
    status: string
}


const StepperSaveButtons = ({ mode, status }: Props) => {

    const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns, ratesAcknowledged, notes, id } = useEstimate();

    const [openPdfDialog, setOpenPdfDialog] = useState(false);
    const [selectedPdfType, setSelectedPdfType] = useState<string>('estimators');
    const [openWorksheetPopover, setOpenWorksheetPopover] = useState(false);

    const [isViewSummaryOpen, setIsViewSummaryOpen] = useState<boolean>(false)

    const [initialSubmission, setInitialSubmisison] = useState<boolean>(false)

    const { startLoading, stopLoading } = useLoading()

    const router = useRouter()

    const params = useSearchParams();


    const handleSubmit = async () => {
        
        try {
            startLoading();
            
            let bidIdToUse = id;
            
            // If no ID is set (auto-save didn't work), create the bid first as draft
            if (!bidIdToUse) {
                console.log('⚠️ No bid ID - creating new draft bid...');
                
                try {
                    const draftResponse = await createActiveBid(
                        adminData, 
                        mptRental, 
                        equipmentRental, 
                        flagging ?? defaultFlaggingObject, 
                        serviceWork ?? defaultFlaggingObject, 
                        saleItems, 
                        permanentSigns ?? defaultPermanentSignsObject, 
                        'DRAFT', 
                        notes
                    );
                    bidIdToUse = draftResponse.id;
                    console.log('✅ Created draft bid with ID:', bidIdToUse);
                } catch (error) {
                    // If we get a duplicate contract number error, create a unique variation
                    if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
                        console.log('⚠️ Contract number already exists, creating unique variation...');
                        
                        // Create a unique variation by adding a suffix
                        const originalContractNumber = adminData.contractNumber;
                        const uniqueContractNumber = `${originalContractNumber}-${Date.now().toString().slice(-6)}`;
                        
                        console.log('📝 Using unique contract number:', uniqueContractNumber);
                        
                        const modifiedAdminData = {
                            ...adminData,
                            contractNumber: uniqueContractNumber
                        };
                        
                        const draftResponse = await createActiveBid(
                            modifiedAdminData, 
                            mptRental, 
                            equipmentRental, 
                            flagging ?? defaultFlaggingObject, 
                            serviceWork ?? defaultFlaggingObject, 
                            saleItems, 
                            permanentSigns ?? defaultPermanentSignsObject, 
                            'DRAFT', 
                            notes
                        );
                        bidIdToUse = draftResponse.id;
                        
                        // Update the admin data to use the new contract number for the final bid
                        adminData.contractNumber = uniqueContractNumber;
                        
                        console.log('✅ Created draft bid with unique contract number and ID:', bidIdToUse);
                    } else {
                        // Re-throw other errors
                        throw error;
                    }
                }
            }
            
            // Now update the bid to PENDING status
            const newBidId = await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject, 'PENDING', notes, bidIdToUse);
            toast.success(`Bid number ${adminData.contractNumber} successfully saved.`)
            stopLoading()
            
            // Get the original available job ID from the URL params to redirect back to jobs page
            const availableJobId = params.get('jobId');
            
            if (availableJobId) {
                // Redirect back to the available jobs page with the jobId parameter
                // This will trigger our job removal logic
                console.log('✅ Redirecting to jobs page with jobId:', availableJobId);
                router.replace(`/jobs/available?jobId=${availableJobId}`);
            } else {
                // Fallback: redirect to bid view if no jobId available
                const viewParams = new URLSearchParams();
                viewParams.append('bidId', newBidId.id.toString());
                viewParams.append('tuckSidebar', 'true');
                viewParams.append('fullscreen', 'true');
                viewParams.append('defaultEditable', 'false');
                router.replace(`/active-bid/view?${viewParams.toString()}`);
            }
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
                adminData={adminData}
                equipmentRental={equipmentRental}
                flagging={flagging}
            />
            <div className="flex gap-x-2">
                {/* Worksheet Dropdown Button */}
                {(mode === 'view' || initialSubmission) && <>
                    <Popover open={openWorksheetPopover} onOpenChange={setOpenWorksheetPopover}>
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
                <Button
                    variant="outline"
                    size='sm'
                    onClick={() => setIsViewSummaryOpen(true)}
                >
                    View Bid Summary
                </Button>
                {mode === 'view' && status !== 'WON' && status !== 'LOST' && <Button className='p-4' size='sm' onClick={() => router.push(`/active-bid/edit?${params?.toString()}`)}>Edit{status === 'DRAFT' ? ' Draft' : ' Bid'}</Button>}
                {mode !== 'view' && <Button disabled={!ratesAcknowledged} className='p-4' size='sm' onClick={handleSubmit}>{(mode === 'new' || status === 'DRAFT') ? 'Create' : 'Update'} bid</Button>}
                {mode === 'view' && <BidSummaryDrawer disableDiscounts={true} open={isViewSummaryOpen} onOpenChange={setIsViewSummaryOpen} />}
            </div>
        </>
    )

}

export default StepperSaveButtons
