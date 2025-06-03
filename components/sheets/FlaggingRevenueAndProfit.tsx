'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { calculateFlaggingCostSummary } from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { formatCurrency } from '@/lib/utils'

interface FlaggingRevenueRow {
    cost: string
    revenue: string
    grossProfit: string
    grossProfitPercent: string
}

const safeNumber = (num: number) => {
    return isNaN(num) || !isFinite(num) ? 0 : num
}

const FlaggingRevenueAndProfit = () => {
    const { adminData, flagging, serviceWork } = useEstimate()
    const [rows, setRows] = useState<FlaggingRevenueRow>()
    const [serviceWorkRows, setServiceWorkRows] = useState<FlaggingRevenueRow>()

    useEffect(() => {
        if (!flagging) return

        const flaggingTotals = calculateFlaggingCostSummary(adminData, flagging, false)
        const serviceWorkTotals = calculateFlaggingCostSummary(
            adminData,
            serviceWork ?? defaultFlaggingObject,
            true
        )

        setRows({
            cost: `$${flaggingTotals.totalFlaggingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            revenue: `$${flaggingTotals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfit: `$${(flaggingTotals.totalRevenue - flaggingTotals.totalFlaggingCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfitPercent: `${safeNumber(((flaggingTotals.totalRevenue - flaggingTotals.totalFlaggingCost) / flaggingTotals.totalRevenue) * 100).toFixed(2)}%`
        })

        setServiceWorkRows({
            cost: `$${serviceWorkTotals.totalFlaggingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            revenue: `$${serviceWorkTotals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfit: `$${(serviceWorkTotals.totalRevenue - serviceWorkTotals.totalFlaggingCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfitPercent: `${safeNumber(((serviceWorkTotals.totalRevenue - serviceWorkTotals.totalFlaggingCost) / serviceWorkTotals.totalRevenue) * 100).toFixed(2)}%`
        })
    }, [flagging, serviceWork, adminData])

    return (
        <div className="bg-white p-2 md:row-span-1">
            {/* Header */}
            <div className="grid grid-cols-5 mb-2">
                <div className="font-medium">Flagging</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Margin</div>
            </div>

            {/* Flagging Row */}
            <div className="grid grid-cols-5 border-t border-gray-300 py-1">
                <div className="text-sm">Flagging</div>
                <div className="text-sm">{rows?.revenue || "$0.00"}</div>
                <div className="text-sm">{rows?.cost || "$0.00"}</div>
                <div className="text-sm">{rows?.grossProfit || "$0.00"}</div>
                <div className="text-sm">{rows?.grossProfitPercent || "0.00%"}</div>
            </div>

            {/* Patterns Row */}
            <div className="grid grid-cols-5 border-t border-gray-300 py-1">
                <div className="text-sm">Patterns</div>
                <div className="text-sm">{serviceWorkRows?.revenue || "$0.00"}</div>
                <div className="text-sm">{serviceWorkRows?.cost || "$0.00"}</div>
                <div className="text-sm">{serviceWorkRows?.grossProfit || "$0.00"}</div>
                <div className="text-sm">{serviceWorkRows?.grossProfitPercent || "0.00%"}</div>
            </div>
        </div>
    )
}

export default FlaggingRevenueAndProfit