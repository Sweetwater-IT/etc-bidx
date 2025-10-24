'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { safeNumber } from '@/lib/safe-number'

interface BasicSummaryTotals {
  totalCost: number, totalRevenue: number, totalGrossProfit: number, grossProfitMargin: number
}

const SaleItemsRevenueAndProfit = () => {
  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns } = useEstimate()
  const [saleTotals, setSaleTotals] = useState<{
    totalCost: number
    totalRevenue: number
    grossProfit: number
    grossMargin: number
  } | null>(null)  

  useEffect(() => {
    if (!saleItems || saleItems.length === 0) {
      setSaleTotals({
        totalCost: 0,
        totalRevenue: 0,
        grossProfit: 0,
        grossMargin: 0
      })
      return
    }

    const summary = saleItems.reduce(
      (acc, item) => {
        const cost = item.totalCost ?? 0
        const revenue = item.revenue ?? 0
        acc.totalCost += cost
        acc.totalRevenue += revenue
        return acc
      },
      { totalCost: 0, totalRevenue: 0 }
    )

    const grossProfit = summary.totalRevenue - summary.totalCost
    const grossMargin = summary.totalRevenue > 0 ? grossProfit / summary.totalRevenue : 0

    setSaleTotals({
      totalCost: summary.totalCost,
      totalRevenue: summary.totalRevenue,
      grossProfit,
      grossMargin
    })
  }, [saleItems])

  return (
    <div className="bg-white rounded-lg p-2 md:row-span-1">
      {/* Header */}
      <div className="grid grid-cols-5 mb-2">
        <div className="font-medium">Sale Items</div>
        <div className="font-medium">Revenue</div>
        <div className="font-medium">Cost</div>
        <div className="font-medium">Gross Profit</div>
        <div className="font-medium">Gross Profit %</div>
      </div>

      {saleItems && saleItems.length > 0 ? (
        <>
          {/* Sale Items Row */}
          <div className="grid grid-cols-5 border-t py-1 border-gray-300">
            <div className="text-sm">Sale Items</div>
            <div className="text-sm">
              ${saleTotals?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm">
              ${saleTotals?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm">
              ${saleTotals?.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm">
              {(safeNumber(saleTotals?.grossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>

          {/* Sale Items Total */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-1 bg-green-50">
            <div className="text-sm font-medium">Total</div>
            <div className="text-sm font-medium">
              ${saleTotals?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm font-medium">
              ${saleTotals?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm font-medium">
              ${saleTotals?.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm font-medium">
              {(safeNumber(saleTotals?.grossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col">
            <p className="text-center py-2 text-gray-500 italic">
              No sale items added
            </p>
          </div>


        </>
      )}
    </div>
  )
}

export default SaleItemsRevenueAndProfit
