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

const tableData = [
  { 
    id: "BID-001",
    status: "Completed",
    value: "$12,450",
    growth: "+12.5%",
    isPositive: true 
  },
  { 
    id: "BID-002",
    status: "In Progress",
    value: "$8,350",
    growth: "-5.2%",
    isPositive: false 
  },
  { 
    id: "BID-003",
    status: "Completed",
    value: "$15,800",
    growth: "+8.1%",
    isPositive: true 
  },
  { 
    id: "BID-004",
    status: "Under Review",
    value: "$9,200",
    growth: "+3.2%",
    isPositive: true 
  },
  { 
    id: "BID-005",
    status: "Completed",
    value: "$11,600",
    growth: "-2.4%",
    isPositive: false 
  },
];

export function TableAndScatter() {
  return (
    <div className="grid grid-cols-3 gap-6 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Bids</CardTitle>
          <CardDescription>Last 5 bids and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted/40">
                  <th className="pb-3 text-left font-medium">Bid ID</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Value</th>
                  <th className="pb-3 text-right font-medium">Growth</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {tableData.map((item) => (
                  <tr key={item.id} className="border-b border-muted/20">
                    <td className="py-3 text-left font-medium">{item.id}</td>
                    <td className="py-3">
                      <Badge 
                        variant={item.status === "Completed" ? "default" : "secondary"}
                        className="font-normal"
                      >
                        {item.status}
                      </Badge>
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
      <ChartScatter />
    </div>
  );
} 