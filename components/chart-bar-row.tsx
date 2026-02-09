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
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// Helper function to format date for display
const formatMonth = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

// Helper to calculate growth
const calculateGrowth = (data, dataKey) => {
  if (!data || data.length < 2) return 0;
  const lastMonth = data[data.length - 1][dataKey] || 0;
  const prevMonth = data[data.length - 2][dataKey] || 0;
  if (prevMonth === 0) return 100; // If previous was 0, show 100% growth
  return ((lastMonth - prevMonth) / prevMonth) * 100;
};

const HorizontalBarChart = ({ data }) => {
  // Process branch job types data
  const chartData = data?.branch_job_types?.map(branch => ({
    branch: branch.branch_name,
    public: branch.public_jobs,
    private: branch.private_jobs,
  })) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Jobs Bid Summary</CardTitle>
        <CardDescription>Public vs Private by Branch</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="branch" type="category" />
              <Tooltip />
              <Legend />
              <Bar name="Public" dataKey="public" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
              <Bar name="Private" dataKey="private" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartData.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {chartData.reduce((sum, branch) => sum + branch.public, 0) > 
                 chartData.reduce((sum, branch) => sum + branch.private, 0)
                  ? "More public jobs than private"
                  : "More private jobs than public"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProjectStartsChart = ({ data }) => {
  // Process project starts data and ensure it's sorted by date
  const chartData = data?.project_starts
    ?.map(item => ({
      month: formatMonth(item.month),
      value: item.project_count,
      // Store original date for sorting
      originalDate: new Date(item.month)
    }))
    ?.sort((a, b) => a.originalDate - b.originalDate) || [];
  
  // Calculate growth from last month
  const growth = calculateGrowth(chartData, 'value');
  const isPositive = growth >= 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Project Starts</CardTitle>
        <CardDescription>Monthly project start trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar name="Projects" dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartData.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconTrendingUp className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <p className="text-sm font-medium">
                {isPositive 
                  ? `Trending up by ${growth.toFixed(1)}% from previous month` 
                  : `Trending down by ${Math.abs(growth).toFixed(1)}% from previous month`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TotalHoursChart = ({ data }) => {
  // Process monthly hours data and ensure it's sorted by date
  const chartData = data?.monthly_hours
    ?.map(item => ({
      month: formatMonth(item.month),
      mpt: item.mpt_hours,
      signs: item.permanent_sign_hours,
      // Store original date for sorting
      originalDate: new Date(item.month)
    }))
    ?.sort((a, b) => a.originalDate - b.originalDate) || [];
  
  // Calculate total growth
  const totalGrowth = calculateGrowth(chartData, 'mpt') + calculateGrowth(chartData, 'signs');
  const isPositive = totalGrowth >= 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Total Hours Sold</CardTitle>
        <CardDescription>MPT vs Permanent Signs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar name="MPT Hours" dataKey="mpt" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar name="Sign Hours" dataKey="signs" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartData.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconTrendingUp className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <p className="text-sm font-medium">
                {isPositive 
                  ? `Overall hours trending up from previous month` 
                  : `Overall hours trending down from previous month`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function ChartBarRow({ data }) {
  // Handle null data
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs Bid Summary</CardTitle>
            <CardDescription>No data available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Data unavailable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Starts</CardTitle>
            <CardDescription>No data available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Data unavailable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Hours Sold</CardTitle>
            <CardDescription>No data available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Data unavailable</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
      <HorizontalBarChart data={data} />
      <ProjectStartsChart data={data} />
      <TotalHoursChart data={data} />
    </div>
  );
}