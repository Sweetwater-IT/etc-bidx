import React, { useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEstimate } from '@/contexts/EstimateContext'
import { MPTEquipmentCost } from '@/types/MPTEquipmentCost'
import { SheetingType } from '@/types/MPTEquipment'
import { LaborCostSummary } from '@/types/ILaborCostSummary'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  calculateEquipmentCostSummary,
  calculateLightAndDrumCostSummary,
  calculateLaborCostSummary,
  calculateTotalSignCostSummary,
  calculateTruckAndFuelCostSummary,
  getAllTotals
} from '@/lib/mptRentalHelperFunctions'
import FlaggingRevenueAndProfit from './FlaggingRevenueAndProfit'
import RentalRevenueAndProfit from './RentalRevenueAndProfit'
import SaleItemsRevenueAndProfit from './SaleItemsRevenueAndProfit'
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'
import PermanentSignsSummaryStep from '../BidItems/permanent-signs-tab'
import PermSignsRevenueAndProfit from './PermSignsRevenueAndProfit'
import { safeNumber } from '@/lib/safe-number'

interface BasicSummaryTotals {
  totalCost: number;
  totalRevenue: number;
  totalGrossProfit: number;
  grossProfitMargin: number;
}

const RevenueAndProfitSummary = () => {
  const { mptRental, adminData, flagging, serviceWork, equipmentRental, saleItems, permanentSigns } = useEstimate()
  const [mptRentalStats, setMptRentalStats] = React.useState<MPTEquipmentCost | null>(null)
  const [lightAndDrumRentalStats, setLightAndDrumRentalStats] = React.useState<MPTEquipmentCost | null>(null)
  const [totalSignCostStats, setTotalSignCostStats] = React.useState<Record<SheetingType, MPTEquipmentCost> | null>(null)
  const [totalRatedLaborStats, setTotalRatedLaborStats] = React.useState<LaborCostSummary | null>(null)
  const [totalTruckAndFuelStats, setTotalTruckAndFuelStats] = React.useState<BasicSummaryTotals | null>(null)
  const [allTotals, setAllTotals] = React.useState<BasicSummaryTotals | null>(null)

  useEffect(() => {
    if (!mptRental || !mptRental.equipmentCosts) {
      setMptRentalStats(null)
      setLightAndDrumRentalStats(null)
      setTotalSignCostStats(null)
      setTotalRatedLaborStats(null)
      setTotalTruckAndFuelStats(null)
      return
    }

    const summary = calculateEquipmentCostSummary(mptRental)
    const lightAndDrumRentalSummary = calculateLightAndDrumCostSummary(adminData, mptRental)
    const signSummary = calculateTotalSignCostSummary(mptRental)
    const ratedLaborSummary = calculateLaborCostSummary(adminData, mptRental)
    const truckAndFuelSummary = calculateTruckAndFuelCostSummary(adminData, mptRental)

    setMptRentalStats(summary)
    setLightAndDrumRentalStats(lightAndDrumRentalSummary.total)
    setTotalSignCostStats(signSummary)
    setTotalRatedLaborStats(ratedLaborSummary)
    setTotalTruckAndFuelStats({
      totalCost: truckAndFuelSummary.cost,
      totalRevenue: truckAndFuelSummary.revenue,
      totalGrossProfit: truckAndFuelSummary.grossProfit,
      grossProfitMargin: truckAndFuelSummary.grossMargin
    })
  }, [mptRental, adminData])

  useEffect(() => {
    if (!mptRental || !mptRental.equipmentCosts) {
      setAllTotals(null)
      return
    }
    const totals = getAllTotals(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject)
    setAllTotals({
      totalCost: totals.mptTotalCost,
      totalRevenue: totals.mptTotalRevenue,
      totalGrossProfit: totals.mptGrossProfit,
      grossProfitMargin: totals.mptGrossMargin
    })
  }, [mptRental, adminData, equipmentRental, flagging, serviceWork, saleItems])

  const data = useMemo(() => {
    if (!mptRentalStats) return []
    return [
      {
        mptRevenueAndGP: "MPT Equipment",
        cost: safeNumber(mptRentalStats?.depreciationCost),
        revenue: safeNumber(mptRentalStats?.revenue),
        grossProfit: safeNumber(mptRentalStats?.grossProfit),
        grossMargin: safeNumber(mptRentalStats?.grossMargin),
      },
      {
        mptRevenueAndGP: "Light & Drum Rental",
        cost: safeNumber(lightAndDrumRentalStats?.depreciationCost),
        revenue: safeNumber(lightAndDrumRentalStats?.revenue),
        grossProfit: safeNumber(lightAndDrumRentalStats?.grossProfit),
        grossMargin: safeNumber(lightAndDrumRentalStats?.grossMargin),
      },
      {
        mptRevenueAndGP: "HI Signs",
        cost: safeNumber(totalSignCostStats?.HI.depreciationCost),
        revenue: safeNumber(totalSignCostStats?.HI.revenue),
        grossProfit: safeNumber(totalSignCostStats?.HI.grossProfit),
        grossMargin: safeNumber(totalSignCostStats?.HI.grossMargin),
      },
      {
        mptRevenueAndGP: "DG Signs",
        cost: safeNumber(totalSignCostStats?.DG.depreciationCost),
        revenue: safeNumber(totalSignCostStats?.DG.revenue),
        grossProfit: safeNumber(totalSignCostStats?.DG.grossProfit),
        grossMargin: safeNumber(totalSignCostStats?.DG.grossMargin),
      },
      {
        mptRevenueAndGP: "Special Signs",
        cost: safeNumber(totalSignCostStats?.Special.depreciationCost),
        revenue: safeNumber(totalSignCostStats?.Special.revenue),
        grossProfit: safeNumber(totalSignCostStats?.Special.grossProfit),
        grossMargin: safeNumber(totalSignCostStats?.Special.grossMargin),
      },
      {
        mptRevenueAndGP: "Rate Labor",
        cost: safeNumber(totalRatedLaborStats?.totalRatedLaborCost),
        revenue: safeNumber(totalRatedLaborStats?.totalRatedLaborRevenue),
        grossProfit: safeNumber(totalRatedLaborStats?.totalRatedLaborCost),
        grossMargin: safeNumber(totalRatedLaborStats?.grossMargin),
      },
      {
        mptRevenueAndGP: "Shop Labor",
        cost: safeNumber(totalRatedLaborStats?.totalNonRateLaborCost),
        revenue: safeNumber(totalRatedLaborStats?.nonRateLaborRevenue),
        grossProfit: safeNumber(totalRatedLaborStats?.nonRateGrossProfit),
        grossMargin: safeNumber(totalRatedLaborStats?.nonRateGrossMargin),
      },
      {
        mptRevenueAndGP: "Truck & Fuel Costs",
        cost: safeNumber(totalTruckAndFuelStats?.totalCost),
        revenue: safeNumber(totalTruckAndFuelStats?.totalRevenue),
        grossProfit: safeNumber(totalTruckAndFuelStats?.totalGrossProfit),
        grossMargin: safeNumber(totalTruckAndFuelStats?.grossProfitMargin),
      },
      {
        mptRevenueAndGP: "MPT Total",
        cost: safeNumber(allTotals?.totalCost),
        revenue: safeNumber(allTotals?.totalRevenue),
        grossProfit: safeNumber(allTotals?.totalGrossProfit),
        grossMargin: safeNumber(((allTotals?.totalGrossProfit || 0) / (allTotals?.totalRevenue || 1) * 100)),
      }
    ]
  }, [mptRentalStats, lightAndDrumRentalStats, totalSignCostStats, totalRatedLaborStats, totalTruckAndFuelStats, allTotals])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  }

  return (
    <div className='border rounded-md p-2 mb-2'>
      <h3 className="text-lg font-medium mb-4 ml-2">Revenue and Profit Summary</h3>
      {/* Grid Header */}
      <div className="grid grid-cols-5 mb-2">
        <div className="px-3 pb-2 font-medium">
          <span>MPT</span>
        </div>
        <div className="px-3 pb-2 font-medium">
          {/* <Tooltip>
            <TooltipTrigger>
              <span className="border-b border-dotted border-gray-400 cursor-help">Revenue</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Revenue = (Number of Items × Daily Rate × Project Days)</p>
            </TooltipContent>
          </Tooltip> */}
          Revenue
        </div>
        <div className="pb-2 font-medium">
          {/* <Tooltip>
            <TooltipTrigger>
              <span className="border-b border-dotted border-gray-400 cursor-help">Cost</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cost = (Depreciation Cost + Maintenance Cost + Setup/Takedown Cost)</p>
            </TooltipContent>
          </Tooltip> */}
          Cost
        </div>
        <div className="pb-2 font-medium">
          {/* <Tooltip>
            <TooltipTrigger>
              <span className="border-b border-dotted border-gray-400 text-left cursor-help">Gross Profit</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gross Profit = (Revenue - Cost)</p>
            </TooltipContent>
          </Tooltip> */}
          Gross Profit
        </div>
        <div className="pb-2 font-medium">
          {/* <Tooltip>
            <TooltipTrigger>
              <span className="border-b border-dotted border-gray-400 cursor-help">Gross Margin</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Margin = (Gross Profit ÷ Revenue) × 100%</p>
            </TooltipContent>
          </Tooltip> */}
          Gross Margin
        </div>
      </div>

      {/* Grid Rows */}
      {data.map((row, index) => (
        <div
          key={index}
          className={`grid grid-cols-5 border-t border-gray-200 ${index === data.length - 1 ? 'bg-green-50' : ''}`}
        >
          <div className="px-3 py-1 text-sm">{row.mptRevenueAndGP}</div>
          <div className="px-3 py-1 text-sm">
            {/* <Tooltip>
              <TooltipTrigger className="cursor-help"> */}
                {formatCurrency(row.revenue)}
              {/* </TooltipTrigger>
              <TooltipContent>
                {row.mptRevenueAndGP === 'MPT' ? <p>MPT Revenue = Sum of all MPT equipment daily rates × project days</p> : null}
                {row.mptRevenueAndGP === 'Rental' ? <p>Rental Revenue = Sum of all rental equipment daily rates × project days</p> : null}
                {row.mptRevenueAndGP === 'Perm. Signs' ? <p>Permanent Signs Revenue = Sum of all permanent sign costs</p> : null}
                {row.mptRevenueAndGP === 'Flagging' ? <p>Flagging Revenue = Labor rate × flagging hours</p> : null}
                {row.mptRevenueAndGP === 'Sale' ? <p>Sale Revenue = Sum of all sale item costs</p> : null}
                {row.mptRevenueAndGP === 'Total' ? <p>Total Revenue = Sum of all revenue categories</p> : null}
                {!['MPT', 'Rental', 'Perm. Signs', 'Flagging', 'Sale', 'Total'].includes(row.mptRevenueAndGP) && <p>Revenue for {row.mptRevenueAndGP} = {formatCurrency(row.revenue)}</p>}
              </TooltipContent>
            </Tooltip> */}
          </div>
          <div className="py-1 text-sm">
            {/* <Tooltip>
              <TooltipTrigger className="cursor-help"> */}
                {formatCurrency(row.cost)}
              {/* </TooltipTrigger>
              <TooltipContent>
                {row.mptRevenueAndGP === 'MPT' ? <p>MPT Cost = Sum of all MPT equipment costs (depreciation + maintenance)</p> : null}
                {row.mptRevenueAndGP === 'Rental' ? <p>Rental Cost = Sum of all rental equipment costs</p> : null}
                {row.mptRevenueAndGP === 'Perm. Signs' ? <p>Permanent Signs Cost = Sum of material and labor costs</p> : null}
                {row.mptRevenueAndGP === 'Flagging' ? <p>Flagging Cost = Labor cost × flagging hours</p> : null}
                {row.mptRevenueAndGP === 'Sale' ? <p>Sale Cost = Sum of all sale item costs</p> : null}
                {row.mptRevenueAndGP === 'Total' ? <p>Total Cost = Sum of all cost categories</p> : null}
                {!['MPT', 'Rental', 'Perm. Signs', 'Flagging', 'Sale', 'Total'].includes(row.mptRevenueAndGP) && <p>Cost for {row.mptRevenueAndGP} = {formatCurrency(row.cost)}</p>}
              </TooltipContent>
            </Tooltip> */}
          </div>
          <div className="py-1 text-sm">
            {/* <Tooltip>
              <TooltipTrigger className="cursor-help"> */}
                {formatCurrency(row.grossProfit ?? 0)}
              {/* </TooltipTrigger>
              <TooltipContent>
                <p>Gross Profit = Revenue - Cost = {formatCurrency(row.grossProfit ?? 0)}</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
          <div className="py-1 text-sm">
            {/* <Tooltip>
              <TooltipTrigger className="cursor-help"> */}
                {formatPercentage(row.grossMargin)}
              {/* </TooltipTrigger>
              <TooltipContent>
                <p>Gross Margin = (Gross Profit ÷ Revenue) × 100% = {formatPercentage(row.grossMargin)}</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
        </div>
      ))}
      <FlaggingRevenueAndProfit />
      <RentalRevenueAndProfit />
      <SaleItemsRevenueAndProfit />
      <PermSignsRevenueAndProfit/>
    </div>
  )
}

export default RevenueAndProfitSummary