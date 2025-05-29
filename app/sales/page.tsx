"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { SALE_TRACKER_COLUMNS, saleTrackerData } from "@/data/sale-tracker";
import { SectionCards } from "@/components/section-cards";
import { CardActions } from "@/components/card-actions";
import { CreateSaleItemSheet } from "@/components/create-sale-item-sheet";
import { useState } from "react";

const SALE_TRACKER_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Archived", value: "archived" },
];

const saleTrackerCards = [
  {
    title: "Total Sales",
    value: "$6,750",
    change: 12,
    trend: "up",
    description: "Total value of all sales"
  },
  {
    title: "Average Price",
    value: "$97.50",
    change: 5,
    trend: "up",
    description: "Average price per item"
  },
  {
    title: "Pending Items",
    value: "1",
    change: 8,
    trend: "up",
    description: "Items awaiting approval"
  },
  {
    title: "Response Rate",
    value: "89%",
    change: -2,
    trend: "down",
    description: "Approval rate"
  }
];

export default function SalesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-3 md:py-6">
              <CardActions
                createButtonLabel="Create Sale Item"
                onCreateClick={() => setSheetOpen(true)}
              />
              
              <SectionCards data={saleTrackerCards} />

              <DataTable
                data={saleTrackerData}
                columns={Array.from(SALE_TRACKER_COLUMNS)}
                segments={SALE_TRACKER_SEGMENTS}
              />

              <CreateSaleItemSheet 
                open={sheetOpen} 
                onOpenChange={setSheetOpen} 
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 
