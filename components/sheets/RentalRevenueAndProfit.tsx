'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { calculateRentalSummary } from '@/lib/mptRentalHelperFunctions'
import { formatCurrency } from '@/lib/utils'

interface RentalRevenueRow {
    rental: string
    cost: string
    revenue: string
    grossProfit: string
    grossProfitPercent: string
}

const RentalRevenueAndProfit = () => {
    const { equipmentRental } = useEstimate()
    const [rows, setRows] = useState<RentalRevenueRow[]>([])

    useEffect(() => {
        if (!equipmentRental || equipmentRental.length === 0) {
            setRows([])
            return
        }

        const rentalSummary = calculateRentalSummary(equipmentRental)
        const itemRows = rentalSummary.items.map((item) => ({
            rental: item.name,
            cost: `$${item.depreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            revenue: `$${item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfit: `$${item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfitPercent: `${(item.grossProfitMargin * 100).toFixed(2)}%`,
        }))

        itemRows.push({
            rental: 'Total',
            cost: `$${rentalSummary.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            revenue: `$${rentalSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfit: `$${rentalSummary.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            grossProfitPercent: `${(rentalSummary.totalGrossProfitMargin * 100).toFixed(2)}%`,
        })

        setRows(itemRows)
    }, [equipmentRental])

    return (
        <div className="bg-white rounded-lg p-2 md:row-span-1">
            {/* Header */}
            <div className="grid grid-cols-5 mb-2">
                <div className="font-medium">Rental</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Margin</div>
            </div>

            {/* Rows */}
            {rows.length > 0 ? (
                rows.map((row, index) => (
                    <div
                        key={index}
                        className={`grid grid-cols-5 border-t border-gray-300 py-1 ${index === rows.length - 1 ? 'bg-green-50' : ''}`}
                    >
                        <div className="text-sm">{row.rental}</div>
                        <div className="text-sm">{row.revenue}</div>
                        <div className="text-sm">{row.cost}</div>
                        <div className="text-sm">{row.grossProfit}</div>
                        <div className="text-sm">{row.grossProfitPercent}</div>
                    </div>
                ))
            ) : (
                <div className="grid grid-cols-5 border-t border-gray-300 py-2">
                    <div className="px-3 col-span-5 text-center text-gray-500 italic">No rental equipment added</div>
                </div>
            )}
        </div>
    )
}

export default RentalRevenueAndProfit