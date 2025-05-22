"use client";

import { AppSidebar, data } from "@/components/app-sidebar"
import { CardActions } from "@/components/card-actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useLoading } from "@/hooks/use-loading";
import { useCallback, useState, useRef, useEffect } from "react"
import { toast } from "sonner";
import { CreateBranchSheet } from '@/components/create-branch-sheet';
import { EditBranchSheet } from "@/components/edit-branch-sheet";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";

type Branch = {
    id: number;
    name: string;
    address: string;
    shop_rate: number;
}

type Page = "branches" | "counties" | "bid-items" | "users" | "payback-calculations"

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
    const [showBranchDetailsDialog, setShowBranchDetailsDialog] = useState(false);
    const [openConfirmArchiveDialog,  setShowConfirmArchiveDialog] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(undefined);
    const [selectedBranchesToArchive, setSelectedBranchesToArchive] = useState<Branch[]>([]);
    const branchesTableRef = useRef<{ resetRowSelection: () => void }>(null);

    const isBranches = Page === "branches"
    const isCounties = Page === "counties"
    const isBidItems = Page === "bid-items"
    const isUsers = Page === "users"
    const isPaybackCalculations = Page === "payback-calculations"

    const BRANCHES_COLUMNS: Column[] = [
        { key: "name", title: "Name" },
        { key: "address", title: "Address" },
        { key: "shop_rate", title: "Shop Rate" },
    ];

    const handleCreateClick = useCallback(() => {
        if (isBranches) {
            setShowCreateBranchDialog(true);
        } 
    }, [isBranches]);

    const handleEditClick = useCallback((selected: any) => {
        if (isBranches) {
            setSelectedBranch(selected)
            setShowEditBranchDialog(true)
        } 
    }, [isBranches]);


    const handleArchieveClick = useCallback((selected: any) => {
        if (isBranches) {
            setSelectedBranch(selected)
            setShowConfirmArchiveDialog(true)
        } 
    }, [isBranches]);

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

    const initiateArchiveBranch = (selectedBranches: Branch[]) => {
        setSelectedBranchesToArchive(selectedBranches);
        setShowConfirmArchiveDialog(true);
    }

    const loadBranches = useCallback(async () => {
        try {
            console.log("Loading branches...");
            startLoading();

            const response = await fetch("/api/branches", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch branches");
            }

            const options: any = {
                limit: branchesPageSize,
                page: branchesPageIndex
            };

            const result = await response.json();
            const { pagination, data } = result;


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


    useEffect(() => {
        if (isBranches) {
            loadBranches();
        }
    }
    , [loadBranches, isBranches]);

    const createButtonLabel: string =
        isBranches ? "Create Branch" :
        isCounties ? "Create County" :
        isBidItems ? "Create Bid Item" :
        isUsers ? "Create User" :
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
                                <DataTable<Branch>
                                    data={data as Branch[]}
                                    columns={BRANCHES_COLUMNS}
                                    stickyLastColumn
                                    onArchiveSelected={initiateArchiveBranch}
                                    tableRef={branchesTableRef}
                                    selectedItem={
                                        showBranchDetailsDialog && selectedBranch
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
                                    onPageChange={setBranchesPageSize}
                                    onPageSizeChange={setBranchesPageSize}
                                    totalCount={branchesTotalCount}
                                />
                            ) }

                            <CreateBranchSheet
                                open={showCreateBranchDialog}
                                onOpenChange={setShowCreateBranchDialog}
                                onSuccess={loadBranches}
                                />


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

