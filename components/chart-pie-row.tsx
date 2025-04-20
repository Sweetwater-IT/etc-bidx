"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = ["#F2F2F2", "#E0E0E0", "#C7C7C7", "#A3A3A3", "#707070"];

const winLossData = [
  { name: "Legend 1", value: 45 },
  { name: "Legend 2", value: 25 },
  { name: "Legend 3", value: 15 },
  { name: "Legend 4", value: 10 },
  { name: "Legend 5", value: 5 },
];

const revenueData = [
  { name: "Legend 1", value: 35 },
  { name: "Legend 2", value: 25 },
  { name: "Legend 3", value: 20 },
  { name: "Legend 4", value: 15 },
  { name: "Legend 5", value: 5 },
];

const profitData = [
  { name: "Legend 1", value: 40 },
  { name: "Legend 2", value: 30 },
  { name: "Legend 3", value: 15 },
  { name: "Legend 4", value: 10 },
  { name: "Legend 5", value: 5 },
];

const PieChartCard = ({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={0}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={0}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  width: '100%',
                  paddingTop: '20px',
                }}
                formatter={(value) => (
                  <span style={{ color: '#707070', marginRight: '10px' }}>
                    {value}
                  </span>
                )}
                className="text-sm"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export function ChartPieRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
      <PieChartCard
        title="Win/Loss Percentage"
        description="January - June 2024"
        data={winLossData}
      />
      <PieChartCard
        title="Revenue by Bid Item"
        description="January - June 2024"
        data={revenueData}
      />
      <PieChartCard
        title="Gross Profit by Bid Item"
        description="January - June 2024"
        data={profitData}
      />
    </div>
  );
} 
