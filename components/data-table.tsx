/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Segments } from "@/components/ui/segments";
import { Button } from "@/components/ui/button";
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight, 
    MoreHorizontal,
    Archive,
    Edit,
    Eye,
    Trash,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export type LegacyColumn = {
    key: string;
    title: string;
    className?: string;
};



export interface DataTableProps<TData> {
    columns: LegacyColumn[] | readonly LegacyColumn[];
    data: TData[];
    segments?: {
        label: string;
        value: string;
    }[];
    segmentValue?: string;
    addButtonLabel?: string;
    onAddClick?: () => void;
    onSegmentChange?: (value: string) => void;
    stickyLastColumn?: boolean;
    onArchiveSelected?: (selectedRows: TData[]) => void;
    onDeleteSelected?: (selectedRows: TData[]) => void;
    tableRef?: React.RefObject<{
        resetRowSelection: () => void;
    } | null>;
    onRowClick?: (item: TData) => void;
    onViewDetails?: (item: TData) => void;
    onEdit?: (item: TData) => void;
    onArchive?: (item: TData) => void;
    onMarkAsBidJob?: (item: TData) => void; // Prop for marking a job as a bid job
    onUpdateStatus?: (item: TData, status: 'Bid' | 'No Bid' | 'Unset' | 'Won' | 'Pending' | 'Lost' | 'Draft' | 'Won - Pending') => void;
    
    // Pagination props
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    totalCount?: number;
}

function formatCellValue(value: any, key: string) {
    if (key === "status") {
        const variant = value.toLowerCase() === "urgent" ? "destructive" : value.toLowerCase() === "open" ? "default" : "secondary";
        return (
            <Badge variant={variant} className="font-medium">
                {value}
            </Badge>
        );
    }

    if (value instanceof Date) {
        return format(value, "MMM d, yyyy");
    }
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
            return format(new Date(value), "MMM d, yyyy");
        } catch {
            return value;
        }
    }
    return value;
}

export function DataTable<TData>({
    columns: legacyColumns,
    data,
    segments,
    segmentValue,
    addButtonLabel,
    onAddClick,
    onSegmentChange,
    stickyLastColumn = false,
    onArchiveSelected,
    onDeleteSelected,
    tableRef,
    onViewDetails,
    onEdit,
    onMarkAsBidJob,
    onUpdateStatus,
    // Pagination props
    pageCount,
    pageIndex = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    totalCount
}: DataTableProps<TData>) {
    const columns = React.useMemo(() => {
        return [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...legacyColumns.map((column) => ({
                id: column.key,
                accessorKey: column.key,
                header: column.title,
                cell: (info) => {
                    return formatCellValue(info.getValue(), column.key);
                },
            })),
            {
                id: "actions",
                header: () => <div className="text-center">Actions</div>,
                cell: ({ row }) => {
                    const handleDelete = useCallback(
                        (e: React.MouseEvent) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onDeleteSelected) {
                                console.log('Delete clicked for row:', row.original);
                                try {
                                    onDeleteSelected([row.original as TData]);
                                    console.log('onDeleteSelected called successfully');
                                } catch (error) {
                                    console.error('Error calling onDeleteSelected:', error);
                                }
                            }
                        },
                        [row.original]
                    );

                    const handleArchive = useCallback(
                        (e: React.MouseEvent) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onArchiveSelected) {
                                console.log('Archive clicked for row:', row.original);
                                try {
                                    onArchiveSelected([row.original as TData]);
                                    console.log('onArchiveSelected called successfully');
                                } catch (error) {
                                    console.error('Error calling onArchiveSelected:', error);
                                }
                            }
                        },
                        [row.original]
                    );

                    return (
                        <div className={cn("flex justify-center", stickyLastColumn && "sticky right-0 bg-background")}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-[200]">
                                    {onMarkAsBidJob && 'status' in row.original && (row.original as any).status === 'Bid' && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onMarkAsBidJob(row.original as TData);
                                            }}
                                        >
                                            Bid Job
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {onUpdateStatus && 'status' in row.original && segments && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <DropdownMenuItem>
                                                    Mark as
                                                    <span className="ml-auto">
                                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M6 3L10 7.5L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                                        </svg>
                                                    </span>
                                                </DropdownMenuItem>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="right" sideOffset={2} className="w-36">
                                                {segments
                                                    .filter(segment => {
                                                        if (segment.value === 'all' || segment.value === 'archived') {
                                                            return false;
                                                        }
                                                        
                                                        const currentStatus = String((row.original as any).status);
                                                        let currentSegmentValue = '';
                                                        
                                                        if (currentStatus === 'Bid') {
                                                            currentSegmentValue = 'bid';
                                                        } else if (currentStatus === 'No Bid') {
                                                            currentSegmentValue = 'no-bid';
                                                        } else if (currentStatus === 'Unset') {
                                                            currentSegmentValue = 'unset';
                                                        } else {
                                                            currentSegmentValue = currentStatus.toLowerCase().replace(/\s+/g, '-');
                                                        }
                                                        
                                                        return segment.value !== currentSegmentValue;
                                                    })
                                                    .map(segment => {
                                                        let statusValue: string;
                                                        
                                                        if ('contractNumber' in row.original && !('lettingDate' in row.original)) {
                                                            if (segment.value === 'bid') statusValue = 'Bid';
                                                            else if (segment.value === 'no-bid') statusValue = 'No Bid';
                                                            else if (segment.value === 'unset') statusValue = 'Unset';
                                                            else statusValue = segment.value;
                                                        } 
                                                        else if ('lettingDate' in row.original) {
                                                            if (segment.value === 'won') statusValue = 'Won';
                                                            else if (segment.value === 'pending') statusValue = 'Pending';
                                                            else if (segment.value === 'lost') statusValue = 'Lost';
                                                            else if (segment.value === 'draft') statusValue = 'Draft';
                                                            else if (segment.value === 'won-pending') statusValue = 'Won - Pending';
                                                            else statusValue = segment.value;
                                                        }
                                                        else {
                                                            statusValue = segment.value;
                                                        }
                                                        
                                                        const cleanLabel = segment.label.split(' (')[0];
                                                        
                                                        return (
                                                            <DropdownMenuItem
                                                                key={segment.value}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    onUpdateStatus(row.original as TData, statusValue as any);
                                                                }}
                                                            >
                                                                {cleanLabel}
                                                            </DropdownMenuItem>
                                                        );
                                                    })
                                                }
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                    
                                    {onViewDetails && (
                                        <DropdownMenuItem 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onViewDetails(row.original as TData);
                                            }}
                                        >
                                            View details
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {onEdit && (
                                        <DropdownMenuItem 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onEdit(row.original as TData);
                                            }}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {segmentValue === 'archived' && onDeleteSelected && (
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {segmentValue !== 'archived' && onArchiveSelected && (
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onClick={handleArchive}
                                        >
                                            Archive
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            }
        ];
    }, [legacyColumns, stickyLastColumn, onArchiveSelected, onDeleteSelected, segmentValue, onViewDetails, onEdit, onMarkAsBidJob, onUpdateStatus, segments]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: pageCount || Math.ceil(data.length / (pageSize || 25)),
        state: {
            pagination: {
                pageIndex: pageIndex || 0,
                pageSize: pageSize || 25,
            },
        },
        onPaginationChange: updater => {
            if (typeof updater === 'function') {
                const newPagination = updater({
                    pageIndex: pageIndex || 0,
                    pageSize: pageSize || 25,
                });
                onPageChange?.(newPagination.pageIndex);
                onPageSizeChange?.(newPagination.pageSize);
            }
        },
    });
    
    // Expose the resetRowSelection method via ref
    React.useImperativeHandle(tableRef, () => ({
        resetRowSelection: () => {
            table.toggleAllRowsSelected(false);
        }
    }), [table]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-6 mb-3">
                {segments && <Segments segments={segments} value={segmentValue} onChange={onSegmentChange} />}

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="icon">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[200]">
                            {table.getSelectedRowModel().rows.length > 0 && (
                                <>
                                    {segmentValue === 'archived' && onDeleteSelected && (
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                event.preventDefault();
                                                console.log('Bulk delete clicked for rows:', table.getSelectedRowModel().rows.map(row => row.original));
                                                onDeleteSelected(table.getSelectedRowModel().rows.map(row => row.original));
                                            }}
                                        >
                                            Delete Selected
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {segmentValue !== 'archived' && onArchiveSelected && (
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                event.preventDefault();
                                                console.log('Bulk archive clicked for rows:', table.getSelectedRowModel().rows.map(row => row.original));
                                                onArchiveSelected(table.getSelectedRowModel().rows.map(row => row.original));
                                            }}
                                        >
                                            Archive Selected
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {addButtonLabel && (
                        <Button size="sm" onClick={onAddClick}>
                            <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
                            {addButtonLabel}
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-6">
                <div className="rounded-md border">
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            const isActions = header.column.id === "actions";
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    style={isActions ? { position: "sticky", right: 0 } : undefined}
                                                    className={isActions ? "z-[100] bg-muted/95 shadow-[-12px_0_16px_-6px_rgba(0,0,0,0.15)]" : undefined}
                                                >
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/50",
                                                row.getIsSelected() && "bg-muted"
                                            )}
                                            onClick={(e) => {
                                                //don't open sidebar for checkbox for each row
                                                const target = e.target as HTMLElement;
                                                
                                                if (target.dataset.slot === 'checkbox') {
                                                    return;
                                                }
                                                
                                                const checkbox = target.closest('[data-slot="checkbox"]');
                                                if (checkbox) {
                                                    return;
                                                }
                                                
                                                if (onViewDetails) {
                                                    onViewDetails(row.original as TData);
                                                }
                                            }}
                                            
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const isActions = cell.column.id === "actions";
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            isActions && stickyLastColumn ? "sticky right-0 bg-background" : ""
                                                        )}
                                                        onClick={(e) => {
                                                            if (isActions) {
                                                                e.stopPropagation()
                                                            }
                                                        }}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            
            {/* Pagination */}
            {onPageChange && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {totalCount !== undefined && (
                            <p>Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} entries</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => onPageSizeChange?.(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pageSize.toString()} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[25, 50].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => onPageChange(0)}
                                disabled={pageIndex === 0}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange(pageIndex - 1)}
                                disabled={pageIndex === 0}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center justify-center text-sm font-medium">
                                Page {pageIndex + 1} of {pageCount || 1}
                            </div>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange(pageIndex + 1)}
                                disabled={pageIndex === (pageCount || 1) - 1}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => onPageChange((pageCount || 1) - 1)}
                                disabled={pageIndex === (pageCount || 1) - 1}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
