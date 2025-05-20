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

// Define proper types
interface PieChartData {
  name: string;
  value: number;
}

interface BranchWinLoss {
  branch_name: string;
  won_count: number;
  lost_count: number;
  pending_count: number;
  total_count: number;
  win_ratio: number;
}

interface BranchRevenueByBidItem {
  branch_name: string;
  mpt_revenue: number;
  sale_items_revenue: number;
  equipment_rental_revenue: number;
  permanent_signs_revenue: number;
}

interface BranchGrossProfitMetrics {
  branch_name: string;
  total_gross_profit: number;
  mpt_gross_profit: number;
  equipment_rental_gross_profit: number;
  sale_items_gross_profit: number;
  permanent_signs_gross_profit: number;
}

interface EstimateData {
  branch_win_loss?: BranchWinLoss[];
  branch_revenue_by_bid_item?: BranchRevenueByBidItem[];
  branch_gross_profit_metrics?: BranchGrossProfitMetrics[];
}

// Define color palette for the charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A3A3A3"];

const PieChartCard = ({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: PieChartData[];
}) => {
  // Handle empty or null data
  const validData = data && data.length > 0 
    ? data.filter(item => item.value > 0) 
    : [{ name: "No Data", value: 100 }];

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
                data={validData}
                cx="50%"
                cy="45%"
                innerRadius={0}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={1}
                dataKey="value"
                label={({ name, percent }) => 
                  validData.length === 1 && validData[0].name === "No Data" 
                    ? "" 
                    : `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {validData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={validData[0].name === "No Data" ? "#E0E0E0" : COLORS[index % COLORS.length]}
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

export function ChartPieRow({ 
  data, 
  startDate, 
  endDate 
}: { 
  data?: EstimateData; 
  startDate?: string; 
  endDate?: string;
}) {
  // Handle null data
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
        <PieChartCard
          title="Win/Loss Percentage"
          description="Branch Performance"
          data={[]}
        />
        <PieChartCard
          title="Revenue by Bid Item"
          description="Branch Performance"
          data={[]}
        />
        <PieChartCard
          title="Gross Profit by Bid Item"
          description="Branch Performance"
          data={[]}
        />
      </div>
    );
  }

  // Process branch win/loss data
  const winLossData: PieChartData[] = data.branch_win_loss?.map(branch => ({
    name: branch.branch_name,
    value: branch.total_count > 0 ? branch.won_count : 0
  })) || [];

  // Process revenue by bid item data
  const totalRevenue: Record<string, number> = {
    mpt: 0,
    sale: 0,
    equipment: 0,
    signs: 0
  };
  
  data.branch_revenue_by_bid_item?.forEach(branch => {
    // Sum revenue by type across all branches
    totalRevenue.mpt += (branch.mpt_revenue || 0);
    totalRevenue.sale += (branch.sale_items_revenue || 0);
    totalRevenue.equipment += (branch.equipment_rental_revenue || 0);
    totalRevenue.signs += (branch.permanent_signs_revenue || 0);
  });

  const revenueData: PieChartData[] = [
    { name: "MPT", value: totalRevenue.mpt || 0 },
    { name: "Sale Items", value: totalRevenue.sale || 0 },
    { name: "Equipment Rental", value: totalRevenue.equipment || 0 },
    { name: "Permanent Signs", value: totalRevenue.signs || 0 }
  ].filter(item => item.value > 0);

  // Process gross profit by bid item data
  const totalProfit: Record<string, number> = {
    mpt: 0,
    sale: 0,
    equipment: 0,
    signs: 0
  };
  
  data.branch_gross_profit_metrics?.forEach(branch => {
    // Sum profit by type across all branches
    totalProfit.mpt += (branch.mpt_gross_profit || 0);
    totalProfit.sale += (branch.sale_items_gross_profit || 0);
    totalProfit.equipment += (branch.equipment_rental_gross_profit || 0);
    totalProfit.signs += (branch.permanent_signs_gross_profit || 0);
  });

  const profitData: PieChartData[] = [
    { name: "MPT", value: totalProfit.mpt || 0 },
    { name: "Sale Items", value: totalProfit.sale || 0 },
    { name: "Equipment Rental", value: totalProfit.equipment || 0 },
    { name: "Permanent Signs", value: totalProfit.signs || 0 }
  ].filter(item => item.value > 0);

  // Get date range for description
  const description = startDate && endDate 
    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` 
    : "All Time";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 w-full">
      <PieChartCard
        title="Win/Loss by Branch"
        description={description}
        data={winLossData}
      />
      <PieChartCard
        title="Revenue by Bid Item"
        description={description}
        data={revenueData}
      />
      <PieChartCard
        title="Gross Profit by Bid Item"
        description={description}
        data={profitData}
      />
    </div>
  );
}