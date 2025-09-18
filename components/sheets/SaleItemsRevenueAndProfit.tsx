'use client'
import React, { useEffect, useState } from 'react'
import { SaleItem } from '@/types/TSaleItem'
import { useEstimate } from '@/contexts/EstimateContext'
import { safeNumber } from '@/lib/safe-number'

interface BasicSummaryTotals {
  totalCost: number, totalRevenue: number, totalGrossProfit: number, grossProfitMargin: number
}

interface SaleItemRow extends SaleItem {
  salePrice: number;
  grossProfit: number;
  grossMargin: number;
  extendedPrice: number;
}


const SaleItemsRevenueAndProfit = () => {
  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns } = useEstimate()
  const [saleTotals, setSaleTotals] = useState<{
    totalCost: number
    totalRevenue: number
    grossProfit: number
    grossMargin: number
  } | null>(null)
  const [saleItemRows, setSaleItemRows] = useState<SaleItemRow[]>([]);

  useEffect(() => {
    if (!saleItems || saleItems.length === 0) {
      setSaleTotals({
        totalCost: 0,
        totalRevenue: 0,
        grossProfit: 0,
        grossMargin: 0
      })
      setSaleItemRows([]);
      return
    }

    const rows: SaleItemRow[] = saleItems.map(item => {
      const salePrice = item.quotePrice * (1 + (item.markupPercentage / 100));
      const extendedPrice = salePrice * item.quantity;
      const totalCost = item.quotePrice * item.quantity;
      const grossProfit = extendedPrice - totalCost;
      const grossMargin = extendedPrice > 0 ? grossProfit / extendedPrice : 0;

      return {
        ...item,
        salePrice,
        grossProfit,
        grossMargin,
        extendedPrice,
      };
    });

    setSaleItemRows(rows);

    const totalRevenue = rows.reduce((sum, item) => sum + item.extendedPrice, 0);
    const totalCost = rows.reduce((sum, item) => sum + (item.quotePrice * item.quantity), 0);

    const grossProfit = totalRevenue - totalCost;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    setSaleTotals({
      totalCost: totalCost,
      totalRevenue: totalRevenue,
      grossProfit: grossProfit,
      grossMargin: grossMargin
    })
  }, [saleItems])


  return (
    <div className="bg-white rounded-lg p-2 md:row-span-1">
      {/* Header */}
      <div className="grid grid-cols-5 mb-2 text-sm">
        <div className="font-medium">Sale Items</div>
        <div className="font-medium">Revenue</div>
        <div className="font-medium">Cost</div>
        <div className="font-medium">Gross Profit</div>
        <div className="font-medium">Gross Profit %</div>
      </div>

      {saleItemRows && saleItemRows.length > 0 ? (
        <>
          {saleItemRows.map((item, index) => (
            <div key={index} className="grid grid-cols-5 border-t py-1 border-gray-300 text-sm">
              <div>{item.itemNumber}</div>
              <div>
                ${safeNumber(item.extendedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div>
                ${safeNumber(item.quotePrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div>
                ${safeNumber(item.grossProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div>{(safeNumber(item.grossMargin) * 100).toFixed(2)}%</div>
            </div>
          ))}

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
