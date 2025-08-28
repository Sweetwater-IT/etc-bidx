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
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'
// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const BidSummaryByItem = () => {
  const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns } = useEstimate()

  const [bidSummary, setBidSummary] = useState<{item: string, total: number, percentage: number}[]>([])
  const [discountSummary, setDiscountSummary] = useState<{item: string, discountRate: number}[]>([])

  useEffect(() => {
    if(!mptRental || !equipmentRental || !flagging){
      setBidSummary([])
      setDiscountSummary([])
      return
    }

    const allTotals = getAllTotals(adminData, mptRental, equipmentRental, flagging, serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject)
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
        item: 'Perm. Signs',
        total: safeNumber(allTotals.totalRevenue * (allTotals.revenuePercentages.permanentSigns / 100)),
        percentage: safeNumber(allTotals.revenuePercentages.permanentSigns)
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
        discountRate: safeNumber(mptDiscount)
      },
      {
        item: 'SIGNS',
        discountRate: safeNumber(signDiscount)
      },
      {
        item: 'Total',
        discountRate: safeNumber(totalDiscount)
      }
    ])
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems])

  return (
    <div className="bg-white rounded-lg border p-4 md:row-span-1 flex-[.66]">
      <h3 className="text-lg font-medium mb-4 text-left">Bid Summary</h3>
      
      {/* Bid Item Summary */}
      <div className="mb-8">
        <div className="grid grid-cols-3 mb-2">
          <div className="px-3 font-medium">
            {/* <span className="border-b border-dotted border-gray-400 cursor-help">Bid Item</span> */}
            Bid Item
          </div>
          <div className="px-3 font-medium">
            {/* <Tooltip>
              <TooltipTrigger>
                <span className="border-b border-dotted border-gray-400 cursor-help">Total</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total = Revenue amount for each bid item</p>
              </TooltipContent>
            </Tooltip> */}
            Total Revenue
          </div>
          <div className="px-3 font-medium">
            {/* <Tooltip>
              <TooltipTrigger>
                <span className="border-b border-dotted border-gray-400 cursor-help">Percentage</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentage = (Item Revenue ÷ Total Revenue) × 100%</p>
              </TooltipContent>
            </Tooltip> */}
            Percentage
          </div>
        </div>
        
        {bidSummary.map((row, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-3 border-t border-gray-300 ${index === bidSummary.length - 1 ? 'bg-green-50' : ''}`}
          >
            <div className="px-3 py-1 text-sm">{row.item}</div>
            <div className="px-3 py-1 text-sm">
              {/* <Tooltip>
                <TooltipTrigger className="cursor-help"> */}
                  ${safeNumber(row.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                {/* </TooltipTrigger>
                <TooltipContent>
                  {row.item === 'MPT Mobilization' && <p>MPT Mobilization = Total MPT Revenue × 0.35</p>}
                  {row.item === 'MPT' && <p>MPT = Total MPT Revenue × 0.65</p>}
                  {row.item === 'Perm. Signs' && <p>Permanent Signs = Sum of all permanent sign costs</p>}
                  {row.item === 'Rental' && <p>Rental = Total Revenue × (Rental Revenue Percentage ÷ 100)</p>}
                  {row.item === 'Flagging' && <p>Flagging = Total Revenue × (Flagging Revenue Percentage ÷ 100)</p>}
                  {row.item === 'Sale' && <p>Sale = Total Revenue × (Sale Revenue Percentage ÷ 100)</p>}
                  {row.item === 'Total' && <p>Total = Sum of all revenue items</p>}
                </TooltipContent>
              </Tooltip> */}
            </div>
            <div className="px-3 py-1 text-sm">
              {/* <Tooltip>
                <TooltipTrigger className="cursor-help"> */}
                  {safeNumber(row.percentage).toFixed(2)}%
                {/* </TooltipTrigger>
                <TooltipContent>
                  {row.item !== 'Total' ? 
                    <p>Percentage = (Item Revenue ÷ Total Revenue) × 100%</p> : 
                    <p>Total Percentage = 100%</p>
                  }
                </TooltipContent>
              </Tooltip> */}
            </div>
          </div>
        ))}
      </div>
      
      {/* Discount Summary */}
      <div className="mt-8">
        <div className="grid grid-cols-3 mb-2">
          <div className="px-3 font-medium">
            {/* <Tooltip>
              <TooltipTrigger> */}
                {/* <span className="border-b border-dotted border-gray-400 cursor-help">DISCOUNT</span> */}
                DISCOUNT
              {/* </TooltipTrigger>
              <TooltipContent>
                <p>Discount categories applied to the bid items</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
          <div className="px-3 font-medium">
            {/* <Tooltip>
              <TooltipTrigger> */}
                {/* <span className="border-b border-dotted border-gray-400 cursor-help">Rate</span> */}
                Rate
              {/* </TooltipTrigger>
              <TooltipContent>
                <p>Discount rate applied as a percentage of the total</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
        </div>
        
        {discountSummary.map((row, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-3 border-t border-gray-300 ${index === discountSummary.length - 1 ? 'bg-green-50' : ''}`}
          >
            <div className="px-3 py-1 text-sm">{row.item}</div>
            <div className="px-3 py-1 text-sm">
              {/* <Tooltip>
                <TooltipTrigger className="cursor-help"> */}
                  {safeNumber((row.discountRate * 100)).toFixed(2)}%
                {/* </TooltipTrigger>
                <TooltipContent>
                  {row.item === 'MPT' && <p>MPT Discount Rate = 1 - (MPT Revenue ÷ MPT Cost)</p>}
                  {row.item === 'SIGNS' && <p>Signs Discount Rate = 1 - (Signs Revenue ÷ Signs Cost)</p>}
                  {row.item === 'Total' && <p>Total Discount Rate = 1 - ((MPT Revenue + Signs Revenue) ÷ (MPT Cost + Signs Cost))</p>}
                </TooltipContent>
              </Tooltip> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BidSummaryByItem