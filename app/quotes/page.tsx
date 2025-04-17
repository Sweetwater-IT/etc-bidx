"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { jobsData, type JobData } from "@/data/jobs-data";
import { Button } from "@/components/ui/button";
import { IconDownload, IconPlus, IconUpload } from "@tabler/icons-react";

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

export default function QuotesPage() {
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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
              <div className="flex items-center justify-end px-6 w-full -mb-4">

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <IconUpload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <IconDownload className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
                    Create Quote
                  </Button>
                </div>
              </div>

              <DataTable<JobData>
                data={jobsData.available}
                columns={COLUMNS}
                segments={SEGMENTS}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 