'use client'
import React from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { calculateSaleItemMargin } from '@/lib/mptRentalHelperFunctions'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

const SaleItemsSummary = () => {
  const { saleItems } = useEstimate()

  return (
    <div className="bg-white rounded-lg border p-4 md:row-span-1">
      <h3 className="text-lg font-medium mb-4 text-center">Sale Items</h3>
      
      {saleItems && saleItems.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Item #</TableHead>
                <TableHead className="whitespace-nowrap">Item Name</TableHead>
                <TableHead className="whitespace-nowrap">Vendor</TableHead>
                <TableHead className="whitespace-nowrap">Quote Price</TableHead>
                <TableHead className="whitespace-nowrap">Mark Up</TableHead>
                <TableHead className="whitespace-nowrap">Margin</TableHead>
                <TableHead className="whitespace-nowrap">Unit Price</TableHead>
                <TableHead className="whitespace-nowrap">Quantity</TableHead>
                <TableHead className="whitespace-nowrap">Extended Price</TableHead>
                <TableHead className="whitespace-nowrap">Gross Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleItems.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.itemNumber}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.vendor}</TableCell>
                  <TableCell>${row.quotePrice}</TableCell>
                  <TableCell>{row.markupPercentage}%</TableCell>
                  <TableCell>{(calculateSaleItemMargin(row).margin * 100).toFixed(0)}%</TableCell>
                  <TableCell>${(row.quotePrice * (1 + (row.markupPercentage / 100))).toFixed(2)}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>${calculateSaleItemMargin(row).salePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>${calculateSaleItemMargin(row).grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col">
          <p className="text-center py-6 text-gray-500 italic">
            No sale items available
          </p>
        </div>
      )}
    </div>
  )
}

export default SaleItemsSummary