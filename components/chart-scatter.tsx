"use client";

import * as React from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ZAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define proper types
interface ScatterPoint {
  name?: string;
  x: number;
  y: number;
  z: number;
}

// Custom tooltip to display point information
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ScatterPoint;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-medium text-sm">{data.name || "Unknown"}</p>
        <p className="text-xs">Win Rate: {data.x.toFixed(1)}%</p>
        <p className="text-xs">Revenue: ${data.y.toLocaleString()}</p>
        <p className="text-xs">Total Bids: {data.z}</p>
      </div>
    );
  }
  
  return null;
};

export function ChartScatter({ data = [] }: { data?: ScatterPoint[] }) {
  // Add jitter to points with same coordinates
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Add small random jitter to avoid overlapping points
    return data.map(point => ({
      ...point,
      x: point.x + (Math.random() * 2 - 1),
      y: point.y + (Math.random() * point.y * 0.02)
    }));
  }, [data]);

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Customer Performance</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground">No customer data to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate domain for the axes
  const maxRevenue = Math.max(...data.map(d => d.y)) * 1.1;
  const maxWinRate = 100; // Win rate is percentage

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 30,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="Win Rate" 
          unit="%" 
          domain={[0, maxWinRate]}
          label={{ 
            value: 'Win Rate (%)', 
            position: 'bottom', 
            offset: 0,
            style: { textAnchor: 'middle' }
          }}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Revenue" 
          domain={[0, maxRevenue]}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          label={{ 
            value: 'Revenue', 
            angle: -90, 
            position: 'left',
            style: { textAnchor: 'middle' }
          }}
        />
        <ZAxis 
          type="number" 
          dataKey="z" 
          range={[60, 400]} 
          name="Total Bids" 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Scatter
          name="Customers"
          data={processedData}
          fill="#0088FE"
          fillOpacity={0.7}
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}