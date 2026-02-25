"use client"

import { memo, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { X } from "lucide-react"
import DiscountChecks from "./pages/active-bid/steps/discount-checks"
import { useEstimate } from "@/contexts/EstimateContext"
import RevenueAndProfitSummary from "./sheets/RevenueAndProfitSummary"
import FlaggingRevenueAndProfit from "./sheets/FlaggingRevenueAndProfit"
import RentalRevenueAndProfit from "./sheets/RentalRevenueAndProfit"
import SidebarLaborSummary from "./sheets/SidebarLaborSummary"
import SignSquareFootageTotals from "./sheets/SignSquareFootageTotals"
import BidSummaryByItem from "./sheets/BidSummaryByItem"
import EquipmentSummary from "./sheets/EquipmentSummary"
import SaleItemsSummary from "./sheets/SaleItemsSummary"
import SaleItemsRevenueAndProfit from "./sheets/SaleItemsRevenueAndProfit"
import { EstimateData } from "@/lib/exportBidsToExcel"
import { useEstimate } from "@/contexts/EstimateContext"
import { AdminData } from "@/types/TAdminData"
import { MPTRentalEstimating } from "@/types/MPTEquipment"
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject"
import { defaultPermanentSignsObject } from "@/types/default-objects/defaultPermanentSignsObject"

interface BidSummaryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBid?: EstimateData
  disableDiscounts?: boolean
}

export const BidSummaryDrawer = memo(function BidSummaryDrawer({ open, onOpenChange, defaultBid, disableDiscounts }: BidSummaryDrawerProps) {

  const { dispatch, mptRental } = useEstimate();

  useEffect(() => {
    if(!defaultBid) return;
    //copy functions handle databse to frontend conversions automatically
    dispatch({ type: 'COPY_ADMIN_DATA', payload: defaultBid.admin_data as AdminData})
    dispatch({ type: 'COPY_MPT_RENTAL', payload: defaultBid.mpt_rental as MPTRentalEstimating})
    dispatch({ type: 'COPY_EQUIPMENT_RENTAL', payload: defaultBid.equipment_rental ?? []})
    dispatch({ type: 'COPY_FLAGGING', payload: defaultBid.flagging ?? defaultFlaggingObject})
    dispatch({ type: 'COPY_SERVICE_WORK', payload: defaultBid.service_work ?? defaultFlaggingObject})
    dispatch({ type: 'COPY_SALE_ITEMS', payload: defaultBid.sale_items ?? []})
    dispatch({ type: 'COPY_PERMANENT_SIGNS', payload: defaultBid.permanent_signs ?? defaultPermanentSignsObject });
  }, [defaultBid])

  return (
    <Drawer open={open} onDrag={() => {}} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="bid-summary-drawer">
        <style jsx global>{`
          .bid-summary-drawer {
            width: 95vw !important;
            max-width: none !important;
            height: 100vh !important;
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
            height: 100vh !important;
          }
          
          @media (min-width: 640px) {
            .bid-summary-drawer[data-vaul-drawer-direction="right"] {
              width: 80vw !important;
              max-width: none !important;
            }
          }
        `}</style>

        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b z-10 bg-white pb-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <DrawerTitle className="text-xl font-semibold">Bid Summary Dashboard</DrawerTitle>
              <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100">
                <X className="h-4 w-4" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="flex flex-wrap space-x-2">
              {/* Main content area */}
              <div className="flex flex-col space-y-2 flex-2 min-w-0">
                {/* Top row - Discount Checks and Bid Summary */}
                <div className="flex space-x-2">
                  <div className="flex-1 min-w-0">
                    <DiscountChecks 
                      key={mptRental?.phases?.map(p => p.days).join(',') || 'default'}
                      editableDiscounts={!defaultBid && !disableDiscounts}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <BidSummaryByItem />
                  </div>
                </div>
                
                {/* Bottom row - Split into left and right sections */}
                <div className="flex space-x-2">
                  {/* Left section - Revenue summaries */}
                  <div className="flex flex-col flex-1 space-y-2 min-w-0">
                    <RevenueAndProfitSummary />
                  </div>
                  
                  {/* Right section - Labor, Sign summaries, and SaleItemsSummary */}
                  <div className="flex flex-col flex-[.5] space-y-2 min-w-0">
                    <SidebarLaborSummary />
                    <SignSquareFootageTotals />
                    {/* SaleItemsSummary below Labor and Sign summaries */}
                    <div className="w-[200%]"> {/* Extend width to make it 2/3 of total available space */}
                      <SaleItemsSummary />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - Just Equipment Summary */}
              <div className="flex-shrink-0 min-w-0">
                <EquipmentSummary />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
})