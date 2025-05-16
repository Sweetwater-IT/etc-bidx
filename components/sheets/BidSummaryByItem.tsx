'use client'
import React, { useEffect, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { 
  calculateEquipmentCostSummary, 
  calculateTotalSignCostSummary, 
  getAllTotals 
} from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { safeNumber } from '@/lib/safe-number'

const BidSummaryByItem = () => {
  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems } = useEstimate()

  const [bidSummary, setBidSummary] = useState<{item: string, total: number, percentage: number}[]>([])
  const [discountSummary, setDiscountSummary] = useState<{item: string, discountRate: number}[]>([])

  useEffect(() => {
    if(!mptRental || !equipmentRental || !flagging){
      setBidSummary([])
      setDiscountSummary([])
      return
    }

    const allTotals = getAllTotals(adminData, mptRental, equipmentRental, flagging, serviceWork ?? defaultFlaggingObject, saleItems)
    const mobilizationTotal : number = allTotals.mptTotalRevenue * 0.35

    setBidSummary([
      {
        item: 'MPT Mobilization',
        total: safeNumber(mobilizationTotal),
        percentage: safeNumber((mobilizationTotal / allTotals.totalRevenue) * 100)
      },
      {
        item: 'MPT',
        total: safeNumber((allTotals.mptTotalRevenue * 0.65)),
        percentage: safeNumber(((allTotals.mptTotalRevenue * 0.65) / allTotals.totalRevenue) * 100)
      },
      {
        item: 'Perm. Signs',
        total: 0,
        percentage: 0
      },
      {
        item: 'Rental',
        total: safeNumber(allTotals.totalRevenue * (allTotals.revenuePercentages.rental / 100 )),
        percentage: safeNumber(allTotals.revenuePercentages.rental)
      },
      {
        item: 'Flagging',
        total: safeNumber(allTotals.totalRevenue * (allTotals.revenuePercentages.flagging / 100)),
        percentage: safeNumber(allTotals.revenuePercentages.flagging)
      },
      {
        item: 'Sale',
        total: safeNumber(allTotals.totalRevenue * (allTotals.revenuePercentages.sale / 100)),
        percentage: safeNumber(allTotals.revenuePercentages.sale)
      },
      {
        item: 'Total',
        total: safeNumber(allTotals.totalRevenue),
        percentage: 100
      }
    ])

    const mptTotals = calculateEquipmentCostSummary(mptRental)
    const signTotals = calculateTotalSignCostSummary(mptRental)
    
    const mptDiscount = mptTotals.cost > 0 ? 1 - (mptTotals.revenue / mptTotals.cost) : 0
    const signTotalRevenue = signTotals.HI.revenue + signTotals.DG.revenue + signTotals.Special.revenue
    const signTotalCost = signTotals.HI.cost + signTotals.DG.cost + signTotals.Special.cost
    const signDiscount = signTotalCost > 0 ? 1 - (signTotalRevenue / signTotalCost) : 0
    
    const totalDiscount = allTotals.totalCost > 0 ? (1 - ((mptTotals.revenue + signTotalRevenue) / (mptTotals.cost + signTotalCost))) : 0

    setDiscountSummary([
      {
        item: 'MPT',
        discountRate: mptDiscount
      },
      {
        item: 'SIGNS',
        discountRate: signDiscount
      },
      {
        item: 'Total',
        discountRate: totalDiscount
      }
    ])
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems])

  return (
    <div className="bg-white rounded-lg border p-4 md:row-span-1 mt-12">
      <h3 className="text-lg font-medium mb-4 text-left">Bid Summary</h3>
      
      {/* Bid Item Summary */}
      <div className="mb-8">
        <div className="grid grid-cols-3 mb-2">
          <div className="px-3 py-2 font-medium">Bid Item</div>
          <div className="px-3 py-2 font-medium">Total</div>
          <div className="px-3 py-2 font-medium">Percentage</div>
        </div>
        
        {bidSummary.map((row, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-3 border-t border-gray-300 py-2 ${index === bidSummary.length - 1 ? 'bg-green-50' : ''}`}
          >
            <div className="px-3 py-1 text-sm">{row.item}</div>
            <div className="px-3 py-1 text-sm">${row.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="px-3 py-1 text-sm">{row.percentage.toFixed(2)}%</div>
          </div>
        ))}
      </div>
      
      {/* Discount Summary */}
      <div className="mt-8">
        <div className="grid grid-cols-2 mb-2">
          <div className="px-3 py-2 font-medium">DISCOUNT</div>
          <div className="px-3 py-2 font-medium">Rate</div>
        </div>
        
        {discountSummary.map((row, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-2 border-t border-gray-300 py-2 ${index === discountSummary.length - 1 ? 'bg-green-50' : ''}`}
          >
            <div className="px-3 py-1 text-sm">{row.item}</div>
            <div className="px-3 py-1 text-sm">{safeNumber((row.discountRate * 100)).toFixed(2)}%</div>
          </div>
        ))}
      </div>
      
      {/* SignSquareFootageTotals would be added here once implemented */}
    </div>
  )
}

export default BidSummaryByItem