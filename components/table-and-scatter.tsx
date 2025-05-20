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
    isPositive: owner.won_bids > 0,
    // Calculate win rate for later use in scatter plot
    winRate: owner.total_bids > 0 ? (owner.won_bids / owner.total_bids) * 100 : 0,
    revenue: owner.revenue
  }));

  // Prepare scatter plot data - use same data but format it for the scatter chart
  const scatterData = tableData.map(item => ({
    name: item.id,
    x: item.winRate, // win rate as x-axis
    y: item.revenue, // revenue as y-axis
    z: parseInt(item.value) // size based on total bids
  }));

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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Performance</CardTitle>
            <CardDescription>Win rate vs. Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ChartScatter data={scatterData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}