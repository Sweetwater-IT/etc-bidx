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
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const data = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
  { x: 180, y: 230, z: 340 },
  { x: 190, y: 320, z: 420 },
  { x: 160, y: 180, z: 300 },
  { x: 130, y: 350, z: 380 },
  { x: 200, y: 150, z: 240 },
  { x: 140, y: 270, z: 360 },
  { x: 170, y: 190, z: 280 },
  { x: 120, y: 310, z: 440 },
  { x: 150, y: 240, z: 320 },
];

export function ChartScatter() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Scatter Plot</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="X Axis" />
              <YAxis type="number" dataKey="y" name="Y Axis" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name="Data Points"
                data={data}
                fill="#4285F4"
                line={{ stroke: "#4285F4", strokeWidth: 1 }}
                lineType="fitting"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 