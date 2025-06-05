'use client'

import { useEstimate } from '@/contexts/EstimateContext'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation';
import { fetchActiveBidByContractNumber } from '@/lib/api-client';
import { useLoading } from '@/hooks/use-loading';
import { Button } from '@/components/ui/button';


const AdminInfoViewOnly = () => {

    const searchParams = useSearchParams();
    const contractNumberFromParams = searchParams?.get('contractNumber')

    const { adminData, dispatch } = useEstimate();

    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        dispatch({ type: 'ADD_MPT_RENTAL' })
        dispatch({ type: 'ADD_FLAGGING' });
        dispatch({ type: 'ADD_SERVICE_WORK' })
        dispatch({ type: 'ADD_PERMANENT_SIGNS' })
    }, [dispatch])


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