import { SidebarProvider } from "@/components/ui/sidebar";
import { SignOrderBuilderProvider } from "@/contexts/SignOrderBuilderContext";
import SignOrderContentSimple from "../../SignOrderContentSimple";

export default async function EditSignOrderPage({ params} : {params: any}) {const resolvedParams = await params;
const signId = resolvedParams.id

return (
    <SidebarProvider
        style={
            {
                "--sidebar-width": "calc(var(--spacing) * 68)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
        }
    >
        <div className="flex h-screen w-screen flex-col">
            <div className="flex-1 overflow-auto">
                <SignOrderBuilderProvider>
                    <SignOrderContentSimple signOrderId={signId}/>
                </SignOrderBuilderProvider>
            </div>
        </div>
    </SidebarProvider>
);}
