/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Segments } from "@/components/ui/segments";
import { Button } from "@/components/ui/button";
import { IconPlus, IconDotsVertical, IconFilter, IconArrowsSort } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { MoreHorizontal } from "lucide-react";

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
    // Keeping onDeleteSelected for future implementation
    onDeleteSelected?: (selectedRows: TData[]) => void;
    tableRef?: React.RefObject<{
        resetRowSelection: () => void;
    } | null>;
    onRowClick?: (item: TData) => void;
    onViewDetails?: (item: TData) => void;
    onEdit?: (item: TData) => void;
    onArchive?: (item: TData) => void;
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
    onRowClick,
    onViewDetails,
    onEdit,
    onArchive
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
    }, [legacyColumns, stickyLastColumn, onArchiveSelected, onDeleteSelected, segmentValue, onViewDetails, onEdit]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
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
                        <IconFilter className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="icon">
                        <IconArrowsSort className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <IconDotsVertical className="h-4 w-4" />
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
                                            onClick={() => {
                                                if (onRowClick) {
                                                    onRowClick(row.original as TData);
                                                } else if (onViewDetails) {
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
        </div>
    );
}
