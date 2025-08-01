'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { getAllTotals, getPermanentSignRevenueAndMargin, getPermanentSignsCostSummary, getPermSignTotalCost } from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { safeNumber } from '@/lib/safe-number'
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'
import { determineItemType } from '@/types/TPermanentSigns'
import { getDisplayName } from '@/types/TPermanentSigns'
import { formatCurrencyValue } from '@/lib/formatDecimals'

interface BasicSummaryTotals {
    totalCost: number, totalRevenue: number, totalGrossProfit: number, grossProfitMargin: number
}

const PermSignsRevenueAndProfit = () => {
    const { adminData, mptRental, equipmentRental, flagging, serviceWork, permanentSigns } = useEstimate()
    const [permSignItemTotals, setPermSignItemTotals] = useState<{
        totalCost: number
        totalRevenue: number
        grossProfit: number
        grossMargin: number
    } | null>(null)
    const [totalPermSignsStats, setTotalPermSignsStats] = React.useState<BasicSummaryTotals | null>(null);
    const [permSignItemRows, setPermSignItemRows] = useState<
        {
            name: string
            itemType: string
            revenue: number
            cost: number
            grossProfit: number
            grossMargin: number
        }[]
    >([])


    useEffect(() => {
        if (!permanentSigns || !mptRental || !adminData) {
            setTotalPermSignsStats(null);
            return;
        }

        const permSignsSummary = getPermanentSignsCostSummary(permanentSigns, adminData, mptRental);
        setTotalPermSignsStats({
            totalRevenue: permSignsSummary.totalRevenue,
            totalCost: permSignsSummary.totalCost,
            totalGrossProfit: permSignsSummary.totalRevenue - permSignsSummary.totalCost,
            grossProfitMargin: permSignsSummary.grossMargin
        })
    }, [permanentSigns, mptRental, adminData])

    const [allTotals, setAllTotals] = useState<{
        totalCost: number
        totalRevenue: number
        totalGrossProfit: number
        totalGrossMargin: number
    } | null>(null)

    useEffect(() => {
        if (!permanentSigns?.signItems || permanentSigns.signItems.length === 0) {
            setPermSignItemTotals({
                totalCost: 0,
                totalRevenue: 0,
                grossProfit: 0,
                grossMargin: 0
            })
            setPermSignItemRows([])
            return
        }

        let totalCost = 0
        let totalRevenue = 0
        const rows = permanentSigns.signItems.map((item) => {
            const itemType = determineItemType(item)
            const revenue = Number(getPermanentSignRevenueAndMargin(permanentSigns, item, adminData, mptRental).revenue)
            const cost = Number(getPermSignTotalCost(itemType, permanentSigns, item, adminData, mptRental))
            const grossProfit = revenue - cost
            const grossMargin = revenue > 0 ? grossProfit / revenue : 0

            totalCost += cost
            totalRevenue += revenue

            return {
                name: itemType || 'Unnamed Sign',
                itemType,
                revenue,
                cost,
                grossProfit,
                grossMargin
            }
        })

        const grossProfit = totalRevenue - totalCost
        const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0

        setPermSignItemTotals({
            totalCost,
            totalRevenue,
            grossProfit,
            grossMargin
        })

        setPermSignItemRows(rows)
    }, [permanentSigns?.signItems])
    console.log(permanentSigns?.signItems);

    useEffect(() => {
        if (!mptRental || !adminData) return

        const totals = getAllTotals(
            adminData,
            mptRental,
            equipmentRental || [],
            flagging || defaultFlaggingObject,
            serviceWork || defaultFlaggingObject,
            [],
            permanentSigns ?? defaultPermanentSignsObject
        )

        setAllTotals({
            totalCost: totals.totalCost,
            totalRevenue: totals.totalRevenue,
            totalGrossProfit: totals.totalGrossProfit,
            totalGrossMargin: totals.totalGrossMargin
        })
    }, [adminData, mptRental, equipmentRental, flagging, serviceWork, permanentSigns?.signItems])

    return (
        <div className="bg-white rounded-lg p-2 md:row-span-1">
            {/* Header */}
            <div className="grid grid-cols-5 mb-2">
                <div className="font-medium">Permanent Signs</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
            </div>

            {permanentSigns?.signItems && permanentSigns.signItems.length > 0 ? (
                <>
                    {/* Sale Items Row */}
                    {permSignItemRows.map((sign, index) => (
                        <div key={index} className="grid grid-cols-5 text-sm py-1">
                            <div className='truncate pr-2'>{getDisplayName(sign.name as any)}</div>
                            <div>${sign.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div>${sign.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div>${sign.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div>{(safeNumber(sign.grossMargin) * 100).toFixed(2)}%</div>
                        </div>
                    ))}


                    {/* Sale Items Total */}
                    <div className="grid grid-cols-5 border-t border-gray-300 py-1 bg-green-50">
                        <div className="text-sm font-medium">Total</div>
                        <div className="text-sm font-medium">
                            ${permSignItemTotals?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${permSignItemTotals?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${permSignItemTotals?.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            {(safeNumber(permSignItemTotals?.grossMargin || 0) * 100).toFixed(2)}%
                        </div>
                    </div>

                    {/* ALL TOTALS in orange */}
                    <div className="grid grid-cols-5 border-t border-gray-300 mt-2" style={{ backgroundColor: '#ed7d31' }}>
                        <div className="text-sm font-medium">BID TOTAL</div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalGrossProfit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            {(safeNumber(allTotals?.totalGrossMargin || 0)).toFixed(2)}%
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col">
                        <p className="text-center py-2 text-gray-500 italic">
                            No permanent signs items added
                        </p>
                    </div>

                    {/* ALL TOTALS in orange (even when no sale items) */}
                    <div className="grid grid-cols-5 border-t border-gray-300 mt-2" style={{ backgroundColor: '#ed7d31' }}>
                        <div className="text-sm font-medium">BID TOTAL</div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            ${allTotals?.totalGrossProfit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <div className="text-sm font-medium">
                            {(safeNumber(allTotals?.totalGrossMargin || 0)).toFixed(2)}%
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default PermSignsRevenueAndProfit