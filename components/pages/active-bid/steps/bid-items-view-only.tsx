'use client'

import { useEstimate } from '@/contexts/EstimateContext'
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mapping for equipment labels
const labelMapping: Record<string, string> = {
    fourFootTypeIII: "Four Foot Type III",
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
    sharps: "Sharps"
};

// Standard equipment list
const standardEquipmentList = [
    "fourFootTypeIII",
    "hStand",
    "post",
    "sixFootWings",
    "metalStands",
    "covers",
    "sandbag"
];

// Light and drum list
const lightAndDrumList = [
    "HIVP",
    "TypeXIVP",
    "BLights",
    "ACLights",
    "sharps"
];

const formatLabel = (key: string) => {
    return labelMapping[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

const FlaggingViewOnly = () => {
    const { adminData, flagging } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    const getTotalHours = () => {
        if (!flagging || !adminData) return 0;
        return (flagging.onSiteJobHours || 0) + Math.ceil(((adminData.owTravelTimeMins || 0) * 2) / 60);
    };

    const getEquipCost = () => {
        if (!flagging) return 0;
        
        const arrowBoardsCost = (flagging?.arrowBoards.quantity || 0) * (flagging.arrowBoards.cost || 0);
        const messageBoardsCost = (flagging?.messageBoards.quantity || 0) * (flagging.messageBoards.cost || 0);
        const tmaCost = (flagging?.TMA.quantity || 0) * (flagging.TMA.cost || 0);

        return arrowBoardsCost + messageBoardsCost + tmaCost;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Standard Pricing
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {flagging?.standardPricing ? 'Yes' : 'No'}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Rate Type
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.rated || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Gas Cost Per Gallon
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(flagging?.fuelCostPerGallon)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Personnel
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {flagging?.personnel || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Number of Trucks
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {flagging?.numberTrucks || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    One-Way Miles
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData?.owMileage || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Arrow Boards
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {flagging?.arrowBoards.quantity || 0} | Cost: {formatCurrency(flagging?.arrowBoards.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Message Boards
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {flagging?.messageBoards.quantity || 0} | Cost: {formatCurrency(flagging?.messageBoards.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    TMA
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {flagging?.TMA.quantity || 0} | Cost: {formatCurrency(flagging?.TMA.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    On Site Job Hours
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {flagging?.onSiteJobHours || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Total Hours
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {getTotalHours()}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Markup Rate
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {flagging?.markupRate ? `${flagging.markupRate}%` : "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Total Equipment Revenue
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(getEquipCost())}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Additional Costs
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(flagging?.additionalEquipmentCost)}
                </div>
            </div>
        </div>
    );
};

const ServiceWorkViewOnly = () => {
    const { adminData, serviceWork } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    const getTotalHours = () => {
        if (!serviceWork || !adminData) return 0;
        return (serviceWork.onSiteJobHours || 0) + Math.ceil(((adminData.owTravelTimeMins || 0) * 2) / 60);
    };

    const getEquipCost = () => {
        if (!serviceWork) return 0;
        
        const arrowBoardsCost = (serviceWork?.arrowBoards.quantity || 0) * (serviceWork.arrowBoards.cost || 0);
        const messageBoardsCost = (serviceWork?.messageBoards.quantity || 0) * (serviceWork.messageBoards.cost || 0);
        const tmaCost = (serviceWork?.TMA.quantity || 0) * (serviceWork.TMA.cost || 0);

        return arrowBoardsCost + messageBoardsCost + tmaCost;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 mb-4 pb-4">
            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Rate Type
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData.rated || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Gas Cost Per Gallon
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(serviceWork?.fuelCostPerGallon)}
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

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Personnel
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {serviceWork?.personnel || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Number of Trucks
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {serviceWork?.numberTrucks || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    One-Way Miles
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {adminData?.owMileage || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Arrow Boards
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {serviceWork?.arrowBoards.quantity || 0} | Cost: {formatCurrency(serviceWork?.arrowBoards.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Message Boards
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {serviceWork?.messageBoards.quantity || 0} | Cost: {formatCurrency(serviceWork?.messageBoards.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    TMA
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    Qty: {serviceWork?.TMA.quantity || 0} | Cost: {formatCurrency(serviceWork?.TMA.cost)}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    On Site Job Hours
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {serviceWork?.onSiteJobHours || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Total Hours
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {getTotalHours()}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Markup Rate
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {serviceWork?.markupRate ? `${serviceWork.markupRate}%` : "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Total Equipment Revenue
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(getEquipCost())}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Additional Costs
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {formatCurrency(serviceWork?.additionalEquipmentCost)}
                </div>
            </div>
        </div>
    );
};

const MPTViewOnly = () => {
    const { mptRental, adminData } = useEstimate();

    const phases = mptRental?.phases || [];

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="space-y-8">
            {phases.map((phase, phaseIndex) => (
                <div key={phaseIndex} className="border-b border-border pb-6 last:border-b-0">
                    {/* Phase Header */}
                    <div className="mb-6 pl-6">
                        <label className="text-sm font-semibold mb-2">
                            {phase.name || `Phase ${phaseIndex + 1}`}
                        </label>
                    </div>

                    {/* MPT Equipment Section */}
                    <div className="mb-8">
                        <h4 className="text-base font-semibold mb-4 pl-6">MPT Equipment</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
                            {standardEquipmentList.map((equipmentKey) => {
                                const quantity = phase.standardEquipment[equipmentKey]?.quantity || 0;
                                const price = mptRental?.staticEquipmentInfo?.[equipmentKey]?.price || 0;

                                return (
                                    <div key={equipmentKey} className="flex flex-col">
                                        <label className="text-sm font-semibold">
                                            {formatLabel(equipmentKey)}
                                        </label>
                                        <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                            Qty: {quantity} 
                                            {/* | Cost: {formatCurrency(price)} */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Light and Drum Rental Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold pl-6">Light and Drum Rental</h4>
                            {adminData?.emergencyJob && (
                                <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                                    Emergency Job
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
                            {lightAndDrumList.map((equipmentKey) => {
                                const quantity = phase.standardEquipment[equipmentKey]?.quantity || 0;
                                const price = mptRental?.staticEquipmentInfo?.[equipmentKey]?.price || 0;
                                const emergencyRate = adminData?.emergencyFields?.[`emergency${equipmentKey}`];

                                return (
                                    <div key={equipmentKey} className="flex flex-col">
                                        <label className="text-sm font-semibold">
                                            {formatLabel(equipmentKey)}
                                        </label>
                                        <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                            Qty: {quantity} 
                                            {/* | Cost: {formatCurrency(price)} */}
                                        </div>
                                        {adminData?.emergencyJob && emergencyRate && (
                                            <div className="pr-3 py-1 select-text cursor-default text-sm text-red-600">
                                                Emergency Rate: {formatCurrency(emergencyRate)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Equipment Section */}
                    {phase.customLightAndDrumItems && phase.customLightAndDrumItems.length > 0 && (
                        <div className="mb-8">
                            <h4 className="text-base font-semibold mb-4 pl-6">Custom Equipment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
                                {phase.customLightAndDrumItems.map((item) => (
                                    <div key={item.id} className="flex flex-col">
                                        <label className="text-sm font-semibold">
                                            {item.id}
                                        </label>
                                        <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                            Qty: {item.quantity} | Cost: {formatCurrency(item.cost)}
                                        </div>
                                        <div className="pr-3 py-1 select-text cursor-default text-sm text-muted-foreground">
                                            Useful Life: {item.usefulLife} days
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {phases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground pl-6">
                    No phases configured
                </div>
            )}
        </div>
    );
};

// Add these components to your BidItemsViewOnly file

const EquipmentRentalViewOnly = () => {
    const { equipmentRental } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    const calculateTotal = (item: any) => {
        const monthlyTotal = item.quantity * item.months * item.rentPrice;
        const reRentTotal = item.reRentForCurrentJob ? (item.quantity * item.reRentPrice) : 0;
        return monthlyTotal + reRentTotal;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
            {equipmentRental && equipmentRental.length > 0 ? (
                equipmentRental.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col col-span-3 border-b border-border pb-2 mb-2">
                            <label className="text-sm font-semibold">
                                {item.name}
                            </label>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Quantity
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.quantity || "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Months
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.months || "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Rent Price
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {formatCurrency(item.rentPrice)}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Re-Rent Cost
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {formatCurrency(item.reRentPrice)}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Re-Rent for Current Job
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.reRentForCurrentJob ? 'Yes' : 'No'}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Total Cost
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {formatCurrency(calculateTotal(item))}
                            </div>
                        </div>

                        {item.totalCost && (
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold">
                                    Equipment Cost
                                </label>
                                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                    {formatCurrency(item.totalCost)}
                                </div>
                            </div>
                        )}

                        {item.usefulLifeYrs && (
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold">
                                    Useful Life (Years)
                                </label>
                                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                    {item.usefulLifeYrs}
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))
            ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No equipment rental items configured
                </div>
            )}
        </div>
    );
};

const SaleItemsViewOnly = () => {
    const { saleItems } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return "-";
        return `$${value.toFixed(2)}`;
    };

    const calculateMargin = (quotePrice: number, markupPercentage: number) => {
        if (!quotePrice || !markupPercentage) return 0;
        const sellingPrice = quotePrice * (1 + markupPercentage / 100);
        return ((sellingPrice - quotePrice) / sellingPrice) * 100;
    };

    const calculateSellingPrice = (quotePrice: number, markupPercentage: number) => {
        if (!quotePrice || !markupPercentage) return quotePrice;
        return quotePrice * (1 + markupPercentage / 100);
    };

    const calculateTotal = (item: any) => {
        const sellingPrice = calculateSellingPrice(item.quotePrice, item.markupPercentage);
        return item.quantity * sellingPrice;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
            {saleItems && saleItems.length > 0 ? (
                saleItems.map((item, index) => (
                    <React.Fragment key={item.itemNumber}>
                        <div className="flex flex-col col-span-3 border-b border-border pb-2 mb-2">
                            <label className="text-sm font-semibold">
                                {item.itemNumber} - {item.name || 'Unnamed Item'}
                            </label>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Vendor
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.vendor || "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Quantity
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.quantity || "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Quote Price
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {formatCurrency(item.quotePrice)}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Markup Percentage
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.markupPercentage ? `${item.markupPercentage}%` : "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Margin
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {item.quotePrice && item.markupPercentage 
                                    ? `${calculateMargin(item.quotePrice, item.markupPercentage).toFixed(2)}%` 
                                    : "-"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Selling Price (per unit)
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                {formatCurrency(calculateSellingPrice(item.quotePrice, item.markupPercentage))}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold">
                                Total Revenue
                            </label>
                            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground font-medium">
                                {formatCurrency(calculateTotal(item))}
                            </div>
                        </div>
                    </React.Fragment>
                ))
            ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No sale items configured
                </div>
            )}
        </div>
    );
};

// Add this component to your BidItemsViewOnly file

const PermanentSignsViewOnly = () => {
    const { permanentSigns } = useEstimate();

    const PERMANENT_SIGN_ITEMS: Record<string, string> = {
        'pmsTypeB': 'Type B Post Mount',
        'resetTypeB': 'Reset Type B',
        'removeTypeB': 'Remove Type B',
        'pmsTypeF': 'Type F Post Mount',
        'resetTypeF': 'Reset Type F',
        'removeTypeF': 'Remove Type F'
    };

    // Helper function to determine the type based on properties
    const determineItemType = (item: any): string => {
        if ('signSqFt' in item && 'chevronBracket' in item && 'streetNameCrossBracket' in item) {
            return 'pmsTypeB';
        }
        if ('antiTheftBolts' in item && !('signSqFt' in item)) {
            return 'resetTypeB';
        }
        
        // For items with only basic properties, check the name pattern
        const keys = Object.keys(item);
        if (keys.length <= 4) {
            if (item.name?.includes('0935')) return 'pmsTypeF';
            if (item.name?.includes('0945')) return 'resetTypeF';
            if (item.name?.includes('0971')) return 'removeTypeB';
            if (item.name?.includes('0975')) return 'removeTypeF';
        }
        
        return 'pmsTypeF';
    };

    const getDisplayName = (itemType: string): string => {
        return PERMANENT_SIGN_ITEMS[itemType] || itemType;
    };

    const formatNumber = (value: number | null | undefined): string => {
        if (!value) return "-";
        return value.toString();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 pl-6">
            {/* General Settings */}
            <div className="flex flex-col col-span-3 border-b border-border pb-2 mb-4">
                <label className="text-sm font-semibold mb-2">
                    General Settings
                </label>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Separate Mobilization
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.separateMobilization ? 'Yes' : 'No'}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Trucks
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.trucks || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Personnel
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.personnel || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    OW Trips
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.OWtrips || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Type B Removal Rate (per man hour)
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.typeBRemovalRatePerManHour || "-"}
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold">
                    Installed Post Man Hours
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {permanentSigns?.installedPostManHours || "-"}
                </div>
            </div>

            {/* Sign Items */}
            {permanentSigns && permanentSigns.signItems && permanentSigns.signItems.length > 0 ? (
                permanentSigns.signItems.map((item, index) => {
                    const itemType = determineItemType(item);
                    const hasSignSqFt = 'signSqFt' in item;
                    const hasAntiTheftBolts = 'antiTheftBolts' in item;
                    const hasChevronBracket = 'chevronBracket' in item;
                    const hasStreetNameCrossBracket = 'streetNameCrossBracket' in item;

                    return (
                        <React.Fragment key={item.id}>
                            <div className="flex flex-col col-span-3 border-b border-border pb-2 mb-2 mt-4">
                                <label className="text-sm font-semibold">
                                    {getDisplayName(itemType)} - {item.name || 'Unnamed Item'}
                                </label>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-semibold">
                                    # of Installs
                                </label>
                                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                    {formatNumber(item.numberInstalls)}
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-semibold">
                                    Perm. Sign Bolts
                                </label>
                                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                    {formatNumber(item.permSignBolts)}
                                </div>
                            </div>

                            {hasSignSqFt && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold">
                                        Sign Sq. Ft.
                                    </label>
                                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                        {formatNumber((item as any).signSqFt)}
                                    </div>
                                </div>
                            )}

                            {hasAntiTheftBolts && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold">
                                        Anti-Theft Bolts
                                    </label>
                                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                        {formatNumber((item as any).antiTheftBolts)}
                                    </div>
                                </div>
                            )}

                            {hasChevronBracket && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold">
                                        Chevron Bracket
                                    </label>
                                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                        {formatNumber((item as any).chevronBracket)}
                                    </div>
                                </div>
                            )}

                            {hasStreetNameCrossBracket && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold">
                                        Street Name Cross Bracket
                                    </label>
                                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                                        {formatNumber((item as any).streetNameCrossBracket)}
                                    </div>
                                </div>
                            )}

                            {/* Fill remaining grid space if needed */}
                            {(!hasSignSqFt && !hasAntiTheftBolts && !hasChevronBracket && !hasStreetNameCrossBracket) && (
                                <div className="flex flex-col">
                                    {/* Empty space for grid alignment */}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })
            ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No permanent sign items configured
                </div>
            )}
        </div>
    );
};

const BidItemsViewOnly = () => {
    const [activeTab, setActiveTab] = useState("mpt");

    return (
        <div className="space-y-6 px-6">
            <Tabs
                defaultValue="mpt"
                className="w-full"
                onValueChange={setActiveTab}
                value={activeTab}
            >
                <TabsList className="w-full border-0 bg-transparent p-0 [&_>_*]:border-0">
                    <TabsTrigger
                        value="mpt"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        MPT
                    </TabsTrigger>
                    <TabsTrigger
                        value="equipment"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        Equipment Rental
                    </TabsTrigger>
                    <TabsTrigger
                        value="permanent"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        Permanent Signs
                    </TabsTrigger>
                    <TabsTrigger
                        value="flagging"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        Flagging
                    </TabsTrigger>
                    <TabsTrigger
                        value="sale"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        Sale Items
                    </TabsTrigger>
                    <TabsTrigger
                        value="patterns"
                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                    >
                        Patterns
                    </TabsTrigger>
                </TabsList>

                {/* MPT Tab */}
                <TabsContent value="mpt" className="mt-6">
                    <MPTViewOnly />
                </TabsContent>

                {/* Equipment Rental Tab */}
                <TabsContent value="equipment" className="mt-6">
                    <div className="text-center py-6 text-muted-foreground pl-6">
                        <EquipmentRentalViewOnly/>
                    </div>
                </TabsContent>

                {/* Permanent Signs Tab */}
                <TabsContent value="permanent" className="mt-6">
                    <div className="text-center py-6 text-muted-foreground pl-6">
                        <PermanentSignsViewOnly/>
                    </div>
                </TabsContent>

                {/* Flagging Tab */}
                <TabsContent value="flagging" className="mt-6">
                    <FlaggingViewOnly />
                </TabsContent>

                {/* Sale Items Tab */}
                <TabsContent value="sale" className="mt-6">
                    <div className="text-center py-6 text-muted-foreground pl-6">
                       <SaleItemsViewOnly/>
                    </div>
                </TabsContent>

                {/* Patterns/Service Work Tab */}
                <TabsContent value="patterns" className="mt-6">
                    <ServiceWorkViewOnly />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BidItemsViewOnly