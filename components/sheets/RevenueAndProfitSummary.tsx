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
        cost: mptRentalStats?.depreciationCost || 0,
        revenue: mptRentalStats?.revenue || 0,
        grossProfit: mptRentalStats?.grossProfit || 0,
        grossMargin: mptRentalStats?.grossMargin || 0,
      },
      {
        mptRevenueAndGP: "Light & Drum Rental",
        cost: lightAndDrumRentalStats?.depreciationCost || 0,
        revenue: lightAndDrumRentalStats?.revenue || 0,
        grossProfit: lightAndDrumRentalStats?.grossProfit || 0,
        grossMargin: lightAndDrumRentalStats?.grossMargin || 0,
      },
      {
        mptRevenueAndGP: "HI Signs",
        cost: totalSignCostStats?.HI.depreciationCost || 0,
        revenue: totalSignCostStats?.HI.revenue || 0,
        grossProfit: totalSignCostStats?.HI.grossProfit || 0,
        grossMargin: totalSignCostStats?.HI.grossMargin || 0,
      },
      {
        mptRevenueAndGP: "DG Signs",
        cost: totalSignCostStats?.DG.depreciationCost || 0,
        revenue: totalSignCostStats?.DG.revenue || 0,
        grossProfit: totalSignCostStats?.DG.grossProfit || 0,
        grossMargin: totalSignCostStats?.DG.grossMargin || 0,
      },
      {
        mptRevenueAndGP: "Special Signs",
        cost: totalSignCostStats?.Special.depreciationCost || 0,
        revenue: totalSignCostStats?.Special.revenue || 0,
        grossProfit: totalSignCostStats?.Special.grossProfit || 0,
        grossMargin: totalSignCostStats?.Special.grossMargin || 0,
      },
      {
        mptRevenueAndGP: "Rate Labor",
        cost: totalRatedLaborStats?.totalRatedLaborCost || 0,
        revenue: Number.isNaN(totalRatedLaborStats?.totalRatedLaborRevenue) ? 0 : (totalRatedLaborStats?.totalRatedLaborRevenue || 0),
        grossProfit: Number.isNaN(totalRatedLaborStats?.totalRatedLaborCost) ? 0 : totalRatedLaborStats?.totalRatedLaborCost,
        grossMargin: Number.isNaN(totalRatedLaborStats?.grossMargin) ? 0 : (totalRatedLaborStats?.grossMargin || 0),
      },
      {
        mptRevenueAndGP: "Shop Labor",
        cost: totalRatedLaborStats?.totalNonRateLaborCost || 0,
        revenue: Number.isNaN(totalRatedLaborStats?.nonRateLaborRevenue) ? 0 : (totalRatedLaborStats?.nonRateLaborRevenue || 0),
        grossProfit: Number.isNaN(totalRatedLaborStats?.nonRateGrossProfit) ? 0 : (totalRatedLaborStats?.nonRateGrossProfit || 0),
        grossMargin: Number.isNaN(totalRatedLaborStats?.nonRateGrossMargin) ? 0 : (totalRatedLaborStats?.nonRateGrossMargin || 0),
      },
      {
        mptRevenueAndGP: "Truck & Fuel Costs",
        cost: totalTruckAndFuelStats?.totalCost || 0,
        revenue: totalTruckAndFuelStats?.totalRevenue || 0,
        grossProfit: totalTruckAndFuelStats?.totalGrossProfit || 0,
        grossMargin: totalTruckAndFuelStats?.grossProfitMargin || 0,
      },
      {
        mptRevenueAndGP: "MPT Total",
        cost: allTotals?.totalCost || 0,
        revenue: allTotals?.totalRevenue || 0,
        grossProfit: allTotals?.totalGrossProfit || 0,
        grossMargin: ((allTotals?.totalGrossProfit || 0) / (allTotals?.totalRevenue || 1) * 100),
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