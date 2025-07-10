import { AppSidebar } from "@/components/app-sidebar";
import CalendarInDashboard from "@/components/calendar-in-dashboard";
import { ChartBarRow } from "@/components/chart-bar-row";
import { ChartPieRow } from "@/components/chart-pie-row";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { TableAndScatter } from "@/components/table-and-scatter";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RotateCcw } from "lucide-react";
import { getEstimateData } from "@/lib/getEstimateData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your company's performance metrics and key indicators",
};

//next 15 async props
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const awaitedParams = await searchParams;
  // Extract date parameters for filtering
  const startDate =
    typeof awaitedParams?.startDate === "string"
      ? awaitedParams.startDate
      : undefined;
  const endDate =
    typeof awaitedParams?.endDate === "string"
      ? awaitedParams.endDate
      : undefined;

  // Fetch the estimate data with optional date filtering
  const estimateData = await getEstimateData(startDate, endDate);

  
  // Create summary cards data based on the fetched metrics
  const summaryCards = [
    // Remove greeting card, handled by DashboardGreeting
    {
      title: "Total Bids",
      value: estimateData
        ? estimateData.bid_metrics.total_bids.toLocaleString()
        : "0",
    },
    {
      title: "Win/Loss Ratio",
      value: estimateData
        ? `${estimateData.bid_metrics.win_loss_ratio.toFixed(1)}%`
        : "0.0",
    },
    {
      title: "Won Jobs",
      value: estimateData
        ? estimateData.bid_metrics.total_won_jobs.toLocaleString()
        : "0",
    },
    {
      title: "Total Revenue",
      value: estimateData
        ? `$${estimateData.bid_metrics.total_revenue.toLocaleString()}`
        : "$0",
    },
    {
      title: "Avg. MPT Gross Margin",
      value: estimateData
        ? `${estimateData.bid_metrics.mpt_gross_margin.toFixed(1)}%`
        : "0.0%",
    },
  ];

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

              {/* Summary Cards Row */}
              <div className="px-6">
                {/* Greeting Section - No Card */}
                <div className="mb-6">
                  <DashboardGreeting />
                </div>

                {/* Metrics Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {summaryCards.map((card, index) => (
                    <Card key={index} className="h-full">
                      <CardHeader>
                        <CardDescription>{card.title}</CardDescription>
                        <CardTitle className="text-lg font-semibold tabular-nums">
                          {card.value}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pass the estimate data to our visualization components */}
              <ChartPieRow
                data={estimateData ? estimateData : undefined}
                startDate={startDate}
                endDate={endDate}
              />
              <ChartBarRow data={estimateData} />
              <TableAndScatter data={estimateData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
