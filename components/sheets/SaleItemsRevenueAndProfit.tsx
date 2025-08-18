'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { getAllTotals, getPermanentSignRevenueAndMargin, getPermanentSignsCostSummary, getPermSignTotalCost } from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { safeNumber } from '@/lib/safe-number'
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'
import { determineItemType } from '@/types/TPermanentSigns'
import { getDisplayName } from '@/types/TPermanentSigns'

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
  const [totalPermSignsStats, setTotalPermSignsStats] = React.useState<BasicSummaryTotals | null>(null);

  useEffect(() => {
    if(!permanentSigns || !mptRental || !adminData){
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
      saleItems || [],
      permanentSigns ?? defaultPermanentSignsObject
    )

    setAllTotals({
      totalCost: totals.totalCost,
      totalRevenue: totals.totalRevenue,
      totalGrossProfit: totals.totalGrossProfit,
      totalGrossMargin: totals.totalGrossMargin
    })
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems])

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
          <div className="rounded-lg border mt-4">
            <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
              <div className="font-medium">Perm. Signs Items</div>
              <div className="font-medium">Revenue</div>
              <div className="font-medium">Cost</div>
              <div className="font-medium">Gross Profit</div>
              <div className="font-medium">Gross Profit %</div>
            </div>
            <div className="divide-y">
              {permanentSigns?.signItems.map(signItem => {
                const signFinancials = getPermanentSignRevenueAndMargin(permanentSigns, signItem, adminData, mptRental)
                const itemType = determineItemType(signItem)
                const signCost = getPermSignTotalCost(itemType, permanentSigns, signItem, adminData, mptRental)
                return (
                  <div key={signItem.id} className={`grid grid-cols-5 gap-4 p-4`} >
                    <div>{getDisplayName(itemType)}</div>
                    <div>{signFinancials.revenue}</div>
                    <div>{signCost}</div>
                    <div>{signFinancials.revenue - signCost}</div>
                    <div>{signFinancials.grossMargin}</div>
                  </div>
                )
              }
              )}
              <div className={`grid grid-cols-5 gap-4 p-4 bg-muted`} >
                <div>Permanent Signs</div>
                <div>{totalPermSignsStats?.totalRevenue}</div>
                <div>{totalPermSignsStats?.totalCost}</div>
                <div>{totalPermSignsStats?.totalGrossProfit}</div>
                <div>{totalPermSignsStats?.grossProfitMargin}</div>
              </div>
            </div>
          </div>
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

          {/* ALL TOTALS in orange */}
          <div className="grid grid-cols-5 border-t border-gray-300 py-2" style={{ backgroundColor: '#ed7d31' }}>
            <div className="px-3 py-1 text-sm font-medium">BID TOTAL</div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              ${allTotals?.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="px-3 py-1 text-sm font-medium">
              {(safeNumber(allTotals?.totalGrossMargin || 0) * 100).toFixed(2)}%
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
