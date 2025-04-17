"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Segments } from "@/components/ui/segments"
import { Button } from "@/components/ui/button"
import { IconPlus, IconDotsVertical, IconFilter, IconArrowsSort } from "@tabler/icons-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type LegacyColumn = {
  key: string
  title: string
  className?: string
}

export interface DataTableProps<TData> {
  columns: LegacyColumn[] | readonly LegacyColumn[]
  data: TData[]
  segments?: {
    label: string
    value: string
  }[]
  addButtonLabel?: string
  onAddClick?: () => void
}

function formatCellValue(value: any, key: string) {
  if (key === "status") {
    const variant = value.toLowerCase() === "urgent" ? "destructive" : 
                   value.toLowerCase() === "open" ? "default" : 
                   "secondary"
    return (
      <Badge variant={variant} className="font-medium">
        {value}
      </Badge>
    )
  }

  if (value instanceof Date) {
    return format(value, "MMM d, yyyy")
  }
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    try {
      return format(new Date(value), "MMM d, yyyy")
    } catch {
      return value
    }
  }
  return value
}

function convertToColumnDef<TData>(columns: LegacyColumn[]): ColumnDef<TData>[] {
  const baseColumns: ColumnDef<TData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    ...columns.map((col) => ({
      accessorKey: col.key,
      header: col.title,
      cell: (info) => {
        const value = info.getValue()
        return (
          <div className={col.className}>
            {formatCellValue(value, col.key)}
          </div>
        )
      },
    })),
  ]

  // Add actions column as the last column
  baseColumns.push({
    id: "actions",
    header: () => (
      <div className="text-center">Actions</div>
    ),
    cell: () => {
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  })

  return baseColumns
}

export function DataTable<TData>({
  columns: legacyColumns,
  data,
  segments,
  addButtonLabel,
  onAddClick
}: DataTableProps<TData>) {
  const columns = React.useMemo(
    () => convertToColumnDef<TData>(legacyColumns as LegacyColumn[]),
    [legacyColumns]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-6">
        {addButtonLabel && (
          <Button size="sm" onClick={onAddClick}>
            <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center px-6 mb-3 mt-2">
        {segments && <Segments segments={segments} />}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <IconFilter className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <IconArrowsSort className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
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
                          style={isActions ? { position: 'sticky', right: 0 } : undefined}
                          className={isActions ? "z-50 bg-muted" : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
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
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === "actions";
                        return (
                          <TableCell 
                            key={cell.id}
                            style={isActions ? { position: 'sticky', right: 0 } : undefined}
                            className={isActions ? "z-50 bg-background" : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
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
  )
}