'use client'
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import DashboardLayout from "@/components/Dashboard/layout"
import { PageContainer } from "@/components/PageContainer/PageContainer"
import { CustomersWrapper, CustomersWrapperRef } from "./CustomerWrapper"
import { CustomerActions } from "./components/CustomerActions"
import styles from './customers.module.css'
import { useRef } from "react"

export default function CustomersPage() {
	const customersWrapperRef = useRef<CustomersWrapperRef>(null);

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
				<div className="px-[30px] py-[25px]">
					<CustomerActions 
						onCreateClick={() => {
							customersWrapperRef.current?.openCreateModal();
						}} 
					/>
				</div>
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className={styles.section}>
							<DashboardLayout>
								<PageContainer title="">
									<CustomersWrapper ref={customersWrapperRef} />
								</PageContainer>
							</DashboardLayout>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
} 