'use client'

import { useEstimate } from '@/contexts/EstimateContext'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation';
import { fetchActiveBidByContractNumber } from '@/lib/api-client';
import { useLoading } from '@/hooks/use-loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Customer } from '@/types/Customer';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';
import { toast } from 'sonner';

const SUBCONTRACTOR_OPTIONS = [
    { name: "ETC", id: 1 },
    { name: "ATLAS", id: 2 },
    { name: "ROADSAFE", id: 3 },
    { name: "RAE-LYNN", id: 4 },
    { name: "UNKNOWN", id: 5 },
    { name: "THER", id: 6 },
];

const AdminInfoViewOnly = () => {

    const searchParams = useSearchParams();
    const contractNumberFromParams = searchParams?.get('contractNumber')

    const [selectedContractor, setSelectedContractor] = useState<Customer>();
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<{ name: string, id: number }>()
    const [openStates, setOpenStates] = useState({
        contractor: false,
        subContractor: false
    });

    const { customers, getCustomers } = useCustomers()

    useEffect(() => {
        getCustomers();
    }, [getCustomers])

    const { adminData, dispatch } = useEstimate();

    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        dispatch({ type: 'ADD_MPT_RENTAL' })
        dispatch({ type: 'ADD_FLAGGING' });
        dispatch({ type: 'ADD_SERVICE_WORK' })
        dispatch({ type: 'ADD_PERMANENT_SIGNS' })
    }, [dispatch])

    // Add this to your AdminInfoViewOnly component

    useEffect(() => {
        const fetchContractors = async () => {
            if (!contractNumberFromParams) return;

            try {
                const response = await fetch(`/api/active-bids/update-contractors/${contractNumberFromParams}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        // Find and set the contractor
                        if (result.data.contractor_id) {
                            const contractor = customers.find(c => c.id === result.data.contractor_id);
                            if (contractor) {
                                setSelectedContractor(contractor);
                            }
                        }

                        // Find and set the subcontractor
                        if (result.data.subcontractor_id) {
                            const subcontractor = SUBCONTRACTOR_OPTIONS.find(s => s.id === result.data.subcontractor_id);
                            if (subcontractor) {
                                setSelectedSubcontractor(subcontractor);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching contractors:', error);
            }
        };

        // Only fetch after customers are loaded
        if (customers.length > 0 && contractNumberFromParams) {
            fetchContractors();
        }
    }, [customers, contractNumberFromParams]);

    const handleSaveContractors = async () => {
        if (!selectedContractor && !selectedSubcontractor) return;

        const body: any = {};
        if (selectedContractor) body.contractor_id = selectedContractor.id;
        if (selectedSubcontractor) body.subcontractor_id = selectedSubcontractor.id;

        try {
            const response = await fetch('/api/active-bids/update-contractors/' + contractNumberFromParams, {
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
            }
        } catch (error) {
            console.error('Error updating contractors:', error);
            toast.error('Failed to save contractors');
        }
    }


    useEffect(() => {
        const fetchData = async () => {
            startLoading();
            if (contractNumberFromParams) {
                const data = await fetchActiveBidByContractNumber(contractNumberFromParams);
                //estimate-view is not completley accurate yet, but eventually we could pass the whole down
                //to one reducer functio nand update all the state at once
                dispatch({ type: 'COPY_ADMIN_DATA', payload: data.admin_data as any });
                dispatch({ type: 'COPY_MPT_RENTAL', payload: data.mpt_rental as any });
                dispatch({ type: 'COPY_EQUIPMENT_RENTAL', payload: data.equipment_rental as any });
                dispatch({ type: 'COPY_FLAGGING', payload: data.flagging as any });
                dispatch({ type: 'COPY_SERVICE_WORK', payload: data.service_work as any });
                dispatch({ type: 'COPY_SALE_ITEMS', payload: data.sale_items as any })
            }
            stopLoading();
        }

        fetchData();
    }, [dispatch])


    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return "-";
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toLocaleDateString();
        } catch {
            return "-";
        }
    };

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
            <div className="flex flex-col col-span-3">
                <label className="text-sm font-semibold">
                    Contract Number
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.contractNumber || "-"}
                </div>
            </div>
            <div className='flex flex-col'>
                <label className="text-sm font-semibold">
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
                            {selectedContractor?.name ||
                                selectedContractor?.displayName ||
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
                                        value={customer.id.toString()}
                                        onSelect={(e) => setSelectedContractor(customers.find(c => c.id.toString() === e))}
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
            <div className='flex flex-col'>
                <label className="text-sm font-semibold">
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
                                        onSelect={(name) => setSelectedSubcontractor(SUBCONTRACTOR_OPTIONS.find(sub => sub.name === name))}
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

            <div className="flex flex-col items-ends justify-end">
                <Button onClick={handleSaveContractors} className='w-[90%] px-2'>
                    Save contractor/subcontractor
                </Button>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Estimator
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.estimator || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Owner
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.owner || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    County
                </label>
                <div className="pr-3 py-1 text-muted-foreground select-text cursor-default">
                    {adminData.county?.name || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Township
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.location || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Division
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.division || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Letting Date
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatDate(adminData.lettingDate)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Start Date
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatDate(adminData.startDate)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    End Date
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatDate(adminData.endDate)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    SR Route
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.srRoute || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    DBE %
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.dbe ? `${adminData.dbe}%` : "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Work Type
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.rated || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    One Way Travel Time (Mins)
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.owTravelTimeMins || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    One Way Mileage
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.owMileage || "-"}
                </div>
            </div>

            <div className="flex flex-col col-span-2">
                <label className="text-sm font-semibold">
                    Diesel Cost Per Gallon
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(adminData.fuelCostPerGallon)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Labor Rate
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(adminData.county?.laborRate)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Fringe Rate
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(adminData.county?.fringeRate)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Shop Rate
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(adminData.county?.shopRate)}
                </div>
            </div>

            {(adminData.winterStart || adminData.winterEnd) && (
                <>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold">
                            Winter Start Date
                        </label>
                        <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                            {formatDate(adminData.winterStart)}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-semibold">
                            Winter End Date
                        </label>
                        <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                            {formatDate(adminData.winterEnd)}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminInfoViewOnly