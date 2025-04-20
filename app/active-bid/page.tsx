import { AppSidebar } from "@/components/app-sidebar";
import StepsMain from "@/components/pages/steps-main";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export interface FormData {
    contractNumber?: string;
    owner?: string;
    county?: string;
    branch?: string;
    township?: string;
    division?: string;
    startDate?: string;
    endDate?: string;
    lettingDate?: string;
    srRoute?: string;
    dbePercentage?: string;
    [key: string]: string | undefined;
}

export default function ActiveBidPage() {
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
                <div className="flex flex-1 flex-col -mt-8">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-6">
                                <div className="mb-6">
                                    <Link href="/jobs/active-bids" className={cn(buttonVariants({ variant: "ghost" }), "gap-2 -ml-2 mb-4")}>
                                        <MoveLeft className="w-3 mt-[1px]" /> Back to Bid List
                                    </Link>
                                    <h1 className="text-3xl font-bold">Create New Bid</h1>
                                </div>

                                {/* main steps */}
                                <StepsMain />
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
