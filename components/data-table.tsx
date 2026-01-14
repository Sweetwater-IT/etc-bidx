/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef
} from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Segments } from '@/components/ui/segments'
import { Button } from '@/components/ui/button'
import {
  TableControls,
  FilterDropdowns,
  FilterOption,
  SortOption
} from '@/components/table-controls'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Minus,
  MoreHorizontal,
  Search
} from 'lucide-react'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { Separator } from './ui/separator'
import { formatDate } from '@/lib/formatUTCDate'
import { Skeleton } from '@/components/ui/skeleton'

export type LegacyColumn = {
  key: string
  title: string
  className?: string
  sortable?: boolean
}

// Extended column type to include additional properties used in the table
type ExtendedColumn<TData> = ColumnDef<TData, any> & {
  className?: string
}

const handleStatusVariant = (status: string) => {
  // Normalize: lowercase, replace spaces and underscores with dashes
  const normalized = status.toLowerCase().replace(/\s|_/g, '-')
  if (normalized === 'submitted') return 'successful'
  switch (normalized) {
    case 'in-progress':
    case 'in-process':
      return 'warning'
    case 'not-started':
      return 'secondary'
    case 'complete':
      return 'successful'
    case 'on-hold':
      return 'destructive'
    case 'open':
      return 'default'
    case 'pending':
      return 'warning'
    case 'urgent':
    case 'no-bid':
    case 'lost':
      return 'destructive'
    case 'bid':
    case 'won':
    case 'won-pending':
      return 'successful'
    case 'unset':
    case 'draft':
    default:
      return 'secondary'
  }
}

export interface DataTableProps<TData extends object> {
  columns: LegacyColumn[] | readonly LegacyColumn[]
  data: TData[]
  segments?: {
    label: string
    value: string
  }[]
  segmentValue?: string
  segmentCounts?: Record<string, number>
  addButtonLabel?: string
  onAddClick?: () => void
  onSegmentChange?: (value: string) => void
  stickyLastColumn?: boolean
  onArchiveSelected?: (selectedRows: TData[]) => void
  onDeleteSelected?: (selectedRows: TData[]) => void
  tableRef?: React.RefObject<{
    resetRowSelection: () => void
  } | null>
  onRowClick?: (item: TData) => void
  onViewDetails?: (item: TData) => void
  onEdit?: (item: TData) => void
  onArchive?: ((item: TData) => void) | ((item: TData[]) => void)
  onMarkAsBidJob?: (item: TData) => void // Prop for marking a job as a bid job
  onUpdateStatus?: (item: TData, status: string) => void
  selectedItem?: TData
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  totalCount?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  filterOptions?: FilterOption[]
  branchOptions?: { label: string; value: string }[]
  ownerOptions?: { label: string; value: string }[]
  countyOptions?: { label: string; value: string }[]
  estimatorOptions?: { label: string; value: string }[]
  contractorOptions?: { label: string; value: string }[]
  projectStatusOptions?: { label: string; value: string }[]
  billingStatusOptions?: { label: string; value: string }[]
  activeFilters?: Record<string, any>
  onFilterChange?: (filters: Record<string, any>) => void
  onReset?: () => void
  onViewJobSummary?: (item: TData) => void
  showFilters?: boolean
  setShowFilters?: (show: boolean) => void
  hideDropdown?: boolean
  setSelectedRows?: React.Dispatch<React.SetStateAction<TData[]>>
  onAllRowsSelectedChange?: React.Dispatch<React.SetStateAction<boolean>>
  allRowsSelected?: boolean
  handleMultiDelete?: () => void
  viewBidSummaryOpen?: boolean
  onViewBidSummary?: (item: TData) => void
  onUnarchive?: (item: TData) => void
  onDelete?: (item: TData, index: number) => void;
  onDeleteItem?: (item: TData) => void;
  enableSearch?: boolean
  searchPlaceholder?: string
  searchableColumns?: string[]
  isLoading?: boolean

}

function formatCellValue(value: any, key: string, row?: any) {  
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.toLowerCase() === 'unknown')
  ) {
    return '-'
  }

  // Handle special formatting for contractNumber and county fields
  if (
    (key === 'contractNumber' || key === 'county') &&
    typeof value === 'object' &&
    value !== null
  ) {
    if (value.main) {
      return (
        <div className='flex flex-col'>
          <span className={key === 'contractNumber' ? 'uppercase' : ''}>
            {value.main}
          </span>
          {value.secondary && (
            <span className='text-xs text-red-500'>{value.secondary}</span>
          )}
        </div>
      )
    }
  }

  // Format currency for total column and mptValue
  if (key === 'total' || key === 'mptValue') {
    // Handle if value is already formatted with $ (string)
    if (typeof value === 'string' && value.startsWith('$')) {
      return value
    }

    // Convert to number if it's a string without $ sign
    const numValue = typeof value === 'string' ? parseFloat(value) : value

    // Format as currency if it's a valid number
    if (!isNaN(numValue)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue)
    }
    return value
  }

  if (key === 'dbe' || key === 'dbePercentage') {
    if (typeof value === 'string' && value.endsWith('%')) {
      return value
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value

    if (!isNaN(numValue)) {
      return `${numValue % 1 === 0 ? numValue.toFixed(0) : numValue}%`
    }
    return value
  }

  // Handle status badges
  if (
    key === 'status' ||
    key === 'projectStatus' ||
    key === 'billingStatus' ||
    key === 'shop_status' ||
    key === 'order_status'
  ) {
    const variant = handleStatusVariant(value)

    return (
      <Badge
        variant={variant}
        className={`font-medium ${variant === 'warning' && 'text-black'}`}
      >
        {key === 'projectStatus' || key === 'billingStatus'
          ? value.replace('_', ' ')
          : key === 'shop_status'
            ? value === 'not-started'
              ? 'Not Started'
              : value === 'in-progress'
                ? 'In-Process'
                : value === 'in-process'
                  ? 'In-Process'
                  : value === 'complete'
                    ? 'Complete'
                    : value === 'on-hold'
                      ? 'On Hold'
                      : value === 'on-order'
                        ? 'On Order'
                        : value
            : key === 'order_status'
              ? value === 'submitted' || value === 'SUBMITTED'
                ? 'Submitted'
                : value === 'draft' || value === 'DRAFT'
                  ? 'Draft'
                  : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
              : value}
      </Badge>
    )
  }

  if (key === 'contractor' || key === 'subcontractor') {
    if (!value) return ''
    return value === '-' ? (
      '-'
    ) : (
      <Badge
        variant='outline'
        className='font-medium bg-background hover:bg-background'
      >
        {value}
      </Badge>
    )
  }

  if (value instanceof Date) {
    return formatDate(value)
  }
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    if (typeof value !== 'string') return value

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number)
        const timestamp = (key === 'created_at' || key === 'createdAt') ? ', 12:00 AM' : ''
        return `${monthNames[month - 1]} ${day}, ${year}${timestamp}`
      }

      const date = new Date(value)
      const monthName = monthNames[date.getMonth()]
      const dayNum = date.getDate()
      const yearNum = date.getFullYear()
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const amOrPm = hours >= 12 ? 'PM' : 'AM'
      const hoursFormatted = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const minutesFormatted = minutes.toString().padStart(2, '0')
      const timestamp = `, ${hoursFormatted}:${minutesFormatted} ${amOrPm}`

      if (key === 'created_at' || key === 'createdAt') {
        return `${monthName} ${dayNum}, ${yearNum}${timestamp}`
      }

      return `${monthName} ${dayNum}, ${yearNum}`
    } catch (e) {
      return value
    }
  }

  // Handle objects
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (value === null) {
      return ''
    }
    return JSON.stringify(value)
  }

  // QUOTES: Real bidx type_quote badge — EXACT MATCH
  if (key === "type") {
  const val = String(value || "").trim();
  const fullRow = row || {}; 

  let displayValue = "Unknown";

  if (val === "straight_sale") {
    displayValue = "Straight Sale";
  } else if (val === "to_project") {
    const jobNum = fullRow?.etc_job_number || "";
    displayValue = jobNum ? `Job: ${jobNum}` : "To Project";
  } else if (val === "estimate_bid") {
    const contractNum = fullRow?.estimate_contract_number || "";
    displayValue = contractNum ? `Bid: ${contractNum}` : "Estimate/Bid";
  }

  return (
    <Badge 
      variant="outline" 
      className="font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      {displayValue}
    </Badge>
  );
}
  
  return value
}

function isRowSelected<T extends object>(
  row: T,
  selectedItem: T | undefined
): boolean {
  if (!selectedItem) return false

  // Check if the row has an id property
  if ('id' in row && selectedItem && 'id' in selectedItem) {
    return (row as any).id === (selectedItem as any).id
  }

  // If there's no id, compare the entire object
  return JSON.stringify(row) === JSON.stringify(selectedItem)
}

export function DataTable<TData extends object>({
  columns: legacyColumns,
  data,
  segments,
  segmentValue,
  segmentCounts,
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
  onArchive,
  onMarkAsBidJob,
  onUpdateStatus,
  selectedItem,
  pageCount,
  pageIndex = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  totalCount,
  sortBy,
  sortOrder,
  onSortChange,
  // Filter props
  filterOptions,
  branchOptions,
  ownerOptions,
  countyOptions,
  estimatorOptions,
  contractorOptions,
  projectStatusOptions,
  billingStatusOptions,
  activeFilters,
  onFilterChange,
  onReset,
  onViewJobSummary,
  showFilters,
  setShowFilters,
  hideDropdown,
  setSelectedRows,
  onAllRowsSelectedChange,
  allRowsSelected,
  handleMultiDelete,
  viewBidSummaryOpen,
  onViewBidSummary,
  onUnarchive,
  onDelete,
  onDeleteItem,
  enableSearch,
  searchPlaceholder,
  searchableColumns, 
  isLoading = false
}: DataTableProps<TData>) {
  const columns = React.useMemo(() => {
    const cols: ExtendedColumn<TData>[] = legacyColumns.map(col => ({
      id: col.key,
      accessorKey: col.key,
      header: col.title,
      cell: ({ row }: any) => {
        const value = row.getValue(col.key)
        return formatCellValue(value, col.key, row.original)  
      },
      className: col.className,
      enableSorting: col.sortable ?? true
    }))

    // Add actions column if any action handlers are provided
    if (
      onViewDetails ||
      onEdit ||
      onArchive ||
      onMarkAsBidJob ||
      onUpdateStatus ||
      onUnarchive
    ) {
      cols.push({
        id: 'actions',
        accessorKey: 'actions',
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => {
          const handleDelete = useCallback(
            async (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()

              if (segmentValue === 'archived') {
                setItemsToDelete(
                  table
                    .getSelectedRowModel()
                    .rows.map(row => row.original) as TData[]
                )
                setDeleteDialogOpen(true)
              } else if (onDeleteSelected) {
                console.log('Delete clicked for row:', row.original)
                try {
                  setItemsToDelete(
                    table
                      .getSelectedRowModel()
                      .rows.map(row => row.original) as TData[]
                  )
                  toast.success('Item deleted successfully')
                } catch (error) {
                  console.error('Error calling onDeleteSelected:', error)
                  toast.error('An error occurred while deleting the item.')
                }
              }
            },
            [row.original]
          )

          const handleArchive = useCallback(
            async (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              let archiveSuccessful = false

              if (onArchiveSelected) {
                console.log('Archive clicked for row:', row.original)
                try {
                  await onArchiveSelected([row.original as TData])
                  console.log('onArchiveSelected called successfully')
                  archiveSuccessful = true
                } catch (error) {
                  console.error('Error calling onArchiveSelected:', error)
                }
              }

              if (onArchive && !archiveSuccessful) {
                try {
                  await onArchive(row.original as any)
                  console.log('onArchive called successfully')
                  archiveSuccessful = true
                } catch (error) {
                  console.error('Error calling onArchive:', error)
                }
              }

              if (archiveSuccessful && onSegmentChange && segmentValue) {
                onSegmentChange(segmentValue)
              }
            },
            [row.original]
          )

          const handleUnarchive = useCallback(
            async (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              if (onUnarchive) {
                await onUnarchive(row.original as TData)
              }
            },
            [row.original]
          )


          const handleDeleteItem = useCallback(
            async (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              if (onDeleteItem) {
                await onDeleteItem(row.original as TData)
              }
            },
            [row.original]
          )
          return (
            <div
              className={cn(
                'flex justify-center',
                stickyLastColumn && 'sticky right-0 bg-background'
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='h-8 w-8 p-0'
                    onClick={e => e.stopPropagation()}
                    role='combobox'
                  >
                    <span className='sr-only'>Open menu</span>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='z-[200]'>
                  {onMarkAsBidJob &&
                    'status' in row.original &&
                    (row.original as any).status === 'Bid' &&
                    !(row.original as any).alreadyBid && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          e.preventDefault()
                          onMarkAsBidJob(row.original as TData)
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
                          <span className='ml-auto'>
                            <svg
                              width='15'
                              height='15'
                              viewBox='0 0 15 15'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M6 3L10 7.5L6 12'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              ></path>
                            </svg>
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side='right'
                        sideOffset={2}
                        className='w-36'
                      >
                        {segments
                          .filter(segment => {
                            if (
                              segment.value === 'all' ||
                              segment.value === 'archived' ||
                              segment.value === 'won-pending'
                            ) {
                              return false
                            }

                            const currentStatus = String(
                              (row.original as any).status
                            )
                            let currentSegmentValue = ''

                            if (currentStatus === 'Bid') {
                              currentSegmentValue = 'bid'
                            } else if (currentStatus === 'No Bid') {
                              currentSegmentValue = 'no-bid'
                            } else if (currentStatus === 'Unset') {
                              currentSegmentValue = 'unset'
                            } else {
                              currentSegmentValue = currentStatus
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                            }

                            return segment.value !== currentSegmentValue
                          })
                          .map(segment => {
                            let statusValue: string

                            if (
                              'contractNumber' in row.original &&
                              !('lettingDate' in row.original)
                            ) {
                              if (segment.value === 'bid') statusValue = 'Bid'
                              else if (segment.value === 'no-bid')
                                statusValue = 'No Bid'
                              else if (segment.value === 'unset')
                                statusValue = 'Unset'
                              else statusValue = segment.value
                            } else if ('lettingDate' in row.original) {
                              if (segment.value === 'won') statusValue = 'WON'
                              else if (segment.value === 'pending')
                                statusValue = 'PENDING'
                              else if (segment.value === 'lost')
                                statusValue = 'LOST'
                              else if (segment.value === 'draft')
                                statusValue = 'DRAFT'
                              else statusValue = segment.value
                            } else {
                              statusValue = segment.value
                            }

                            const cleanLabel = segment.label.split(' (')[0]

                            return (
                              <DropdownMenuItem
                                key={segment.value}
                                onClick={e => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  onUpdateStatus(
                                    row.original as TData,
                                    statusValue as any
                                  )
                                }}
                              >
                                {cleanLabel}
                              </DropdownMenuItem>
                            )
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {onViewJobSummary && (
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        onViewJobSummary(row.original as TData)
                      }}
                    >
                      View Job Summary
                    </DropdownMenuItem>
                  )}
                  {onViewBidSummary && viewBidSummaryOpen !== undefined && (
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        onViewBidSummary(row.original)
                      }}
                    >
                      View Bid Summary
                    </DropdownMenuItem>
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

                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDelete(row.original as TData, row.index);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}




                  {onEdit && (
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        onEdit(row.original as TData)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  )}

                  {/* {segmentValue === "archived" && onDeleteSelected && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleDelete}
                    >
                      Delete
                    </DropdownMenuItem>
                  )} */}

                  {segmentValue !== 'archived' && onArchiveSelected && (
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={handleArchive}
                    >
                      Archive
                    </DropdownMenuItem>
                  )}

                  {onUnarchive && segmentValue === 'archived' && (
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={handleUnarchive}
                    >
                      Unarchive
                    </DropdownMenuItem>
                  )}

                  {onDeleteItem && segmentValue === 'archived' && (
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={handleDeleteItem}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        className: stickyLastColumn
          ? 'sticky right-0 bg-white dark:bg-background'
          : ''
      })
    }
    // fix checkbox column > if onArchiveSelected or onDeleteSelected is provided
    if (onArchiveSelected || onDeleteSelected) {
      cols.unshift({
        id: 'select',
        header: ({ table }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Checkbox
                className={`translate-x-1 ${table.getIsAllPageRowsSelected() ? 'bg-black text-white border-black' : ''}`}

                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label='Select all rows'
                role='combobox'
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent avoidCollisions={false} align='start'>
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllPageRowsSelected(true);
                  onAllRowsSelectedChange?.(false);
                }}
              >
                Select {`${data.length} ${onMarkAsBidJob ? 'available jobs' : 'items'}`} on this page
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllPageRowsSelected(true);
                  onAllRowsSelectedChange?.(true);
                }}
              >
                Select all {`${totalCount} ${onMarkAsBidJob ? 'available jobs' : 'items'}`}
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllRowsSelected(false);
                  onAllRowsSelectedChange?.(false);
                }}
              >
                Deselect all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label='Select row'
              onClick={e => e.stopPropagation()}
            />
          </div>
        ),
        meta: {
          className: 'w-16 text-right'
        },
        enableSorting: false,
        enableHiding: false
      });
    }

    return cols
  }, [
    legacyColumns,
    onViewDetails,
    onEdit,
    onArchive,
    onMarkAsBidJob,
    onUpdateStatus,
    onArchiveSelected,
    onDeleteSelected,
    stickyLastColumn,
    segmentValue,
    segments,
    onSegmentChange,
    onViewJobSummary
  ])


  // State for filter visibility
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<TData[]>([])

  // Search state (only used when enableSearch is true)
  const [globalFilter, setGlobalFilter] = useState("")

  const customGlobalFilterFn = (row: any, columnId: string, filterValue: string) => {
    if (!filterValue) return true

    const search = filterValue.toLowerCase().trim()

    // Use the searchableColumns prop if provided; otherwise, search nothing (safe)
    const fieldsToSearch = searchableColumns || []

    if (fieldsToSearch.length === 0) return true

    return fieldsToSearch.some((field) => {
      const value = row.original[field]
      if (value == null) return false
      return String(value).toLowerCase().includes(search)
    })
  }
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      manualPagination: true,
      manualSorting: true,
      enableRowSelection: !!(onArchiveSelected || onDeleteSelected),
      globalFilterFn: enableSearch ? customGlobalFilterFn : "auto",
      state: {
        globalFilter: enableSearch ? globalFilter : "",
        pagination: {
          pageIndex,
          pageSize,
        },
      },
      onGlobalFilterChange: enableSearch ? setGlobalFilter : undefined,
    })
  
    React.useImperativeHandle(
      tableRef,
      () => ({
        resetRowSelection: () => {
          table.toggleAllRowsSelected(false)
        },
      }),
      [table]
    )
  
    React.useEffect(() => {
      if (setSelectedRows) {
        const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
        setSelectedRows(selectedRows)
      }
    }, [table.getSelectedRowModel().rows, setSelectedRows])
  
    if (isLoading) {
      return (
        <div className="space-y-4">
          {/* Top controls remain visible during loading */}
          <div className="px-6 mb-3">
            {enableSearch && (
              <div className="mb-6 px-1">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder || "Search by contract, requestor, status, owner, letting, or due date..."}
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-3">
              <div>
                {segments && (
                  <Segments
                    segments={segments}
                    value={segmentValue}
                    onChange={onSegmentChange}
                    counts={segmentCounts}
                  />
                )}
              </div>
            
              <div className='flex items-center gap-2'>
                {onSortChange && (
                  <TableControls
                    onFilterChange={onFilterChange}
                    onReset={onReset}
                    activeFilters={activeFilters}
                    showFilters={!!showFilters}
                    setShowFilters={setShowFilters}
                  />
                )}

                {!hideDropdown && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-9 gap-1'
                        role='combobox'
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => alert('Export to CSV')}>
                        Export to CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alert('Print')}>
                        Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {addButtonLabel && (
                  <Button onClick={onAddClick} size='sm' className='h-9 gap-1'>
                    <IconPlus className='h-4 w-4' />
                    {addButtonLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {onFilterChange && (
            <FilterDropdowns
              showFilters={!!showFilters}
              filterOptions={filterOptions || []}
              onFilterChange={onFilterChange}
              activeFilters={activeFilters}
            />
          )}

          <div className='px-6'>
            <div className='rounded-md border'>
              <div className='relative overflow-x-auto'>
                <Table>
                  <TableHeader className='bg-muted'>
                    <TableRow>
                      {legacyColumns.map((col, index) => (
                        <TableHead key={col.key} className={cn(col.className, 'text-sm !font-medium')}>
                          <Skeleton className="h-4 w-[100px] mb-2" />
                        </TableHead>
                      ))}
                      {(onViewDetails || onEdit || onArchive || onMarkAsBidJob || onUpdateStatus || onUnarchive) && (
                        <TableHead className="text-center text-sm !font-medium">
                          <Skeleton className="h-4 w-16 mb-2 mx-auto" />
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {legacyColumns.map((col) => (
                          <TableCell key={col.key} className={col.className}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        ))}
                        {(onViewDetails || onEdit || onArchive || onMarkAsBidJob || onUpdateStatus || onUnarchive) && (
                          <TableCell className="flex justify-center">
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Pagination skeleton */}
          {pageCount && pageCount > 1 && (
            <div className='px-6'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className='flex items-center space-x-6 lg:space-x-8'>
                  <div className='flex items-center space-x-2'>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-[70px]" />
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* === TOP CONTROLS SECTION (with search bar) === */}
        <div className="px-6 mb-3">
          {/* Search Bar - Only for Open Bids */}
          {enableSearch && (
            <div className="mb-6 px-1"> {/* small padding to match segments */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder || "Search by contract, requestor, status, owner, letting, or due date..."}
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>
          )}
  
          {/* Segments Row */}
          <div className="flex justify-between items-center mb-3">
            <div>
              {segments && (
                <Segments
                  segments={segments}
                  value={segmentValue}
                  onChange={onSegmentChange}
                  counts={segmentCounts}
                />
              )}
            </div>
          
          <div className='flex items-center gap-2'>
            {/* Sort and Filter Controls */}
            {onSortChange && (
              <TableControls
                onFilterChange={onFilterChange}
                onReset={onReset}
                activeFilters={activeFilters}
                showFilters={!!showFilters}
                setShowFilters={setShowFilters}
              />
            )}

            {/* Table Actions Menu - without Archive/Delete */}
            {!hideDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 gap-1'
                    role='combobox'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => alert('Export to CSV')}>
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert('Print')}>
                    Print
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {addButtonLabel && (
              <Button onClick={onAddClick} size='sm' className='h-9 gap-1'>
                <IconPlus className='h-4 w-4' />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns - Below Segments Row */}
        {onFilterChange && (
          <FilterDropdowns
            showFilters={!!showFilters}
            filterOptions={filterOptions || []} // Pass the actual filterOptions
            onFilterChange={onFilterChange}
            activeFilters={activeFilters}
          />
        )}
        {table.getSelectedRowModel().rows.length >= 1 && (
          <div className='flex justify-end mt-3'>
            {segmentValue === 'archived' ? (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => {
                  // Don't set itemsToDelete when allRowsSelected is true
                  // Just open the dialog directly
                  if (allRowsSelected) {
                    setDeleteDialogOpen(true)
                  } else {
                    const selectedRows = table
                      .getSelectedRowModel()
                      .rows.map(row => row.original as TData)
                    setItemsToDelete(selectedRows)
                    if (onDeleteSelected) {
                      onDeleteSelected(selectedRows)
                    }
                    setDeleteDialogOpen(true)
                  }
                }}
              >
                Delete (
                {allRowsSelected
                  ? totalCount
                  : table.getSelectedRowModel().rows.length}
                )
              </Button>
            ) : (
              onArchiveSelected && (
                <Button
                  variant='outline'
                  size='sm'
                  className='text-destructive border-destructive hover:bg-destructive/10'
                  onClick={async () => {
                    // Same fix for archive
                    if (allRowsSelected) {
                      await onArchiveSelected([])
                    } else {
                      const selectedRows = table
                        .getSelectedRowModel()
                        .rows.map(row => row.original as TData)
                      onArchiveSelected(selectedRows)
                    }
                  }}
                >
                  Archive (
                  {allRowsSelected
                    ? totalCount
                    : table.getSelectedRowModel().rows.length}
                  )
                </Button>
              )
            )}
          </div>
        )}
      </div>

      <div className='px-6'>
        <div className='rounded-md border'>
          <div className='relative overflow-x-auto'>
            <Table>
              <TableHeader className='bg-muted'>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const isActions = header.column.id === 'actions'
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            // Use type assertion to handle the className property
                            (header.column.columnDef as any).className,
                            isActions && stickyLastColumn
                              ? 'sticky right-0 bg-muted'
                              : 'text-sm !font-medium'
                          )}
                        >
                          {header.isPlaceholder ||
                            header.column.id === 'actions' ? null : header.column
                              .id === 'select' ? (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  role='combobox'
                                  className='-ml-3 h-8 data-[state=open]:bg-accent'
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {header.column.getCanSort() &&
                                    (header.column.getIsSorted() === 'desc' ? (
                                      <ArrowDown className='ml-2 h-4 w-4' />
                                    ) : header.column.getIsSorted() ===
                                      'asc' ? (
                                      <ArrowUp className='ml-2 h-4 w-4' />
                                    ) : (
                                      <ChevronsUpDown className='ml-2 h-4 w-4' />
                                    ))}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='start'>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Call your parent component's sort function
                                    onSortChange?.(header.column.id, 'asc')
                                    // Also update TanStack table state
                                    header.column.toggleSorting(false)
                                  }}
                                >
                                  <ArrowUp className='mr-2 h-3.5 w-3.5 text-muted-foreground/70' />
                                  Asc
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Call your parent component's sort function
                                    onSortChange?.(header.column.id, 'desc')
                                    // Also update TanStack table state
                                    header.column.toggleSorting(true)
                                  }}
                                >
                                  <ArrowDown className='mr-2 h-3.5 w-3.5 text-muted-foreground/70' />
                                  Desc
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {header.column.getCanSort() && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Clear sorting in both places
                                      onSortChange?.('', 'asc') // Or however you handle clearing
                                      header.column.clearSorting()
                                    }}
                                  >
                                    <ChevronsUpDown className='mr-2 h-3.5 w-3.5 text-muted-foreground/70' />
                                    Clear Sort
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={isRowSelected(row.original, selectedItem) ? 'selected' : ''}
                      className={cn(
                        'cursor-pointer',
                        isRowSelected(row.original, selectedItem) &&
                        'bg-muted/50'
                      )}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.dataset.slot === 'checkbox') return;
                        const checkbox = target.closest('[data-slot="checkbox"]');
                        if (checkbox) return;
                        if (onViewDetails) {
                          console.log('Row clicked, calling onViewDetails:', row.original);
                          onViewDetails(row.original as TData);
                        }
                      }}
                    >
                      {row.getVisibleCells().map(cell => {
                        const isActions = cell.column.id === 'actions'
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              (cell.column.columnDef as any).className,
                              isActions && stickyLastColumn
                                ? 'sticky right-0 bg-white dark:bg-background'
                                : ''
                            )}
                          >
                            {Object.hasOwn(cell.row.original, 'primarySignId') && (cell.column.id === 'designation') && <IconChevronRight className="inline h-5 pb-1 text-muted-foreground" />}{
                              flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
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

      {/* Pagination Controls */}
      {pageCount && pageCount > 1 ? (
        <div className='px-6'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              {totalCount !== undefined && (
                <div>
                  Showing {pageIndex * pageSize + 1} to{' '}
                  {Math.min((pageIndex + 1) * pageSize, totalCount)} of{' '}
                  {totalCount} entries
                </div>
              )}
            </div>

            <div className='flex items-center space-x-6 lg:space-x-8'>
              <div className='flex items-center space-x-2'>
                <p className='text-sm font-medium'>Rows per page</p>
                <Select
                  value={`${pageSize}`}
                  onValueChange={value => {
                    onPageSizeChange?.(Number(value))
                  }}
                >
                  <SelectTrigger className='h-8 w-[70px]'>
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side='top'>
                    {[10, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  className='hidden h-8 w-8 p-0 lg:flex'
                  onClick={() => onPageChange && onPageChange(0)}
                  disabled={pageIndex === 0 || !onPageChange}
                >
                  <span className='sr-only'>Go to first page</span>
                  <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => onPageChange && onPageChange(pageIndex - 1)}
                  disabled={pageIndex === 0 || !onPageChange}
                >
                  <span className='sr-only'>Go to previous page</span>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <div className='flex items-center justify-center text-sm font-medium'>
                  Page {pageIndex + 1} of {pageCount}
                </div>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => onPageChange && onPageChange(pageIndex + 1)}
                  disabled={pageIndex === pageCount - 1 || !onPageChange}
                >
                  <span className='sr-only'>Go to next page</span>
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='hidden h-8 w-8 p-0 lg:flex'
                  onClick={() =>
                    onPageChange && onPageChange((pageCount || 1) - 1)
                  }
                  disabled={pageIndex === (pageCount || 1) - 1 || !onPageChange}
                >
                  <span className='sr-only'>Go to last page</span>
                  <ChevronsRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {allRowsSelected ? totalCount : pageCount} item
              {itemsToDelete.length !== 1 ? "s" : ""}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMultiDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  )
}
