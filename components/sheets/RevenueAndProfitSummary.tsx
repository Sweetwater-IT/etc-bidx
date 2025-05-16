import React, { useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEstimate } from '@/contexts/EstimateContext'
import { MPTEquipmentCost } from '@/types/MPTEquipmentCost'
import { SheetingType } from '@/types/MPTEquipment'
import { LaborCostSummary } from '@/types/ILaborCostSummary'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import {
  calculateEquipmentCostSummary,
  calculateLightAndDrumCostSummary,
  calculateLaborCostSummary,
  calculateTotalSignCostSummary,
  calculateTruckAndFuelCostSummary,
  getAllTotals
} from '@/lib/mptRentalHelperFunctions'

interface BasicSummaryTotals {
    totalCost: number;
    totalRevenue: number;
    totalGrossProfit: number;
    grossProfitMargin: number;
}

const RevenueAndProfitSummary = () => {
  const { mptRental, adminData, flagging, serviceWork, equipmentRental, saleItems } = useEstimate()
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
    const totals = getAllTotals(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems)
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
    <Card className="mt-12">
      <CardHeader>
        <div className="flex">
          <CardTitle className="text-lg font-semibold text-left">Revenue and Profit Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid Header */}
        <div className="grid grid-cols-5 mb-2">
          <div className="px-3 pb-2 font-medium">MPT</div>
          <div className="px-3 pb-2 font-medium">Revenue</div>
          <div className="px-3 pb-2 font-medium">Cost</div>
          <div className="px-3 pb-2 font-medium">Gross Profit</div>
          <div className="px-3 pb-2 font-medium">Gross Margin</div>
        </div>

        {/* Grid Rows */}
        {data.map((row, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-5 border-t border-gray-200 ${index === data.length - 1 ? 'bg-green-50' : ''}`}
          >
            <div className="px-3 py-3 text-sm">{row.mptRevenueAndGP}</div>
            <div className="px-3 py-3 text-sm">{formatCurrency(row.revenue)}</div>
            <div className="px-3 py-3 text-sm">{formatCurrency(row.cost)}</div>
            <div className="px-3 py-3 text-sm">{formatCurrency(row.grossProfit ?? 0)}</div>
            <div className="px-3 py-3 text-sm">{formatPercentage(row.grossMargin)}</div>
          </div>
        ))}
        
        {/* You can add other related components here similar to the Mantine version */}
        {/* <RentalRevenueAndProfit />
        <FlaggingRevenueAndProfit />
        <PermSignsRevenueAndGP /> */}
      </CardContent>
    </Card>
  )
}

export default RevenueAndProfitSummary