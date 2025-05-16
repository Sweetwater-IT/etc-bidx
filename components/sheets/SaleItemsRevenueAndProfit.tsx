'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { getAllTotals } from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { safeNumber } from '@/lib/safe-number'

const SaleItemsRevenueAndProfit = () => {
  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems } = useEstimate()
  const [saleTotals, setSaleTotals] = useState<{
    totalCost: number
    totalRevenue: number
    grossProfit: number
    grossMargin: number
  } | null>(null)
  
  const [allTotals, setAllTotals] = useState<{
    totalCost: number
    totalRevenue: number
    totalGrossProfit: number
    totalGrossMargin: number
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

    const summary = saleItems.reduce((acc, item) => {
        acc.totalCost += item.quotePrice * item.quantity
        acc.totalRevenue += item.quotePrice * item.quantity * (1 + (item.markupPercentage / 100))
        return acc // Added return statement here
    }, {
        totalCost: 0,
        totalRevenue: 0,
    })
    
    const grossProfit = summary.totalRevenue - summary.totalCost
    const grossMargin = summary.totalRevenue > 0 ? grossProfit / summary.totalRevenue : 0
    
    setSaleTotals({
      totalCost: summary.totalCost,
      totalRevenue: summary.totalRevenue,
      grossProfit: grossProfit,
      grossMargin: grossMargin
    })
  }, [saleItems])

  useEffect(() => {
    if (!mptRental || !adminData) return
    
    const totals = getAllTotals(
      adminData,
      mptRental,
      equipmentRental || [],
      flagging || defaultFlaggingObject,
      serviceWork || defaultFlaggingObject,
      saleItems || []
    )

    setAllTotals({
      totalCost: totals.totalCost,
      totalRevenue: totals.totalRevenue,
      totalGrossProfit: totals.totalGrossProfit,
      totalGrossMargin: totals.totalGrossMargin
    })
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems])

  return (
    <div className="bg-white rounded-lg border p-4 md:row-span-1">
      <h3 className="text-lg font-medium mb-4">Sale Items</h3>
      
      {/* Header */}
      <div className="grid grid-cols-5 mb-2">
        <div className="px-3 py-2 font-medium">Sale Items</div>
        <div className="px-3 py-2 font-medium">Revenue</div>
        <div className="px-3 py-2 font-medium">Cost</div>
        <div className="px-3 py-2 font-medium">Gross Profit</div>
        <div className="px-3 py-2 font-medium">Gross Profit %</div>
      </div>

      {saleItems && saleItems.length > 0 ? (
        <>
          {/* Sale Items Row */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-2">
            <div className="px-3 py-1 text-sm">Sale Items</div>
            <div className="px-3 py-1 text-sm">
              ${saleTotals?.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm">
              ${saleTotals?.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm">
              ${saleTotals?.grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm">
              {(safeNumber(saleTotals?.grossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>
          
          {/* Sale Items Total */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-2 bg-green-50">
            <div className="px-3 py-1 text-sm font-medium">Total</div>
            <div className="px-3 py-1 text-sm font-medium">
              ${saleTotals?.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${saleTotals?.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${saleTotals?.grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              {(safeNumber(saleTotals?.grossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>
          
          {/* ALL TOTALS in orange */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-2" style={{ backgroundColor: '#ed7d31' }}>
            <div className="px-3 py-1 text-sm font-medium">BID TOTAL</div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalGrossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              {(safeNumber(allTotals?.totalGrossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col">
            <p className="text-center py-6 text-gray-500 italic">
              No sale items available
            </p>
          </div>
          
          {/* ALL TOTALS in orange (even when no sale items) */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-2 mt-4" style={{ backgroundColor: '#ed7d31' }}>
            <div className="px-3 py-1 text-sm font-medium">BID TOTAL</div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalRevenue?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalCost?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalGrossProfit?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              {(safeNumber(allTotals?.totalGrossMargin || 0) * 100).toFixed(2)}%
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SaleItemsRevenueAndProfit