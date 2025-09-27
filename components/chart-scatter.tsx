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

// Define proper types for MPT Bid data
interface MPTBidData {
  bid_value: number;
  gross_profit_margin: number;
  contract_number: string;
  contractor: string;
  start_date: string;
  status: 'won' | 'lost' | 'pending';
}

// Custom tooltip to display point information
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-medium text-sm">{data.contract_number || "Unknown Contract"}</p>
        <p className="text-xs">Contractor: {data.contractor}</p>
        <p className="text-xs">Bid Value: ${data.bid_value.toLocaleString()}</p>
        <p className="text-xs">Profit Margin: {data.gross_profit_margin.toFixed(1)}%</p>
        <p className="text-xs">Status: {data.status}</p>
        {data.start_date && <p className="text-xs">Start: {new Date(data.start_date).toLocaleDateString()}</p>}
      </div>
    );
  }
  
  return null;
};

export function ChartScatter({ data = [] }: { data?: MPTBidData[] }) {

  // Process data for scatter plot
  const scatterData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Transform MPTBid data to scatter plot format
    return data.map(bid => ({
      ...bid,
      // Jitter for better visualization
      bid_value: bid.bid_value + (Math.random() * bid.bid_value * 0.01),
      gross_profit_margin: bid.gross_profit_margin + (Math.random() * 0.5 - 0.25),
      // Add fill color based on status
      fill: bid.status === 'won' ? '#4CAF50' : 
            bid.status === 'lost' ? '#F44336' : '#FFC107'
    }));
  }, [data]);

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">MPT Bid Analysis</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground">No MPT bid data to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate domain for the axes
  const maxBidValue = Math.max(...data.map(d => d.bid_value)) * 1.1;
  const maxMargin = Math.max(...data.map(d => d.gross_profit_margin)) * 1.1;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base">MPT Bid Analysis</CardTitle>
        <CardDescription>Bid Value vs. Gross Profit Margin</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
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
                dataKey="bid_value" 
                name="Bid Value" 
                domain={[0, maxBidValue]}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                label={{ 
                  value: 'Bid Value ($)', 
                  position: 'bottom', 
                  offset: 0,
                  style: { textAnchor: 'middle' }
                }}
              />
              <YAxis 
                type="number" 
                dataKey="gross_profit_margin" 
                name="Gross Profit Margin" 
                domain={[0, maxMargin]}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                label={{ 
                  value: 'Gross Profit Margin (%)', 
                  angle: -90, 
                  position: 'left',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => {
                  if (value === "won") return "Won Bids";
                  if (value === "lost") return "Lost Bids";
                  if (value === "pending") return "Pending Bids";
                  return value;
                }}
              />
              {/* Split into separate series by status for the legend */}
              <Scatter 
                name="won" 
                data={scatterData.filter(item => item.status === 'won')} 
                fill="#4CAF50"
                fillOpacity={0.7}
                shape="circle"
              />
              <Scatter 
                name="lost" 
                data={scatterData.filter(item => item.status === 'lost')} 
                fill="#F44336"
                fillOpacity={0.7}
                shape="circle"
              />
              <Scatter 
                name="pending" 
                data={scatterData.filter(item => item.status === 'pending')} 
                fill="#FFC107"
                fillOpacity={0.7}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}