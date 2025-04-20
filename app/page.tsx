import { AppSidebar } from "@/components/app-sidebar";
import CalendarInDashboard from "@/components/calendar-in-dashboard";
import { ChartBarRow } from "@/components/chart-bar-row";
import { ChartPieRow } from "@/components/chart-pie-row";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { TableAndScatter } from "@/components/table-and-scatter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { homeCards } from "@/data/home-cards";
import { RotateCcw } from "lucide-react";

export default function Page() {
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
                            <div className="px-6 flex gap-4 justify-end items-center -mt-15">
                                <RotateCcw className="w-4 cursor-pointer hover:text-muted-foreground ml-auto" />
                                <CalendarInDashboard />
                            </div>

                            <SectionCards data={homeCards} />
                            <ChartPieRow />
                            <ChartBarRow />
                            <TableAndScatter />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
