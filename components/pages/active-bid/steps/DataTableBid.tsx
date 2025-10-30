'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
}

interface DataTableBidProps<T> {
  columns: Column<T>[]
  data: T[]
  expandable?: boolean
  renderExpanded?: (row: T, index: number) => React.ReactNode
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTableBid<T extends Record<string, any>>({
  columns,
  data,
  expandable = false,
  renderExpanded,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableBidProps<T>) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <Table className="w-full">
      <TableHeader className="bg-gray-100">
        <TableRow>
          {expandable && <TableHead className="w-6" />}
          {columns.map((col) => (
            <TableHead key={String(col.key)} className="px-2 py-1">
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <React.Fragment key={index}>
              <TableRow
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {expandable && (
                  <TableCell
                    className="px-2 py-2 text-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(index)
                    }}
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${
                        expandedIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className="px-2 py-2">
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
              {expandable && expandedIndex === index && renderExpanded && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="p-4 bg-white border-t"
                  >
                    {renderExpanded(row, index)}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (expandable ? 1 : 0)}
              className="text-center py-4 text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
