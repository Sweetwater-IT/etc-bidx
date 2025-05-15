"use client"

import { useCallback, memo, useEffect, useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, HelpCircle } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const formatValue = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) return ''
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEstimate } from "@/contexts/EstimateContext"
import { MPTEquipmentCost } from "@/types/MPTEquipmentCost"
import { SheetingType } from "@/types/MPTEquipment"
import { LaborCostSummary } from "@/types/ILaborCostSummary"
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject"
import {
  calculateEquipmentCostSummary,
  calculateLightAndDrumCostSummary,
  calculateLaborCostSummary,
  calculateTotalSignCostSummary,
  calculateTruckAndFuelCostSummary,
  getAllTotals
} from '@/lib/mptRentalHelperFunctions'

interface BasicSummaryTotals {
  totalCost: number
  totalRevenue: number
  totalGrossProfit: number
  grossProfitMargin: number
}

interface BidSummaryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const BidSummaryDrawer = memo(function BidSummaryDrawer({ open, onOpenChange }: BidSummaryDrawerProps) {
  const { mptRental, adminData, flagging, serviceWork, equipmentRental, saleItems } = useEstimate()
  const [mptRentalStats, setMptRentalStats] = useState<MPTEquipmentCost | null>(null)
  const [lightAndDrumRentalStats, setLightAndDrumRentalStats] = useState<MPTEquipmentCost | null>(null)
  const [totalSignCostStats, setTotalSignCostStats] = useState<Record<SheetingType, MPTEquipmentCost> | null>(null)
  const [totalRatedLaborStats, setTotalRatedLaborStats] = useState<LaborCostSummary | null>(null)
  const [totalTruckAndFuelStats, setTotalTruckAndFuelStats] = useState<BasicSummaryTotals | null>(null)
  const [allTotals, setAllTotals] = useState<BasicSummaryTotals | null>(null)

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

  const handleClear = useCallback(() => {
    // Reset all state to initial values
    setMptRentalStats(null)
    setLightAndDrumRentalStats(null)
    setTotalSignCostStats(null)
    setTotalRatedLaborStats(null)
    setTotalTruckAndFuelStats(null)
    setAllTotals(null)
  }, [])

  const handleSwing = useCallback(() => {
    // Implement swing pricing logic
    if (!mptRental || !adminData) return
    // TODO: Implement swing pricing calculation
  }, [mptRental, adminData])

  const handleTarget = useCallback(() => {
    // Implement target pricing logic
    if (!mptRental || !adminData) return
    // TODO: Implement target pricing calculation
  }, [mptRental, adminData])

  const handleBreakeven = useCallback(() => {
    // Implement breakeven pricing logic
    if (!mptRental || !adminData) return
    // TODO: Implement breakeven pricing calculation
  }, [mptRental, adminData])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const mptData = [
    {
      name: "MPT Equipment",
      revenue: mptRentalStats?.revenue || 0,
      cost: mptRentalStats?.depreciationCost || 0,
      grossProfit: mptRentalStats?.grossProfit || 0,
      grossMargin: mptRentalStats?.grossMargin || 0,
      highlight: false,
      details: mptRentalStats?.details
    },
    {
      name: "Light & Drum Rental",
      revenue: lightAndDrumRentalStats?.revenue || 0,
      cost: lightAndDrumRentalStats?.depreciationCost || 0,
      grossProfit: lightAndDrumRentalStats?.grossProfit || 0,
      grossMargin: lightAndDrumRentalStats?.grossMargin || 0,
      highlight: false
    },
    {
      name: "HI Signs",
      revenue: totalSignCostStats?.HI.revenue || 0,
      cost: totalSignCostStats?.HI.depreciationCost || 0,
      grossProfit: totalSignCostStats?.HI.grossProfit || 0,
      grossMargin: totalSignCostStats?.HI.grossMargin || 0,
      highlight: false
    },
    {
      name: "DG Signs",
      revenue: totalSignCostStats?.DG.revenue || 0,
      cost: totalSignCostStats?.DG.depreciationCost || 0,
      grossProfit: totalSignCostStats?.DG.grossProfit || 0,
      grossMargin: totalSignCostStats?.DG.grossMargin || 0,
      highlight: false
    },
    {
      name: "Special Signs",
      revenue: totalSignCostStats?.Special.revenue || 0,
      cost: totalSignCostStats?.Special.depreciationCost || 0,
      grossProfit: totalSignCostStats?.Special.grossProfit || 0,
      grossMargin: totalSignCostStats?.Special.grossMargin || 0,
      highlight: false
    },
    {
      name: "Rate Labor",
      revenue: Number.isNaN(totalRatedLaborStats?.totalRatedLaborRevenue) ? 0 : (totalRatedLaborStats?.totalRatedLaborRevenue || 0),
      cost: totalRatedLaborStats?.totalRatedLaborCost || 0,
      grossProfit: Number.isNaN(totalRatedLaborStats?.totalRatedLaborCost) ? 0 : totalRatedLaborStats?.totalRatedLaborCost,
      grossMargin: Number.isNaN(totalRatedLaborStats?.grossMargin) ? 0 : (totalRatedLaborStats?.grossMargin || 0),
      highlight: false
    },
    {
      name: "Shop Labor",
      revenue: Number.isNaN(totalRatedLaborStats?.nonRateLaborRevenue) ? 0 : (totalRatedLaborStats?.nonRateLaborRevenue || 0),
      cost: totalRatedLaborStats?.totalNonRateLaborCost || 0,
      grossProfit: Number.isNaN(totalRatedLaborStats?.nonRateGrossProfit) ? 0 : (totalRatedLaborStats?.nonRateGrossProfit || 0),
      grossMargin: Number.isNaN(totalRatedLaborStats?.nonRateGrossMargin) ? 0 : (totalRatedLaborStats?.nonRateGrossMargin || 0),
      highlight: false
    },
    {
      name: "Truck & Fuel Costs",
      revenue: totalTruckAndFuelStats?.totalRevenue || 0,
      cost: totalTruckAndFuelStats?.totalCost || 0,
      grossProfit: totalTruckAndFuelStats?.totalGrossProfit || 0,
      grossMargin: totalTruckAndFuelStats?.grossProfitMargin || 0,
      highlight: false
    },
    {
      name: "MPT Total",
      revenue: allTotals?.totalRevenue || 0,
      cost: allTotals?.totalCost || 0,
      grossProfit: allTotals?.totalGrossProfit || 0,
      grossMargin: ((allTotals?.totalGrossProfit || 0) / (allTotals?.totalRevenue || 1) * 100),
      highlight: true
    }
  ]

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="bid-summary-drawer">
        {/* Custom CSS for the drawer width */}
        <style jsx global>{`
          .bid-summary-drawer {
            width: 95vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .bid-summary-drawer {
              width: 80vw !important;
              max-width: none !important;
            }
          }
          
          .bid-summary-drawer[data-vaul-drawer-direction="right"] {
            width: 95vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .bid-summary-drawer[data-vaul-drawer-direction="right"] {
              width: 80vw !important;
              max-width: none !important;
            }
          }
        `}</style>
        
        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <DrawerTitle className="text-xl font-semibold">Bid Summary Dashboard</DrawerTitle>
              <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100">
                <X className="h-4 w-4" />
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                variant="default"
                className="bg-black hover:bg-black/90"
                onClick={handleSwing}
              >
                Swing
              </Button>
              <Button
                variant="default"
                className="bg-green-500 hover:bg-green-600"
                onClick={handleTarget}
              >
                Target
              </Button>
              <Button
                variant="default"
                className="bg-red-500 hover:bg-red-600"
                onClick={handleBreakeven}
              >
                Breakeven
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
              {/* 1. MPT Discounting Section */}
              <div className="bg-white rounded-lg border p-4 md:col-span-1 order-1">
                <h3 className="text-lg font-medium mb-4">MPT Discounting</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Item</TableHead>
                        <TableHead className="whitespace-nowrap">Discount</TableHead>
                        <TableHead className="whitespace-nowrap">Swing</TableHead>
                        <TableHead className="whitespace-nowrap">Target</TableHead>
                        <TableHead className="whitespace-nowrap">Breakeven</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        "4' Ft Type III",
                        "6 Ft Wings",
                        "H Stand",
                        "Post",
                        "Sandbag",
                        "Covers",
                        "Metal Stands",
                        "HI",
                        "DG",
                        "Special"
                      ].map((item) => (
                        <TableRow key={item}>
                          <TableCell>{item}</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>100.00%</TableCell>
                          <TableCell>100.00%</TableCell>
                          <TableCell>100.00%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* 2. Revenue and Profit Summary Section */}
              <div className="bg-white rounded-lg border p-4 md:col-span-1 order-2">
                <h3 className="text-lg font-medium mb-4">Revenue and Profit Summary</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">MPT</TableHead>
                        <TableHead className="whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              Revenue <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent className="p-4 space-y-2">
                              <p className="font-medium">Revenue = Quantity × Days Required × Daily Rate</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Quantity: {formatValue(mptRental?.phases[0]?.personnel)}</p>
                                <p>Days Required: {formatValue(mptRental?.phases[0]?.days)}</p>
                                <p>Daily Rate: ${formatValue(mptRentalStats?.revenue)}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              Cost <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent className="p-4 space-y-2">
                              <p className="font-medium">Cost = Quantity × Days Required × Daily Cost</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Quantity: {formatValue(mptRental?.phases[0]?.personnel)}</p>
                                <p>Days Required: {formatValue(mptRental?.phases[0]?.days)}</p>
                                <p>Daily Cost: ${formatValue(mptRentalStats?.depreciationCost)}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              Gross Profit <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent className="p-4 space-y-2">
                              <p className="font-medium">Gross Profit = Revenue - Cost</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Revenue: ${formatValue(mptRentalStats?.revenue)}</p>
                                <p>Cost: ${formatValue(mptRentalStats?.depreciationCost)}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              Gross Profit % <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent className="p-4 space-y-2">
                              <p className="font-medium">Gross Profit % = (Gross Profit ÷ Revenue) × 100</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Gross Profit: ${formatValue(mptRentalStats?.grossProfit)}</p>
                                <p>Revenue: ${formatValue(mptRentalStats?.revenue)}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { item: "MPT Equipment", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "Channelizer and Light Rentals", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "HI Signs", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "DG Signs", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "Special Signs", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "Rate Labor", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "Shop Labor", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" },
                        { item: "Truck & Fuel Costs", revenue: "$0.00", cost: "$0.00", profit: "$0.00", percentage: "0.00%" }
                      ].map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.item}</TableCell>
                          <TableCell>{row.revenue}</TableCell>
                          <TableCell>{row.cost}</TableCell>
                          <TableCell>{row.profit}</TableCell>
                          <TableCell>{row.percentage}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-100">
                        <TableCell>MPT Total</TableCell>
                        <TableCell>$0.00</TableCell>
                        <TableCell>$0.00</TableCell>
                        <TableCell>$0.00</TableCell>
                        <TableCell>0.00%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* 3. Sale Items Section */}
              <div className="bg-white rounded-lg border p-4 md:row-span-1 order-3">
                <h3 className="text-lg font-medium mb-4">Sale Items</h3>
                <div className="flex flex-col">
                  <p className="text-center py-6 text-gray-500 italic">
                    No sale items available
                  </p>
                </div>
              </div>
              
              {/* 4. Equipment Summary Section - Spans 2 columns */}
              <div className="bg-white rounded-lg border p-4 md:col-span-2 order-4">
                <h3 className="text-lg font-medium mb-4">Equipment Summary</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Item</TableHead>
                        <TableHead className="whitespace-nowrap">Total</TableHead>
                        <TableHead className="whitespace-nowrap">Phase 1</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        "4' Ft Type III",
                        "6 Ft Wings",
                        "H Stand",
                        "Post",
                        "Covers",
                        "Metal Stands",
                        "Sandbag",
                        "HI Vertical Panels",
                        "Type XI Vertical Panels",
                        "B-Lites",
                        "A/C-Lites",
                        "Sharps",
                        "HI",
                        "DG",
                        "Special",
                        "TMA",
                        "Arrow Board",
                        "Message Board",
                        "Speed Trailer"
                      ].map((item) => (
                        <TableRow key={item}>
                          <TableCell>{item}</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>0</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Bottom Right Area - Contains both Labor Summary and Square Footage */}
              <div className="md:col-span-1 order-5 grid grid-cols-1 gap-6">
                {/* 5. LABOR SUMMARY Section */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">LABOR SUMMARY (HOURS)</h3>
                  <div className="overflow-x-auto">
                    <Table className="mb-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap py-2">Type</TableHead>
                          <TableHead className="whitespace-nowrap py-2">Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Rated Labor Hours", highlight: false },
                          { name: "Shop Labor Hours", highlight: false },
                          { name: "Permanent Sign Hours", highlight: false },
                          { name: "Total", highlight: true }
                        ].map((row, index) => (
                          <TableRow key={index} className={row.highlight ? "bg-green-100" : ""}>
                            <TableCell className="py-1">{row.name}</TableCell>
                            <TableCell className="py-1">0.00 hrs</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* 6. Square Footage by Sign Type */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Square Footage by Sign Type</h3>
                  <div className="overflow-x-auto">
                    <Table className="mb-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap py-2">Type</TableHead>
                          <TableHead className="whitespace-nowrap py-2">Area</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          "High Intensity",
                          "Diamond Grade",
                          "Special"
                        ].map((type) => (
                          <TableRow key={type}>
                            <TableCell className="py-1">{type}</TableCell>
                            <TableCell className="py-1">0.00 sq. ft.</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-100">
                          <TableCell>Total</TableCell>
                          <TableCell>0.00 sq. ft.</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
})
