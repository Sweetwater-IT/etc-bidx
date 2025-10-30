'use client'

import { useEstimate } from '@/contexts/EstimateContext'
import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ADDITIONAL_EQUIPMENT_OPTIONS, determineItemType, getDisplayName, InstallFlexibleDelineators, PostMountedInstall, PostMountedInstallTypeC, } from '@/types/TPermanentSigns';
import { getPermanentSignRevenueAndMargin, getPermSignDaysRequired, getPermSignTotalCost } from '@/lib/mptRentalHelperFunctions';
import PhasesViewOnly from './phases-view-only';
import SignsViewOnly from './signs-view-only';
import TripAndLaborViewOnlyAll from './trip-and-labor-view-only';
import { LegacyColumn, EquipmentRentalTableData } from '@/types/LegacyColumn'
import { DataTableBid } from './DataTableBid';

const SALE_ITEMS_COLUMNS = [
    { key: 'itemNumber', title: 'Item Number' },
    { key: 'name', title: 'Item Display Name' },
    { key: 'quantity', title: 'Quantity' },
    { key: 'salePrice', title: 'Sale Price' },
    { key: 'grossMargin', title: 'Gross Margin' },
];


// Mapping for equipment labels
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
        if (!value && value !== 0) return "-";
        return `$${value.toFixed(2)}`;
    };

    const getTotalHours = () => {
        if (!flagging || !adminData) return 0;
        return (flagging.onSiteJobHours || 0) + Math.ceil(((adminData.owTravelTimeMins || 0) * 2) / 60);
    };

    const getPrevailingWage = () => {
        if (!adminData?.county) return 0;
        return (adminData.county.laborRate || 0) + (adminData.county.fringeRate || 0);
    };

    const getHourlyRate = () => {
        if (!flagging) return 0;
        const totalHours = getTotalHours();
        const personnel = flagging.personnel || 1;
        if (totalHours === 0 || personnel === 0) return 0;
        return flagging.standardLumpSum / (totalHours * personnel);
    };

    const columns = [
        {
            key: 'grossMarginTarget',
            header: 'Gross Margin Target',
            render: () => flagging?.markupRate ? `${flagging.markupRate}%` : '-'
        },
        {
            key: 'lumpSum',
            header: 'Lump Sum',
            render: () => formatCurrency(flagging?.standardLumpSum)
        },
        {
            key: 'hourlyRate',
            header: 'Hourly Rate/Man',
            render: () => formatCurrency(getHourlyRate())
        },
        {
            key: 'prevailingWage',
            header: 'Prevailing Wage',
            render: () => formatCurrency(getPrevailingWage())
        },
        {
            key: 'personnel',
            header: 'Personnel',
            render: () => flagging?.personnel || '-'
        },
        {
            key: 'trucks',
            header: 'Trucks',
            render: () => flagging?.numberTrucks || '-'
        },
        {
            key: 'hoursOnSite',
            header: 'Hours on Site',
            render: () => flagging?.onSiteJobHours || '-'
        },
        {
            key: 'overtimeHours',
            header: 'Overtime Hours',
            render: () => getTotalHours()
        }
    ];

    const data = [flagging || {}];

    return <DataTableBid columns={columns} data={data} />;
};


export const ServiceWorkViewOnly = () => {
    const { adminData, serviceWork } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value && value !== 0) return "-";
        return `$${value.toFixed(2)}`;
    };

    const getTotalHours = () => {
        if (!serviceWork || !adminData) return 0;
        return (serviceWork.onSiteJobHours || 0) + Math.ceil(((adminData.owTravelTimeMins || 0) * 2) / 60);
    };

    const getTotalPrevailingWage = () => {
        if (!adminData?.county) return 0;
        return (adminData.county.laborRate || 0) + (adminData.county.fringeRate || 0);
    };

    const getTotalCost = () => {
        if (!serviceWork) return 0;
        const arrowBoardsCost = (serviceWork?.arrowBoards.quantity || 0) * (serviceWork.arrowBoards.cost || 0);
        const messageBoardsCost = (serviceWork?.messageBoards.quantity || 0) * (serviceWork.messageBoards.cost || 0);
        const tmaCost = (serviceWork?.TMA.quantity || 0) * (serviceWork.TMA.cost || 0);
        return arrowBoardsCost + messageBoardsCost + tmaCost + (serviceWork.additionalEquipmentCost || 0);
    };

    const columns = [
        {
            key: 'grossMarginTarget',
            header: 'Gross Margin Target',
            render: () => serviceWork?.markupRate ? `${serviceWork.markupRate}%` : "-",
        },
        {
            key: 'lumpSum',
            header: 'Lump Sum',
            render: () => formatCurrency(serviceWork?.standardLumpSum),
        },
        {
            key: 'hourlyRate',
            header: 'Hourly Rate/Man',
            render: () => {
                const totalHours = getTotalHours();
                const personnel = serviceWork?.personnel || 1;
                const totalCost = getTotalCost();
                return totalHours ? formatCurrency(totalCost / (totalHours * personnel)) : "-";
            },
        },
        {
            key: 'prevailingWage',
            header: 'Prevailing Wage',
            render: () => formatCurrency(getTotalPrevailingWage()),
        },
        {
            key: 'personnel',
            header: 'Personnel',
            render: () => serviceWork?.personnel || "-",
        },
        {
            key: 'trucks',
            header: 'Trucks',
            render: () => serviceWork?.numberTrucks || "-",
        },
        {
            key: 'hoursOnSite',
            header: 'Hours on Site',
            render: () => serviceWork?.onSiteJobHours || "-",
        },
        {
            key: 'overtimeHours',
            header: 'Overtime Hours',
            render: () => getTotalHours(),
        },
    ];

    const data = [serviceWork || {}];

    return <DataTableBid columns={columns} data={data} />;
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

const SaleItemsViewOnly = () => {
    const { saleItems } = useEstimate();

    const formatCurrency = (value: number | null | undefined): string => {
        if (value == null || isNaN(value)) return "-";
        return `$${value.toFixed(2)}`;
    };

    const SALE_ITEMS_COLUMNS = [
        { key: "item_number", header: "Item Number" },
        { key: "name", header: "Item Name" },
        { key: "quantity", header: "Quantity" },
        { key: "salePrice", header: "Sale Price" },
        { key: "grossMargin", header: "Gross Margin" },
    ];

    const transformSaleItems = (saleItems: any[]) => {
        return saleItems.map((item) => {
            const quantity = Number(item.quantity) || 0;
            const revenue = Number(item.revenue) || 0;
            const totalCost = Number(item.totalCost) || 0;

            const salePrice = quantity ? revenue / quantity : 0;
            const grossMargin = revenue ? ((revenue - totalCost) / revenue) * 100 : 0;

            return {
                id: item.item_number,
                item_number: item.item_number || "-",
                name: item.name || "-",
                quantity,
                salePrice: formatCurrency(salePrice),
                grossMargin: `${grossMargin.toFixed(2)}%`,
            };
        });
    };

    return (
        <div>
            {saleItems && saleItems.length > 0 ? (
                <div className="w-full">
                    <DataTableBid
                        columns={SALE_ITEMS_COLUMNS}
                        data={transformSaleItems(saleItems)}
                        onRowClick={(item) => console.log("Sale Item clicked:", item)}
                    />
                </div>
            ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No sale items configured
                </div>
            )}
        </div>
    );
};



export const PermanentSignsViewOnly = () => {
    const { permanentSigns, adminData, mptRental } = useEstimate()

    const formatCurrency = (value: number | null | undefined): string => {
        if (!value && value !== 0) return '-'
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatNumber = (value: number | null | undefined): string => {
        if (!value && value !== 0) return '-'
        return value.toString()
    }

    if (!permanentSigns || permanentSigns.signItems.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No permanent signs configured
            </div>
        )
    }

    const columns = [
        {
            key: 'itemName',
            header: 'Item Name',
            render: (row: any) => getDisplayName(determineItemType(row)),
        },
        {
            key: 'itemNumber',
            header: 'Item Number',
            render: (row: any) => row.itemNumber || '-',
        },
        {
            key: 'totalRevenue',
            header: 'Total Revenue',
            render: (row: any) =>
                formatCurrency(getPermanentSignRevenueAndMargin(permanentSigns, row, adminData, mptRental).revenue),
        },
        {
            key: 'totalCost',
            header: 'Total Cost',
            render: (row: any) =>
                formatCurrency(getPermSignTotalCost(determineItemType(row), permanentSigns, row, adminData, mptRental)),
        },
        {
            key: 'grossMargin',
            header: 'Gross Margin',
            render: (row: any) => {
                const gm = getPermanentSignRevenueAndMargin(permanentSigns, row, adminData, mptRental).grossMargin
                return (!gm && gm !== 0) || isNaN(gm) ? 'N/A' : `${(gm * 100).toFixed(2)}%`
            },
        },
        {
            key: 'squareFootage',
            header: 'Square Footage',
            render: (row: any) => {
                const type = determineItemType(row)
                return type === 'pmsTypeB' || type === 'pmsTypeC' || type === 'pmsTypeF'
                    ? formatNumber((row as PostMountedInstall | PostMountedInstallTypeC).signSqFootage)
                    : '-'
            },
        },
        {
            key: 'signCostSqft',
            header: 'Sign Cost/Sqft',
            render: (row: any) => {
                const type = determineItemType(row)
                if (!(type === 'pmsTypeB' || type === 'pmsTypeC' || type === 'pmsTypeF')) return '-'
                const cost = getPermSignTotalCost(type, permanentSigns, row, adminData, mptRental)
                const sqft = (row as PostMountedInstall | PostMountedInstallTypeC).signSqFootage
                return sqft ? formatCurrency(cost / sqft) : '-'
            },
        },
        {
            key: 'signPriceSqft',
            header: 'Sign Price/Sqft',
            render: (row: any) => {
                const type = determineItemType(row)
                if (!(type === 'pmsTypeB' || type === 'pmsTypeC' || type === 'pmsTypeF')) return '-'
                const revenue = getPermanentSignRevenueAndMargin(permanentSigns, row, adminData, mptRental).revenue
                const sqft = (row as PostMountedInstall | PostMountedInstallTypeC).signSqFootage
                return sqft ? formatCurrency(revenue / sqft) : '-'
            },
        },
    ]

    const data = permanentSigns.signItems || []

    return <DataTableBid columns={columns} data={data} />
}

const BidItemsViewOnly = () => {
    const [activeTab, setActiveTab] = useState("mpt");
    const [equipmentData, setEquipmentData] = useState<EquipmentRentalTableData[]>([]);
    const [loading, setLoading] = useState(false);
    const { equipmentRental, flagging, serviceWork, permanentSigns, saleItems } = useEstimate();

    const EQUIPMENT_COLUMNS = [
        { key: 'item_number', header: 'Item Number', className: 'text-left' },
        { key: 'name', header: 'Equipment', className: 'text-left' },
        { key: 'quantity', header: 'Quantity', className: 'text-left' },
        { key: 'uom', header: 'UOM', className: 'text-left' },
        { key: 'uom_type', header: 'Type UOM', className: 'text-left' },
        { key: 'rentPrice', header: 'Rent Price', className: 'text-left' },
        { key: 'reRentPrice', header: 'Re-rent Price', className: 'text-left' },
    ];

    const calculateTotal = (item: any): number => {
        const monthlyTotal = (item.quantity || 0) * (item.months || 0) * (item.rentPrice || 0);
        const reRentTotal = item.reRentForCurrentJob ? (item.quantity || 0) * (item.reRentPrice || 0) : 0;
        return monthlyTotal + reRentTotal;
    };

    const transformEquipmentData = (equipmentRental: any[]): EquipmentRentalTableData[] => {
        return equipmentRental.map(item => ({
            item_number: item.item_number,
            id: item.id || null,
            name: item.name || '-',
            uom: item.uom || '-',
            uom_type: item.uom_type || '-',
            quantity: item.quantity || null,
            months: item.months || null,
            rentPrice: item.rentPrice || null,
            reRentPrice: item.reRentPrice || null,
            reRentForCurrentJob: item.reRentForCurrentJob ? 'Yes' : 'No',
            totalCost: calculateTotal(item) || null,
            equipmentCost: item.totalCost || null,
            usefulLifeYrs: item.usefulLifeYrs || null
        }));
    };

    useEffect(() => {
        if (equipmentRental && equipmentRental.length > 0) {
            const transformedData = transformEquipmentData(equipmentRental);
            setEquipmentData(transformedData);
        } else {
            setEquipmentData([]);
        }
    }, [equipmentRental]);

    return (
        <div className="space-y-10 px-6">

            {/* MPT */}
            <section>
                <div className="text-xl font-semibold mb-4 mt-6">Phases</div>
                <PhasesViewOnly />
            </section>

            {/* Sale Items */}
            {
                saleItems.length > 0 &&
                <section className='w-full' >
                    <div className="text-xl font-semibold mb-4">Sale Items</div>
                    <SaleItemsViewOnly />
                </section>
            }

            {/* Equipment Rental */}
            {
                equipmentData.length > 0 &&
                <section>
                    <div className="text-xl font-semibold mb-4">Equipment Rental</div>
                    {equipmentData.length > 0 ? (
                        <div className="w-full">
                            <DataTableBid
                                columns={EQUIPMENT_COLUMNS}
                                data={equipmentData}
                                onRowClick={(item) => console.log("Equipment clicked:", item)}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            No equipment rental items configured
                        </div>
                    )}
                </section>
            }

            {/* Permanent Signs */}
            {
                permanentSigns && permanentSigns.signItems.length > 0 &&
                <section className='w-full'>
                    <div className="text-xl font-semibold mb-4">Permanent Signs</div>
                    <PermanentSignsViewOnly />
                </section>

            }

            {flagging && (
                (flagging.personnel > 0 ||
                    flagging.numberTrucks > 0 ||
                    flagging.onSiteJobHours > 0 ||
                    flagging.arrowBoards?.quantity > 0 ||
                    flagging.messageBoards?.quantity > 0 ||
                    flagging.TMA?.quantity > 0) && (
                    <section className='w-full'>
                        <div className="text-xl font-semibold mb-4">Flagging</div>
                        <FlaggingViewOnly />
                    </section>
                ))}

            {serviceWork && Object.keys(serviceWork).length > 0 && (
                <section className='w-full' >
                    <div className="text-xl font-semibold mb-4">Patterns</div>
                    <ServiceWorkViewOnly />
                </section>
            )}

        </div>
    );
};

export default BidItemsViewOnly