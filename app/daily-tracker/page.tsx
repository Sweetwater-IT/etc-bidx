'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import DailyTrackerContent from "./DailyTrackerContent";
import { CardActions } from "@/components/card-actions";
import { useState, useCallback } from "react";
import { DateRange } from 'react-day-picker';
import { AddItemModal } from "@/components/add-item-modal";
import { DailyTrackerEntry } from "@/types/DailyTrackerEntry";
import { useDailyTrackerSWR } from '@/hooks/use-daily-tracker-swr';

export default function DailyTrackerPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyTrackerEntry | null>(null);

  const { mutate } = useDailyTrackerSWR();

  const handleCreateEntry = useCallback(() => {
    setSelectedEntry(null);
    setIsViewMode(false);
    setModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    mutate();
  }, [mutate]);

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
        <div className="mt-[-25px]">
          <SiteHeader />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <h1 className="text-3xl font-bold mt-[-30px] ml-6">Daily Tracker</h1>
              <CardActions
                hideCalendar={false}
                hideImportExport
                date={date}
                setDate={setDate}
                createButtonLabel="Add Item"
                onCreateClick={handleCreateEntry}
              />
              <DailyTrackerContent
                setModalOpen={setModalOpen}
                setIsViewMode={setIsViewMode}
                setSelectedEntry={setSelectedEntry}
                onModalSuccess={handleModalSuccess}
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      <AddItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entry={selectedEntry}
        isViewMode={isViewMode}
        onSuccess={handleModalSuccess}
      />
    </SidebarProvider>
  );
} 