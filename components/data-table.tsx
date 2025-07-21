/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
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
  MoreHorizontal
} from 'lucide-react'
import { IconPlus } from '@tabler/icons-react'
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
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { Separator } from './ui/separator'
import { formatDate } from '@/lib/formatUTCDate'

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
}

function formatCellValue (value: any, key: string) {
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
    try {
      // Create a Date object directly from the ISO string - this will be interpreted as UTC
      const utcDate = new Date(value)

      // Use local methods instead of UTC methods to get the date in user's timezone
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]
      const monthName = monthNames[utcDate.getMonth()]
      const dayNum = utcDate.getDate()
      const yearNum = utcDate.getFullYear()
      const hoursValue = utcDate.getHours()
      const minutesValue = utcDate.getMinutes()
      const amOrPm = hoursValue >= 12 ? 'PM' : 'AM'
      const hoursFormatted =
        hoursValue === 0 ? 12 : hoursValue > 12 ? hoursValue - 12 : hoursValue
      const minutesFormatted = minutesValue.toString().padStart(2, '0')
      const timestamp = `, ${hoursFormatted}:${minutesFormatted} ${amOrPm}`

      // Always show timestamp for created_at and createdAt
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
    // If it's an array, join the values
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    // If it's null, return empty string
    if (value === null) {
      return ''
    }
    // Otherwise, stringify the object
    return JSON.stringify(value)
  }

  return value
}

function isRowSelected<T extends object> (
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

export function DataTable<TData extends object> ({
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
  onUnarchive
}: DataTableProps<TData>) {
  const columns = React.useMemo(() => {
    const cols: ExtendedColumn<TData>[] = legacyColumns.map(col => ({
      id: col.key,
      accessorKey: col.key,
      header: col.title,
      cell: ({ row }: any) => {
        const value = row.getValue(col.key)
        return formatCellValue(value, col.key)
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
                    (row.original as any).status !== 'No Bid' &&
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
    // Add checkbox column if onArchiveSelected or onDeleteSelected is provided
    if (onArchiveSelected || onDeleteSelected) {
      cols.unshift({
        id: 'select',
        header: ({ table }: any) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Checkbox
                className={`translate-x-1 ${
                  table.getIsAllPageRowsSelected()
                    ? 'bg-black text-white border-black'
                    : ''
                }`}
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={value => {
                  // row.toggleSelected(!!value);
                }}
                aria-label='Select all rows'
                role='combobox'
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent avoidCollisions={false} align='start'>
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllPageRowsSelected(true)
                  onAllRowsSelectedChange?.(false)
                }}
              >
                Select{' '}
                {`${data.length} ${
                  onMarkAsBidJob ? 'available jobs' : 'items'
                }`}{' '}
                on this page
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllRowsSelected(true)
                  onAllRowsSelectedChange?.(true)
                }}
              >
                Select all{' '}
                {`${totalCount} ${onMarkAsBidJob ? 'available jobs' : 'items'}`}
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem
                onClick={() => {
                  table.toggleAllRowsSelected(false)
                  onAllRowsSelectedChange?.(false)
                }}
              >
                Deselect all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        cell: ({ row }: any) => (
          <div className='flex justify-center'>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => {
                row.toggleSelected(!!value)
              }}
              aria-label='Select row'
              onClick={e => e.stopPropagation()} // Prevent row click when checkbox is clicked
            />
          </div>
        ),
        meta: {
          className: 'w-16 text-right'
        },
        enableSorting: false,
        enableHiding: false
      })
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: !!(onArchiveSelected || onDeleteSelected),
    state: {
      pagination: {
        pageIndex,
        pageSize
      }
    }
  })

  // Expose the resetRowSelection method via ref
  React.useImperativeHandle(
    tableRef,
    () => ({
      resetRowSelection: () => {
        table.toggleAllRowsSelected(false)
      }
    }),
    [table]
  )

  React.useEffect(() => {
    if (setSelectedRows) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map(row => row.original)
      setSelectedRows(selectedRows)
    }
  }, [table.getSelectedRowModel().rows, setSelectedRows])

  return (
    <div className='space-y-4'>
      {/* Top Controls Section */}
      <div className='px-6 mb-3'>
        {/* Segments Row - Always visible */}
        <div className='flex justify-between items-center mb-3'>
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
                      data-state={
                        isRowSelected(row.original, selectedItem)
                          ? 'selected'
                          : ''
                      }
                      className={cn(
                        'cursor-pointer',
                        isRowSelected(row.original, selectedItem) &&
                          'bg-muted/50'
                      )}
                      onClick={() => onRowClick && onRowClick(row.original)}
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
                            {flexRender(
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
