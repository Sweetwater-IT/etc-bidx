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

const COLORS = ["#4285F4", "#5A9BF5", "#2B579A", "#81B4F9", "#B3D1FA"];

const winLossData = [
  { name: "Chrome", value: 45 },
  { name: "Safari", value: 25 },
  { name: "Firefox", value: 15 },
  { name: "Edge", value: 10 },
  { name: "Other", value: 5 },
];

const revenueData = [
  { name: "Product A", value: 35 },
  { name: "Product B", value: 25 },
  { name: "Product C", value: 20 },
  { name: "Product D", value: 15 },
  { name: "Others", value: 5 },
];

const profitData = [
  { name: "Product A", value: 40 },
  { name: "Product B", value: 30 },
  { name: "Product C", value: 15 },
  { name: "Product D", value: 10 },
  { name: "Others", value: 5 },
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
        title="Pie Chart - Legend"
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