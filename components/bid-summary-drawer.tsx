"use client"

import { useCallback, memo, useEffect, useState, Dispatch, SetStateAction } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, HelpCircle, Check } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"
import { WorksheetDialog } from "./sheets/WorksheetDialog"
import DiscountChecks from "./pages/active-bid/steps/discount-checks"
import RevenueAndProfitSummary from "./sheets/RevenueAndProfitSummary"
import FlaggingRevenueAndProfit from "./sheets/FlaggingRevenueAndProfit"
import RentalRevenueAndProfit from "./sheets/RentalRevenueAndProfit"
import SidebarLaborSummary from "./sheets/SidebarLaborSummary"
import SignSquareFootageTotals from "./sheets/SignSquareFootageTotals"
import BidSummaryByItem from "./sheets/BidSummaryByItem"
import EquipmentSummary from "./sheets/EquipmentSummary"
import SaleItemsSummary from "./sheets/SaleItemsSummary"
import SaleItemsRevenueAndProfit from "./sheets/SaleItemsRevenueAndProfit"

interface BidSummaryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const BidSummaryDrawer = memo(function BidSummaryDrawer({ open, onOpenChange }: BidSummaryDrawerProps) {

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-auto">
              {/* 1. MPT Discounting Section */}
              <DiscountChecks />

              {/* 2. Revenue and Profit Summary Section */}
              <BidSummaryByItem/>

              {/* 3. Sale Items Section */}
              <RevenueAndProfitSummary />

              <EquipmentSummary/>
              <div className="flex flex-col space-y-3 mt-12">
                <FlaggingRevenueAndProfit />
                <RentalRevenueAndProfit />
                <SaleItemsRevenueAndProfit/>
              </div>

                {/* 5. LABOR SUMMARY Section */}
                <SidebarLaborSummary/>

                {/* 6. Square Footage by Sign Type */}
                <SignSquareFootageTotals/>

                <SaleItemsSummary/>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
})