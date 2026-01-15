import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import ContractManagementTable from "./ContractManagementTable";

export default function ContractsPage() {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <ContractManagementTable />
        </div>
      </div>
    </div>
  );
}
