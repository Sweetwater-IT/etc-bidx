import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import CustomersContent from "./CustomersContent";

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

export default function CustomersPage() {

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
                <div className="@container/main flex flex-1 flex-col py-4 gap-2 md:gap-6 md:py-6">
                    <CustomersContent />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
} 
