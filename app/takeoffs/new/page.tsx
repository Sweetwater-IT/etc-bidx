import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "../sign-order/SignOrderContentSimple";

// Function to extract the ID from the search params
function getOrderId(searchParams: any) {
    const id = searchParams.id;
    return typeof id === 'string' ? id : undefined;
}

export default async function NewSignOrderPage({
    searchParams,
}: {
    searchParams: any;
}) {
    // Extract the order ID from the search params
    const orderId = getOrderId(searchParams);
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
                <SiteHeader>
                    <h1 className="text-3xl font-bold mt-2 ml-0">Sign Order Number<span id="order-number">{/* Order number will be populated dynamically */}</span></h1>
                </SiteHeader>
                    <EstimateProvider>
                        <SignOrderContentSimple/>
                    </EstimateProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}