"use client";

import * as React from "react";
import { IconArrowUp, IconTrendingUp } from "@tabler/icons-react";
import { ChartScatter } from "@/components/chart-scatter";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function TableAndScatter({ data }) {
  // Handle empty or null data
  if (!data || !data.owner_revenue || data.owner_revenue.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bid Summary by Customer</CardTitle>
            <CardDescription>No data available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <p className="text-sm text-muted-foreground py-4">No customer data found</p>
            </div>
          </CardContent>
        </Card>
        <div className="col-span-2">
          <ChartScatter data={[]} />
        </div>
      </div>
    );
  }

  // Process owner revenue data
  const tableData = data.owner_revenue.map(owner => ({
    id: owner.customer,
    status: formatCurrency(owner.revenue),
    value: owner.total_bids.toString(),
    growth: owner.won_bids.toString(),
    isPositive: owner.won_bids > 0
  }));
  
  // Log data for debugging
  console.log("Owner revenue data:", data.owner_revenue);
  console.log("MPT bids data:", data.mpt_bids);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bid Summary by Customer</CardTitle>
          <CardDescription>Top performing customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted/40">
                  <th className="pb-3 text-left font-medium">Customer</th>
                  <th className="pb-3 text-left font-medium">Dollar Value</th>
                  <th className="pb-3 text-right font-medium">Total Bids</th>
                  <th className="pb-3 text-right font-medium">Bids Won</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {tableData.map((item) => (
                  <tr key={item.id} className="border-b border-muted/20">
                    <td className="py-3 text-left font-medium text-xs md:text-sm truncate max-w-[100px]" title={item.id}>
                      {item.id}
                    </td>
                    <td className="py-3">
                      <span className="text-xs md:text-sm">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{item.value}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium ${
                        item.isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.isPositive ? <IconTrendingUp className="h-4 w-4" /> : <IconArrowUp className="h-4 w-4 rotate-180" />}
                        {item.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="col-span-2">
        {/* Pass the MPT bids data directly to the ChartScatter component */}
        <ChartScatter data={data.mpt_bids || []} />
      </div>
    </div>
  );
}