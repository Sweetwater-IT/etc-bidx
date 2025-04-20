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
    id: "All",
    status: "$50,842",
    value: "2",
    growth: "2",
    isPositive: true 
  },
  { 
    id: "Private",
    status: "$50,842",
    value: "1",
    growth: "1",
    isPositive: false 
  },
  { 
    id: "PENNDOT",
    status: "$0",
    value: "1",
    growth: "1",
    isPositive: true 
  },
  { 
    id: "TURNPIKE",
    status: "$0",
    value: "0",
    growth: "0",
    isPositive: true 
  },
  { 
    id: "SEPTA",
    status: "$0",
    value: "0",
    growth: "0",
    isPositive: false 
  },
  { 
    id: "Other",
    status: "$",
    value: "0",
    growth: "0",
    isPositive: false 
  },
];

export function TableAndScatter() {
  return (
    <div className="grid grid-cols-3 gap-6 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bid Summary by Owner</CardTitle>
          <CardDescription>Last 5 bids and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted/40">
                  <th className="pb-3 text-left font-medium">Owner</th>
                  <th className="pb-3 text-left font-medium">Dollar Value</th>
                  <th className="pb-3 text-right font-medium">Total Bids</th>
                  <th className="pb-3 text-right font-medium">Bids Won</th>
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
