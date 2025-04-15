"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";

const monthlyData = [
  { month: "Jan", value1: 400, value2: 240 },
  { month: "Feb", value1: 600, value2: 380 },
  { month: "Mar", value1: 500, value2: 300 },
  { month: "Apr", value1: 200, value2: 400 },
  { month: "May", value1: 450, value2: 320 },
  { month: "Jun", value1: 470, value2: 380 },
];

const horizontalData = monthlyData.map(item => ({
  month: item.month,
  value: item.value1,
}));

const COLORS = ["#4285F4", "#81B4F9"];

const HorizontalBarChart = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Bar Chart - Horizontal</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={horizontalData}
              margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="month" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Trending up by 5.2% this month</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing total visitors for the last 6 months
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const VerticalBarChart = ({ title }: { title: string }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value1" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="value2" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Trending up by 5.2% this month</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing total visitors for the last 6 months
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export function ChartBarRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
      <HorizontalBarChart />
      <VerticalBarChart title="Bar Chart - Multiple" />
      <VerticalBarChart title="Bar Chart - Multiple" />
    </div>
  );
} 