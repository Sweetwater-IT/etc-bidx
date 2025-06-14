import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo } from 'react';
import { 
  calculateEquipmentCostSummary, 
  calculateLaborCostSummary, 
  calculateLightAndDrumCostSummary, 
  calculateTotalSignCostSummary, 
  calculateTruckAndFuelCostSummary,
  getAllTotals
} from '@/lib/mptRentalHelperFunctions';
import { MPTEquipmentCost } from '@/types/MPTEquipmentCost';
import { SheetingType } from '@/types/MPTEquipment';
import { LaborCostSummary } from "@/types/ILaborCostSummary";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";
import { useEstimate } from "@/contexts/EstimateContext";
import DiscountChecks from "../pages/active-bid/steps/discount-checks";

interface ViewBidSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface BasicSummaryTotals {
  totalCost: number, totalRevenue: number, totalGrossProfit: number, grossProfitMargin : number
}

export function ViewBidSummarySheet({
  open,
  onOpenChange,
}: ViewBidSummarySheetProps) {
  const { mptRental, adminData, flagging, serviceWork, equipmentRental, saleItems } = useEstimate();
  const [mptRentalStats, setMptRentalStats] = React.useState<MPTEquipmentCost | null>(null);
  const [lightAndDrumRentalStats, setLightAndDrumRentalStats] = React.useState<MPTEquipmentCost | null>(null);
  const [totalSignCostStats, setTotalSignCostStats] = React.useState<Record<SheetingType, MPTEquipmentCost> | null>(null);
  const [totalRatedLaborStats, setTotalRatedLaborStats] = React.useState<LaborCostSummary | null>(null);
  const [totalTruckAndFuelStats, setTotalTruckAndFuelStats] = React.useState<BasicSummaryTotals | null>(null);
  const [allTotals, setAllTotals] = React.useState<BasicSummaryTotals | null>(null);

  useEffect(() => {
    if (!mptRental) {
      setMptRentalStats(null);
      setLightAndDrumRentalStats(null);
      setTotalSignCostStats(null);
      setTotalRatedLaborStats(null);
      setTotalTruckAndFuelStats(null);
      return;
    }

    const summary = calculateEquipmentCostSummary(mptRental);
    const lightAndDrumRentalSummary = calculateLightAndDrumCostSummary(adminData, mptRental);
    const signSummary = calculateTotalSignCostSummary(mptRental);
    const ratedLaborSummary = calculateLaborCostSummary(adminData, mptRental);
    const truckAndFuelSummary = calculateTruckAndFuelCostSummary(adminData, mptRental);

    setMptRentalStats(summary);
    setLightAndDrumRentalStats(lightAndDrumRentalSummary.total);
    setTotalSignCostStats(signSummary);
    setTotalRatedLaborStats(ratedLaborSummary);
    setTotalTruckAndFuelStats({
      totalCost: truckAndFuelSummary.cost,
      totalRevenue: truckAndFuelSummary.revenue,
      totalGrossProfit: truckAndFuelSummary.grossProfit,
      grossProfitMargin: truckAndFuelSummary.grossMargin
    });
  }, [mptRental, adminData]);

  useEffect(() => {
    if (!mptRental) return;
    const totals = getAllTotals(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems);
    setAllTotals({
      totalCost: totals.mptTotalCost,
      totalRevenue: totals.mptTotalRevenue,
      totalGrossProfit: totals.mptGrossProfit,
      grossProfitMargin: totals.totalGrossMargin
    });
  }, [mptRental, adminData, flagging, serviceWork, saleItems, equipmentRental]);

  const mptData = useMemo(() => {
    if (!mptRentalStats) return [];
    return [
      {
        name: "MPT Equipment", 
        revenue: mptRentalStats.revenue,
        cost: mptRentalStats.depreciationCost,
        grossProfit: Number.isNaN(mptRentalStats.grossProfit) ? 0 : mptRentalStats.grossProfit,
        grossMargin: Number.isNaN(mptRentalStats.grossMargin) ? 0 : mptRentalStats.grossMargin,
        highlight: false
      },
      {
        name: "Channelizer and Light Rentals", 
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
        revenue: totalTruckAndFuelStats?.totalRevenue|| 0,
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
    ];
  }, [mptRentalStats, lightAndDrumRentalStats, totalSignCostStats, totalRatedLaborStats, totalTruckAndFuelStats, allTotals]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl">Bid Summary Dashboard</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-8 px-5">
          {/* MPT Discounting */}
          <DiscountChecks/>

          {/* Revenue and Profit Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revenue and Profit Summary</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">MPT</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {mptData.map(({ name, revenue, cost, grossProfit, grossMargin, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(revenue)}</div>
                    <div>{formatCurrency(cost)}</div>
                    <div>{formatCurrency(grossProfit || 0)}</div>
                    <div>{grossMargin.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Rental</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "TMA", highlight: false },
                  { name: "Arrow Board", highlight: false },
                  { name: "Message Board", highlight: false },
                  { name: "Speed Trailer", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flagging Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Flagging</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "Flagging", highlight: false },
                  { name: "Patterns", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permanent Signs Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Perm. Signs Items</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "PMS, Type B", highlight: false },
                  { name: "Reset PMS, Type B", highlight: false },
                  { name: "Remove PMS, Type B", highlight: false },
                  { name: "PMS, Type F", highlight: false },
                  { name: "Reset PMS, Type F", highlight: false },
                  { name: "Remove PMS, Type F", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* BID TOTAL */}
            {/* <div className="rounded-lg border mt-4">
              <div className={`grid grid-cols-5 gap-4 p-4 bg-muted font-medium`}>
                <div>BID TOTAL</div>
                <div>{formatCurrency(allTotals?.totalRevenue || 0)}</div>
                <div>{formatCurrency(allTotals?.totalCost || 0)}</div>
                <div>{formatCurrency(allTotals?.totalGrossProfit || 0)}</div>
                <div>{(((allTotals?.totalGrossProfit || 0) / (allTotals?.totalRevenue || 1)) / 100).toFixed(2)}%</div>
              </div>
            </div> */}
          </div>

          {/* Sale Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sale Items</h3>
            <div className="rounded-lg border overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-10 gap-4 p-4 border-b bg-muted/50">
                  <div className="font-medium">Item #</div>
                  <div className="font-medium">Item Name</div>
                  <div className="font-medium">Vendor</div>
                  <div className="font-medium">Quote Price</div>
                  <div className="font-medium">Mark Up</div>
                  <div className="font-medium">Margin</div>
                  <div className="font-medium">Unit Price</div>
                  <div className="font-medium">Quantity</div>
                  <div className="font-medium">Extended Price</div>
                  <div className="font-medium">Gross Profit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Equipment Summary</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Item</div>
                <div className="font-medium">Total</div>
                <div className="font-medium">Phase 1</div>
              </div>
              <div className="divide-y">
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
                  <div key={item} className="grid grid-cols-3 gap-4 p-4">
                    <div>{item}</div>
                    <div>0</div>
                    <div>0</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Labor Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Labor Summary (Hours)</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Type</div>
                <div className="font-medium">Hours</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "Rated Labor Hours", highlight: false },
                  { name: "Shop Labor Hours", highlight: false },
                  { name: "Permanent Sign Hours", highlight: false },
                  { name: "Total", highlight: true }
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-2 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>0.00 hrs</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Square Footage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Square Footage by Sign Type</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Type</div>
                <div className="font-medium">Area</div>
              </div>
              <div className="divide-y">
                {[
                  "High Intensity",
                  "Diamond Grade",
                  "Special"
                ].map((type) => (
                  <div key={type} className="grid grid-cols-2 gap-4 p-4">
                    <div>{type}</div>
                    <div>0.00 sq. ft.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}