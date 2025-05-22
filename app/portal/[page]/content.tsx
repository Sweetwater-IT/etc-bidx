"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { CardActions } from "@/components/card-actions"
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useLoading } from "@/hooks/use-loading";
import { useCallback, useState, useRef, useEffect } from "react"
import { toast } from "sonner";
import { CreateBranchSheet } from '@/components/create-branch-sheet';
import { CreateFlagRateSheet } from '@/components/create-flag-rate-sheet';
import { EditFlagRateSheet } from "@/components/edit-flag-rate-sheet";
import { EditBranchSheet } from "@/components/edit-branch-sheet";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";

type Branch = {
    id: number;
    name: string;
    address: string;
    shop_rate: number;
}

type FlagRate = {
    id: number;
    fuel_economy_mpg: number;
    truck_dispatch_fee: number;
    worker_comp: number;
    general_liability: number;
}

type Page = "branches" | "counties" | "bid-items" | "users" | "fragging-rates" |  "payback-calculations"

interface Column {
  key: string,
  title: string,
  className?: string
}

export function PortalPageContent({ page: Page }) {

    // BRANCHES
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchesPageCount, setBranchesPageCount] = useState(0);
    const [branchesPageIndex, setBranchesPageIndex] = useState(0);
    const [branchesPageSize, setBranchesPageSize] = useState(25);
    const [branchesTotalCount, setBranchesTotalCount] = useState(0);

    const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
    const [showEditBranchDialog, setShowEditBranchDialog] = useState(false);
    const [openConfirmArchiveDialog,  setShowConfirmArchiveDialog] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(undefined);
    const [selectedBranchesToArchive, setSelectedBranchesToArchive] = useState<Branch[]>([]);
    const branchesTableRef = useRef<{ resetRowSelection: () => void }>(null);

    // FRAGGING RATES
    const [flagRates, setFlagRates] = useState<FlagRate[]>([]);
    const [flagRatesPageCount, setFlagRatesPageCount] = useState(0);
    const [flagRatesPageIndex, setFlagRatesPageIndex] = useState(0);
    const [flagRatesPageSize, setFlagRatesPageSize] = useState(25);
    const [flagRatesTotalCount, setFlagRatesTotalCount] = useState(0);

    const [showCreateFlagRateDialog, setShowCreateFlagRateDialog] = useState(false);
    const [showEditFlagRateDialog, setShowEditFlagRateDialog] = useState(false);
    const [openConfirmArchiveFlagRateDialog, setShowConfirmArchiveFlagRateDialog] = useState(false);
    const [selectedFlagRate, setSelectedFlagRate] = useState<FlagRate | undefined>(undefined);
    const [selectedFlagRatesToArchive, setSelectedFlagRatesToArchive] = useState<FlagRate[]>([]);
    const flagRatesTableRef = useRef<{ resetRowSelection: () => void }>(null);

    const isBranches = Page === "branches"
    const isCounties = Page === "counties"
    const isBidItems = Page === "bid-items"
    const isUsers = Page === "users"
    const isFlaggingRates = Page === "flagging-rates"
    const isPaybackCalculations = Page === "payback-calculations"

    const BRANCHES_COLUMNS: Column[] = [
        { key: "name", title: "Name" },
        { key: "address", title: "Address" },
        { key: "shop_rate", title: "Shop Rate" },
    ];

      const FLAGGING_COLUMNS: Column[] = [
        { key: "fuel_economy_mpg", title: "Fuel Economy (mpg)" },
        { key: "truck_dispatch_fee", title: "Truck Dispatch fee" },
        { key: "worker_comp", title: "Worker Company" },
        { key: "general_liability", title: "General Liability" }
    ];


    // CLICK HANDLERS
    const handleCreateClick = useCallback(() => {
        if (isBranches) {
            setShowCreateBranchDialog(true);
        } else if (isFlaggingRates) {
            setShowCreateFlagRateDialog(true)
        }
    }, [isBranches, isFlaggingRates]);

    const handleEditClick = useCallback((selected: any) => {
        if (isBranches) {
            setSelectedBranch(selected)
            setShowEditBranchDialog(true)
        } else if (isFlaggingRates) {
            setSelectedFlagRate(selected)
            setShowEditFlagRateDialog(true)
        }
    }, [isBranches, isFlaggingRates]);

    const handleArchieveClick = useCallback((selected: any) => {
        if (isBranches) {
            setSelectedBranch(selected)
            setShowConfirmArchiveDialog(true)
        } 
    }, [isBranches]);


    // ACTION HANDLERS
    const handleArchiveBranches = async (branch: Branch) => {
        try {
            const res = await fetch(`/api/branches/${branch.id}`, { method: 'DELETE' })
            if (!res.ok) throw await res.json()

            loadBranches()
            toast.success('Branch archived')

        } catch (err: any) {
            toast.error(err?.message || 'Error archiving branch')
        } 
    }

    const handleArchiveFlagRates = async (fRate: FlagRate) => {
        try {
            const res = await fetch(`/api/flagging/${fRate.id}`, { method: 'DELETE' })
            if (!res.ok) throw await res.json()

            loadFlagRates()
            toast.success('Flagging rate archived')

        } catch (err: any) {
            toast.error(err?.message || 'Error archiving rate')
        } 
    }



    const initiateArchiveBranch = (selectedBranches: Branch[]) => {
        setSelectedBranchesToArchive(selectedBranches);
        setShowConfirmArchiveDialog(true);
    }

    const initiateArchiveFlagRate = (selectedFlagRates: FlagRate[]) => {
        setSelectedFlagRatesToArchive(selectedFlagRates);
        setShowConfirmArchiveFlagRateDialog(true);
    }


    // LOADERS
    const loadBranches = useCallback(async () => {
        try {
            console.log("Loading branches...");
            startLoading();

            const options: any = {
                limit: branchesPageSize,
                page: branchesPageIndex + 1
            };

            const params = new URLSearchParams();
            params.append("page", options.page);
            params.append("limit", options.limit);

            const response = await fetch(`/api/branches?${params}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch branches");
            }

            const result = await response.json();
            const { pagination } = result;

            const data = result.data.map(item => {
                return Object.fromEntries(
                    Object.entries(item).map(([key, value]) => [
                        key,
                        key === "shop_rate" ?  `$${value}` : value
                    ])
                );
            });

            setBranches(data);
            setBranchesPageCount(pagination.pageCount);
            setBranchesTotalCount(pagination.totalCount);

        } catch (error) {
            console.error("Error loading branches: ", error);
            toast.error("Failed to load branches, please try again!");
            
        } finally {
            stopLoading();
        }

    }, [])

    
    const loadFlagRates = useCallback(async () => {
        try {
            console.log("Loading flagging rates...");
            startLoading();

            const options: any = {
                limit: branchesPageSize,
                page: branchesPageIndex + 1
            };

            const params = new URLSearchParams();
            params.append("pagination", "true");
            params.append("page", options.page);
            params.append("limit", options.limit);

            const response = await fetch(`/api/flagging?${params}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch branches");
            }

            const result = await response.json();
            const { pagination } = result;


            const data = result.data.map(item => {
                return Object.fromEntries(
                    Object.entries(item).map(([key, value]) => [
                        key,
                        key === "id" ? value : `$${value}`
                    ])
                );
            });

            setFlagRates(data);
            setFlagRatesPageCount(pagination.pageCount);
            setFlagRatesTotalCount(pagination.totalCount);

        } catch (error) {
            console.error("Error loading branches: ", error);
            toast.error("Failed to load branches, please try again!");
            
        } finally {
            stopLoading();
        }

    }, [])


    useEffect(() => {
        if (isBranches) {
            loadBranches();
        } else if (isFlaggingRates) {
            loadFlagRates()
        }
    }
    , [loadBranches, isBranches, isFlaggingRates, loadFlagRates]);

    const createButtonLabel: string =
        isBranches ? "Create Branch" :
        isCounties ? "Create County" :
        isBidItems ? "Create Bid Item" :
        isUsers ? "Create User" :
        isFlaggingRates ? "Create Rate" : 
        "Create Payback Calculation";

    const data = branches
    const { startLoading, stopLoading } = useLoading();

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
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <CardActions
                                                createButtonLabel={createButtonLabel}
                                                hideCalendar
                                                goUpActions
                                                onCreateClick={
                                                    handleCreateClick
                                                }
                                            />
                                    </div>
                                </div>
                            </div>

                            { isBranches && (
                                <>
                                <DataTable<Branch>
                                    data={data as Branch[]}
                                    columns={BRANCHES_COLUMNS}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveBranch}
                                    tableRef={branchesTableRef}
                                    selectedItem={
                                       selectedBranch
                                            ? selectedBranch
                                            : undefined
                                    }
                                    onEdit={(item) => {
                                        handleEditClick(item as Branch);
                                    }}
                                    onArchive={(item) => {
                                        handleArchieveClick(item)
                                    }}
                                    pageCount={branchesPageCount}
                                    pageIndex={branchesPageIndex}
                                    pageSize={branchesPageSize}
                                    onPageChange={setBranchesPageIndex}
                                    onPageSizeChange={setBranchesPageSize}
                                    totalCount={branchesTotalCount}
                                />

                                <CreateBranchSheet
                                    open={showCreateBranchDialog}
                                    onOpenChange={setShowCreateBranchDialog}
                                    onSuccess={loadBranches}
                                />
                                </>
                            ) }


                            { isFlaggingRates && (
                                <>
                                <DataTable<FlagRate>
                                    data={flagRates as FlagRate[]}
                                    columns={FLAGGING_COLUMNS}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveFlagRate}
                                    tableRef={flagRatesTableRef}
                                    selectedItem={
                                        selectedFlagRate ? selectedFlagRate : undefined
                                    }
                                    onEdit={(item) => {
                                        handleEditClick(item as FlagRate);
                                    }}
                                    onArchive={(item) => {
                                        handleArchiveFlagRates(item);
                                    }}
                                    pageCount={flagRatesPageCount}
                                    pageIndex={flagRatesPageIndex}
                                    pageSize={flagRatesPageSize}
                                    onPageChange={setFlagRatesPageIndex}
                                    onPageSizeChange={setFlagRatesPageSize}
                                    totalCount={flagRatesTotalCount}
                                />
                                <CreateFlagRateSheet
                                    open={showCreateFlagRateDialog}
                                    onOpenChange={setShowCreateFlagRateDialog}
                                    onSuccess={() => {
                                        loadFlagRates()
                                    }}
                                />
                                
                                {selectedFlagRate && (
                                    <EditFlagRateSheet
                                    open={showEditFlagRateDialog}
                                    onOpenChange={setShowEditFlagRateDialog}
                                    onSuccess={() => {
                                        loadFlagRates()
                                    }}
                                    rate={selectedFlagRate}
                                />
                                )}
                                </>

                            ) }


                            { selectedBranch && (
                                <>
                                <EditBranchSheet
                                    open={showEditBranchDialog}
                                    onOpenChange={setShowEditBranchDialog}
                                    onSuccess={loadBranches}
                                    branch={selectedBranch}
                                />
                                <ConfirmArchiveDialog
                                    isOpen={openConfirmArchiveDialog}
                                    onClose={() =>  setShowConfirmArchiveDialog(false)}
                                    onConfirm={() => {
                                        handleArchiveBranches(selectedBranch)
                                    }}
                                    itemCount={selectedBranchesToArchive.length}
                                    itemType="branch"
                                />
                                </>
                            ) }

                            
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );

}

