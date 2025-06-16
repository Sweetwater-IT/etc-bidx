'use client'
import React, { useEffect, useState } from 'react'
import AdminInfoViewOnly from './admin-info-view-only'
import PhasesViewOnly from './phases-view-only'
import SignsViewOnly from './signs-view-only'
import TripAndLaborViewOnlyAll from './trip-and-labor-view-only'
import BidItemsViewOnly from './bid-items-view-only'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone'
import { useFileUpload } from '@/hooks/use-file-upload'
import { toast } from 'sonner'
import { useCustomers } from '@/hooks/use-customers'
import { Customer } from '@/types/Customer'
import { useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DialogTitle } from '@radix-ui/react-dialog'
import FileViewingContainer from '@/components/file-viewing-container'
import { fetchFileMetadataByFolder, fetchFilesByAssociation } from '@/lib/api-client'
import { FileMetadata } from '@/types/FileTypes'

const SUBCONTRACTOR_OPTIONS = [
    { name: "ETC", id: 1 },
    { name: "ATLAS", id: 2 },
    { name: "ROADSAFE", id: 3 },
    { name: "RAE-LYNN", id: 4 },
    { name: "UNKNOWN", id: 5 },
    { name: "THER", id: 6 },
];

const BidViewOnlyContainer = () => {

    const searchParams = useSearchParams();
    const bidId = searchParams?.get('bidId')
    const [localNotes, setLocalNotes] = useState<string>('')
    const [savedNotes, setSavedNotes] = useState<string>('')
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false)
    const [contractor, setContractor] = useState<Customer>();
    const [files, setFiles] = useState<FileMetadata[]>([])
    const [subcontractor, setSubcontractor] = useState<{ name: string, id: number }>()
    const [selectedContractor, setSelectedContractor] = useState<Customer>();
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<{ name: string, id: number }>()
    const [openStates, setOpenStates] = useState({
        contractor: false,
        subContractor: false
    });
    const [contractorsModalOpen, setContractorsModalOpen] = useState<boolean>(false);

    const { customers, getCustomers } = useCustomers()

    useEffect(() => {
        getCustomers();
    }, [getCustomers])

    const getFiles = async () => {
        const fileResponse = await fetchFileMetadataByFolder(Number(bidId), 'bid_estimates');
        if (fileResponse.success) {
            setFiles(fileResponse.files)
        } else {
            toast.error("Couldn't fetch files for this bid: " + fileResponse.error)
        }
    }

    // Fetch bid data including notes
    useEffect(() => {
        const fetchBidData = async () => {
            if (!bidId) return;

            try {
                const response = await fetch(`/api/active-bids/${bidId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const notes = result.data.notes || '';
                        setLocalNotes(notes);
                        setSavedNotes(notes);
                    }
                }
            } catch (error) {
                console.error('Error fetching bid data:', error);
            }
        };

        fetchBidData();
    }, [bidId]);

    const handleSaveNotes = async () => {
        if (!bidId) return;

        setIsSavingNotes(true);
        try {
            const response = await fetch(`/api/active-bids/${bidId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes: localNotes })
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to save notes');
            } else {
                const result = await response.json();
                toast.success('Notes saved successfully');
                setSavedNotes(localNotes);
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            toast.error('Failed to save notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const fileUploadProps = useFileUpload({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5, // Allow multiple files to be uploaded
        uniqueIdentifier: bidId ? Number(bidId) : undefined,
        folder: 'bid_estimates',
        apiEndpoint: '/api/files',
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'application/zip': ['.zip'],
            'text/plain': ['.txt'],
            'text/csv': ['.csv']
        },
        onSuccess: getFiles
    });

    useEffect(() => {
        getFiles();
    }, [])

    useEffect(() => {
        const fetchContractors = async () => {
            if (!bidId) return;

            try {
                const response = await fetch(`/api/active-bids/update-contractors/${bidId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        // Find and set the contractor
                        if (result.data.contractor_id) {
                            const contr = customers.find(c => c.id === result.data.contractor_id);
                            if (contr) {
                                setContractor(contr)
                                setSelectedContractor(contr);
                            }
                        }

                        // Find and set the subcontractor
                        if (result.data.subcontractor_id) {
                            const sub = SUBCONTRACTOR_OPTIONS.find(s => s.id === result.data.subcontractor_id);
                            if (sub) {
                                setSubcontractor(sub)
                                setSelectedSubcontractor(sub);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching contractors:', error);
            }
        };

        // Only fetch after customers are loaded
        if (customers.length > 0 && bidId) {
            fetchContractors();
        }
    }, [customers, bidId]);

    const handleSaveContractors = async () => {
        if (!selectedContractor && !selectedSubcontractor) return;

        const body: any = {};
        if (selectedContractor) body.contractor_id = selectedContractor.id;
        if (selectedSubcontractor) body.subcontractor_id = selectedSubcontractor.id;

        try {
            const response = await fetch('/api/active-bids/update-contractors/' + bidId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to save contractors');
            } else {
                const result = await response.json();
                toast.success(result.message || 'Successfully updated contractors');
                setContractor(selectedContractor)
                setSubcontractor(selectedSubcontractor)
                setContractorsModalOpen(false)
            }
        } catch (error) {
            console.error('Error updating contractors:', error);
            toast.error('Failed to save contractors');
        }
    }

    // Check if notes have changed
    const hasUnsavedChanges = localNotes !== savedNotes;

    return (
        <>
            <Dialog open={contractorsModalOpen} onOpenChange={setContractorsModalOpen}>
                <DialogTitle className='hidden'>Set contractor and subcontractor</DialogTitle>
                <DialogContent className='p-8'>
                    <div className='flex gap-4 w-full'>
                        <div className='flex flex-col w-1/2'>
                            <label className="text-sm mb-2 font-semibold">
                                Contractor
                            </label>
                            <Popover
                                open={openStates.contractor}
                                modal={true}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, contractor: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className='flex justify-between'
                                    >
                                        {selectedContractor?.displayName ||
                                            selectedContractor?.name ||
                                            "Select contractor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search contractor..." />
                                        <CommandEmpty>No contractor found.</CommandEmpty>
                                        <CommandGroup className="overflow-y-auto max-h-80">
                                            {customers.map((customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    value={customer.name}
                                                    onSelect={(e) => {
                                                        setSelectedContractor(customers.find(c => c.name === e))
                                                        setOpenStates(prev => ({ ...prev, contractor: false }))
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedContractor?.id === customer.id
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {customer.displayName}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className='flex flex-col w-1/2'>
                            <label className="text-sm font-semibold mb-2">
                                Subcontractor
                            </label>
                            <Popover open={openStates.subContractor} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, subContractor: open }))}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {selectedSubcontractor ? selectedSubcontractor.name : "Select subcontractor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search subcontractor..." />
                                        <CommandEmpty>No subcontractor found.</CommandEmpty>
                                        <CommandGroup>
                                            {SUBCONTRACTOR_OPTIONS.map((option) => (
                                                <CommandItem
                                                    key={option.id}
                                                    value={option.name}
                                                    onSelect={(name) => {
                                                        setSelectedSubcontractor(SUBCONTRACTOR_OPTIONS.find(sub => sub.name === name))
                                                        setOpenStates(prev => ({ ...prev, subContractor: false }))
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedSubcontractor === option
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {option.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="flex flex-col items-ends justify-end">
                        <Button onClick={handleSaveContractors} className='ml-auto w-1/3 px-2'>
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className='flex pr-6'>
                <div className='w-3/4'>
                    <div className="text-xl font-semibold pl-6 mb-4">Admin Information</div>
                    <AdminInfoViewOnly />
                    <div className="text-xl font-semibold pl-6 mb-4 mt-6">Phases</div>
                    <PhasesViewOnly />
                    <div className="text-xl font-semibold pl-6 mb-4 mt-8">Signs</div>
                    <SignsViewOnly />
                    <div className="text-xl font-semibold pl-6 mb-4 mt-8">Trip and Labor</div>
                    <TripAndLaborViewOnlyAll />
                    <div className="text-xl font-semibold pl-6 mb-4 mt-8">Bid Items</div>
                    <BidItemsViewOnly />
                </div>
                <div className="w-1/4 space-y-4 pl-4 border-l">
                    <div className="flex flex-col space-y-2 rounded-lg border p-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-4 w-8 p-0 ml-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[200]">
                                <DropdownMenuItem
                                    onClick={(e) => setContractorsModalOpen(true)}
                                >
                                    Edit contractor/subcontractor
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="text-sm">
                            Contractor: <span className="font-medium">{contractor ? (contractor.displayName || contractor.name) : '-'}</span>
                        </div>
                        <div className="text-sm">
                            Subcontractor: <span className="font-medium">{subcontractor ? subcontractor.name : '-'}</span>
                        </div>
                    </div>
                    <div className="rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-semibold">Notes</h2>
                        <div className="space-y-4">
                            <div className="text-sm text-wrap wrap-break-word text-muted-foreground">
                                {savedNotes === '' ? 'No notes for this bid' : 'Current notes:'}
                            </div>
                            {savedNotes && (
                                <div className="text-sm p-3 bg-muted rounded border">
                                    {savedNotes}
                                </div>
                            )}
                            <Textarea
                                placeholder="Add notes here..."
                                rows={5}
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                            />
                            <Button 
                                className="w-full" 
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes || !hasUnsavedChanges}
                            >
                                {isSavingNotes ? 'Saving...' : hasUnsavedChanges ? 'Save Notes' : 'No Changes'}
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-semibold">Files</h2>
                        <FileViewingContainer files={files} onFilesChange={setFiles} />
                        <Dropzone
                            {...fileUploadProps}
                        >
                            <DropzoneContent />
                            <DropzoneEmptyState />
                        </Dropzone>
                    </div>
                </div>
            </div>
        </>
    )
}

export default BidViewOnlyContainer