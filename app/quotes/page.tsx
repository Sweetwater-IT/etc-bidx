"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { jobsData, type JobData } from "@/data/jobs-data";
import { CardActions } from "@/components/card-actions";
import { CreateQuoteSheet } from "@/components/create-quote-sheet";
import { useState } from "react";

const COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Archived", value: "archived" }
];

export default function QuotesPage() {
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-0 -mb-3">
                <CardActions
                  createButtonLabel="Create Quote"
                  onCreateClick={() => setIsCreateQuoteOpen(true)}
                  hideCalendar
                  goUpActions
                />
              </div>

              <DataTable<JobData>
                data={jobsData.available}
                columns={COLUMNS}
                segments={SEGMENTS}
                stickyLastColumn
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      <CreateQuoteSheet 
        open={isCreateQuoteOpen}
        onOpenChange={setIsCreateQuoteOpen}
      />
    </SidebarProvider>
  );
} 
