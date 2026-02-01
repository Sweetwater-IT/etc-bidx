"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"
import { Users, Package, Layers, TrendingUp, Grid3x3 } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  Pie,
  PieChart,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { localDateStringToDate } from "@/utils/daily-tracker/date-utils"

interface MetricsDisplayProps {
  data: ProductivityEntry[]
  dateRange: { from: Date; to: Date }
}

type ChartType =
  | "signsByEmployee"
  | "sqftByEmployee"
  | "employeePerformance"
  | "stackedSqft"
  | null

export function MetricsDisplay({ data, dateRange }: MetricsDisplayProps) {
  const [openChart, setOpenChart] = useState<ChartType>(null)
  const [hoveredSignsBar, setHoveredSignsBar] = useState<number | null>(null)
  const [hoveredSqftBar, setHoveredSqftBar] = useState<number | null>(null)
  const [hoveredStackedBar, setHoveredStackedBar] = useState<number | null>(null)

  const formattedDateRange = useMemo(() => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
  }, [dateRange])

  const metrics = useMemo(() => {
    try {
      if (!data || data.length === 0) {
        return {
          employees: [],
          totalSigns: 0,
          totalSqft: 0,
          totalSaleSigns: 0,
          totalSaleSqft: 0,
          totalMptSigns: 0,
          totalMptSqft: 0,
          timeSeriesData: [],
          employeeTimeSeriesData: [],
        }
      }

      // Employee metrics with type breakdown
      const employeeMap = new Map<
        string,
        {
          employee: string
          totalSigns: number
          totalSqft: number
          saleSigns: number
          saleSqft: number
          mptSigns: number
          mptSqft: number
        }
      >()

      // Time series data
      const dailyMap = new Map<string, { date: string; saleSqft: number; mptSqft: number }>()

      const employeeDailyMap = new Map<string, Map<string, number>>()

      data.forEach((entry) => {
        // Employee aggregation
        const existing = employeeMap.get(entry.employee) || {
          employee: entry.employee,
          totalSigns: 0,
          totalSqft: 0,
          saleSigns: 0,
          saleSqft: 0,
          mptSigns: 0,
          mptSqft: 0,
        }
        existing.totalSigns += entry.quantity
        existing.totalSqft += entry.total_sqft

        if (entry.type === "sale") {
          existing.saleSigns += entry.quantity
          existing.saleSqft += entry.total_sqft
        } else if (entry.type === "mpt") {
          existing.mptSigns += entry.quantity
          existing.mptSqft += entry.total_sqft
        }
        employeeMap.set(entry.employee, existing)

        // Daily aggregation for time series
        const dateStr = entry.date
        const dailyData = dailyMap.get(dateStr) || { date: dateStr, saleSqft: 0, mptSqft: 0 }
        if (entry.type === "sale") {
          dailyData.saleSqft += entry.total_sqft
        } else if (entry.type === "mpt") {
          dailyData.mptSqft += entry.total_sqft
        }
        dailyMap.set(dateStr, dailyData)

        if (!employeeDailyMap.has(entry.employee)) {
          employeeDailyMap.set(entry.employee, new Map())
        }
        const empDailyMap = employeeDailyMap.get(entry.employee)!
        empDailyMap.set(dateStr, (empDailyMap.get(dateStr) || 0) + entry.quantity)
      })

      // Aggregate type metrics
      const saleData = data.filter((e) => e.type === "sale")
      const mptData = data.filter((e) => e.type === "mpt")

      const totalSaleSigns = saleData.reduce((sum, entry) => sum + entry.quantity, 0)
      const totalSaleSqft = saleData.reduce((sum, entry) => sum + entry.total_sqft, 0)
      const totalMptSigns = mptData.reduce((sum, entry) => sum + entry.quantity, 0)
      const totalMptSqft = mptData.reduce((sum, entry) => sum + entry.total_sqft, 0)

      // Total metrics
      const totalSigns = data.reduce((sum, entry) => sum + entry.quantity, 0)
      const totalSqft = data.reduce((sum, entry) => sum + entry.total_sqft, 0)

      // Sort and prepare chart data
      const allEmployees = Array.from(employeeMap.values())
      const primaryEmployees = ["richie", "david", "tommy"]
      
      // Separate primary employees and others
      const primary = allEmployees.filter(emp => primaryEmployees.includes(emp.employee.toLowerCase()))
      const others = allEmployees.filter(emp => !primaryEmployees.includes(emp.employee.toLowerCase()))
      
      // Aggregate "Other" employees
      const otherAggregate = others.reduce((acc, emp) => ({
        employee: "Other",
        totalSigns: acc.totalSigns + emp.totalSigns,
        totalSqft: acc.totalSqft + emp.totalSqft,
        saleSigns: acc.saleSigns + emp.saleSigns,
        saleSqft: acc.saleSqft + emp.saleSqft,
        mptSigns: acc.mptSigns + emp.mptSigns,
        mptSqft: acc.mptSqft + emp.mptSqft,
      }), {
        employee: "Other",
        totalSigns: 0,
        totalSqft: 0,
        saleSigns: 0,
        saleSqft: 0,
        mptSigns: 0,
        mptSqft: 0,
      })
      
      // Combine primary employees with "Other" if there are other employees
      const employees = [...primary.sort((a, b) => b.totalSigns - a.totalSigns)]
      if (others.length > 0) {
        employees.push(otherAggregate)
      }
      
      const timeSeriesData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

      // Use dates from timeSeriesData (filtered) instead of all data
      const allDates = timeSeriesData.map((item) => item.date)
      const employeeTimeSeriesData = allDates.map((date) => {
        const dataPoint: any = { date }
        employeeDailyMap.forEach((dailyMap, employee) => {
          dataPoint[employee] = dailyMap.get(date) || 0
        })
        return dataPoint
      })

    return {
      employees,
      totalSigns,
      totalSqft,
      totalSaleSigns,
      totalSaleSqft,
      totalMptSigns,
      totalMptSqft,
      timeSeriesData,
      employeeTimeSeriesData,
    }
    } catch (error) {
      console.error("[v0] Error calculating metrics:", error)
      return {
        employees: [],
        totalSigns: 0,
        totalSqft: 0,
        totalSaleSigns: 0,
        totalSaleSqft: 0,
        totalMptSigns: 0,
        totalMptSqft: 0,
        timeSeriesData: [],
        employeeTimeSeriesData: [],
      }
    }
  }, [data])

  const hasData = data.length > 0

  const employeeColors = ["#1e40af", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#c026d3"]

  const formatAxisNumber = (value: number) => {
    return value.toLocaleString()
  }

  const getMinChartWidth = (dataLength: number) => {
    // Ensure minimum 40px per data point for readability
    const minWidth = Math.max(dataLength * 40, 800)
    return minWidth
  }

  const formatDateTick = (dateStr: string) => {
    if (!dateStr) return ""

    try {
      // Use localDateStringToDate to avoid UTC timezone shift
      const date = localDateStringToDate(dateStr)

      // Calculate date range in days
      if (!dateRange?.to || !dateRange?.from) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }

      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))

      // If range is more than 45 days, show month + day (e.g., "Jan 15")
      if (daysDiff > 45) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }

      // For shorter ranges, show month and day
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } catch (error) {
      console.error("[v0] Error formatting date tick:", error)
      return ""
    }
  }

  const renderModalChart = () => {
    if (!openChart) return null

    switch (openChart) {
      case "signsByEmployee":
        return (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.employees} barSize={80} style={{ backgroundColor: "white" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="employee"
                  className="capitalize"
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tickFormatter={formatAxisNumber}
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), "Total Signs"]}
                  labelFormatter={(label) => `Employee: ${label}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  cursor={{ fill: "rgba(30, 58, 138, 0.1)" }}
                />
                <Bar
                  dataKey="totalSigns"
                  fill="#1e3a8a"
                  name="Total Signs"
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fill: "#1e3a8a", filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "sqftByEmployee":
        return (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.employees} barSize={80} style={{ backgroundColor: "white" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="employee"
                  className="capitalize"
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tickFormatter={formatAxisNumber}
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                    "Square Footage",
                  ]}
                  labelFormatter={(label) => `Employee: ${label}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  cursor={{ fill: "rgba(30, 58, 138, 0.1)" }}
                />
                <Bar
                  dataKey="totalSqft"
                  fill="#1e3a8a"
                  name="Square Footage"
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fill: "#1e3a8a", filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "employeePerformance": {
        const pieData = [
          { name: "MPT Signs", value: metrics.totalMptSqft },
          { name: "Sale Signs", value: metrics.totalSaleSqft },
        ]
        const totalSqft = metrics.totalMptSqft + metrics.totalSaleSqft
        
        const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
          if (!value || value === 0 || !percent) return null
          const RADIAN = Math.PI / 180
          const radius = outerRadius * 1.4
          const x = cx + radius * Math.cos(-midAngle * RADIAN)
          const y = cy + radius * Math.sin(-midAngle * RADIAN)
          const lineX = cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)
          const lineY = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)
          const textAnchor = x > cx ? "start" : "end"
          
          return (
            <g>
              <path
                d={`M ${lineX},${lineY} L ${x},${y}`}
                stroke="#6b7280"
                strokeWidth={1.5}
                fill="none"
              />
              <circle cx={x} cy={y} r={3} fill="#6b7280" />
              <text
                x={x + (x > cx ? 8 : -8)}
                y={y - 8}
                textAnchor={textAnchor}
                fill="#374151"
                fontSize={13}
                fontWeight={600}
              >
                {name}
              </text>
              <text
                x={x + (x > cx ? 8 : -8)}
                y={y + 8}
                textAnchor={textAnchor}
                fill="#6b7280"
                fontSize={12}
              >
                {(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft
              </text>
              <text
                x={x + (x > cx ? 8 : -8)}
                y={y + 24}
                textAnchor={textAnchor}
                fill="#6b7280"
                fontSize={11}
              >
                ({((percent || 0) * 100).toFixed(1)}%)
              </text>
            </g>
          )
        }
        
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-[450px] w-full max-w-2xl">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 40, right: 120, bottom: 40, left: 120 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    dataKey="value"
                    strokeWidth={3}
                    paddingAngle={3}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    <Cell fill="#fb923c" stroke="#c2410c" strokeWidth={3} />
                    <Cell fill="#60a5fa" stroke="#1e40af" strokeWidth={3} />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} sq ft`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#fb923c", border: "2px solid #c2410c" }} />
                <span className="text-sm text-muted-foreground">MPT Signs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#60a5fa", border: "2px solid #1e40af" }} />
                <span className="text-sm text-muted-foreground">Sale Signs</span>
              </div>
            </div>
          </div>
        )
      }

      case "stackedSqft": {
        const minWidth = getMinChartWidth(metrics.timeSeriesData.length)
        return (
          <div className="overflow-x-auto">
            <div className="h-[500px]" style={{ minWidth: `${minWidth}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickFormatter={(value) => formatDateTick(value)}
                  />
                  <YAxis
                    tickFormatter={formatAxisNumber}
                    tick={{ fontSize: 13 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft`,
                      name === "mptSqft" ? "MPT" : "Sale"
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend 
                    formatter={(value) => value === "mptSqft" ? "MPT Sq Ft" : "Sale Sq Ft"}
                    wrapperStyle={{ fontSize: "13px" }}
                  />
                  <Bar dataKey="saleSqft" stackId="sqft" fill="#60a5fa" stroke="#1e40af" strokeWidth={2} />
                  <Bar dataKey="mptSqft" stackId="sqft" fill="#fb923c" stroke="#c2410c" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  const getModalTitle = () => {
    switch (openChart) {
      case "signsByEmployee":
        return "Total Signs by Employee"
      case "sqftByEmployee":
        return "Total Square Footage by Employee"
      case "employeePerformance":
        return "Square Footage by Type (MPT vs Sale)"
      case "stackedSqft":
        return "Square Footage Over Time (MPT vs Sale)"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1 text-right">
            <div className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <Package className="h-4 w-4" />
              Total Signs Produced
            </div>
            <div className="font-bold text-3xl">{metrics.totalSigns.toLocaleString()}</div>
          </div>

          <div className="space-y-1 text-right">
            <div className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <Layers className="h-4 w-4" />
              Total Square Footage
            </div>
            <div className="font-bold text-3xl">
              {metrics.totalSqft.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <p className="text-muted-foreground text-xs">sq ft</p>
          </div>

          <div className="space-y-1 text-right">
            <div className="text-sm font-medium text-green-600 flex items-center justify-end gap-2">
              <TrendingUp className="h-4 w-4" />
              Sale Signs
            </div>
            <div className="font-bold text-3xl">{metrics.totalSaleSigns.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">
              {metrics.totalSaleSqft.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{" "}
              sq ft
            </p>
          </div>

          <div className="space-y-1 text-right">
            <div className="text-sm font-medium text-blue-600 flex items-center justify-end gap-2">
              <Grid3x3 className="h-4 w-4" />
              MPT Signs
            </div>
            <div className="font-bold text-3xl">{metrics.totalMptSigns.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">
              {metrics.totalMptSqft.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
              sq ft
            </p>
          </div>
        </div>
      )}

      <Dialog open={openChart !== null} onOpenChange={(open) => !open && setOpenChart(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="px-6 py-4 border-b bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{getModalTitle()}</DialogTitle>
              <p className="text-sm text-muted-foreground">{formattedDateRange}</p>
            </DialogHeader>
          </div>
          <div className="p-6 bg-gray-50 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="bg-white rounded-lg p-4 shadow-sm">{renderModalChart()}</div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-gray-100 p-[3px] rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[3px]">
          {/* Total Signs by Employee */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow rounded-none first:rounded-tl-lg [&:nth-child(3)]:rounded-tr-lg [&:nth-child(4)]:rounded-bl-lg last:rounded-br-lg bg-white border-0"
            onClick={() => setOpenChart("signsByEmployee")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Signs by Employee</CardTitle>
              <CardDescription className="text-xs">{formattedDateRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.employees}
                    barSize={60}
                    onMouseMove={(state) => {
                      if (state?.activeTooltipIndex !== undefined) {
                        setHoveredSignsBar(state.activeTooltipIndex)
                      }
                    }}
                    onMouseLeave={() => setHoveredSignsBar(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="employee"
                      className="capitalize"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tickFormatter={formatAxisNumber}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), "Total Signs"]} cursor={false} />
                    <Bar dataKey="totalSigns" fill="#1e3a8a" name="Total Signs" radius={[4, 4, 0, 0]}>
                      {metrics.employees.map((_, index) => (
                        <Cell
                          key={`signs-cell-${index}`}
                          fill={hoveredSignsBar === index ? "#2e4a9a" : "#1e3a8a"}
                          style={{
                            filter:
                              hoveredSignsBar === index ? "drop-shadow(0 4px 8px rgba(30, 58, 138, 0.3))" : "none",
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Total Square Footage by Employee */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow rounded-none bg-white border-0"
            onClick={() => setOpenChart("sqftByEmployee")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Square Footage by Employee</CardTitle>
              <CardDescription className="text-xs">{formattedDateRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.employees}
                    barSize={60}
                    onMouseMove={(state) => {
                      if (state?.activeTooltipIndex !== undefined) {
                        setHoveredSqftBar(state.activeTooltipIndex)
                      }
                    }}
                    onMouseLeave={() => setHoveredSqftBar(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="employee"
                      className="capitalize"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tickFormatter={formatAxisNumber}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                        "Square Footage",
                      ]}
                      cursor={false}
                    />
                    <Bar dataKey="totalSqft" fill="#1e3a8a" name="Square Footage" radius={[4, 4, 0, 0]}>
                      {metrics.employees.map((_, index) => (
                        <Cell
                          key={`sqft-cell-${index}`}
                          fill={hoveredSqftBar === index ? "#2e4a9a" : "#1e3a8a"}
                          style={{
                            filter: hoveredSqftBar === index ? "drop-shadow(0 4px 8px rgba(30, 58, 138, 0.3))" : "none",
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* MPT vs Sale Square Footage */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow rounded-none lg:rounded-tr-lg bg-white border-0"
            onClick={() => setOpenChart("employeePerformance")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Square Footage by Type</CardTitle>
              <CardDescription className="text-xs">{formattedDateRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
                    <Pie
                      data={[
                        { name: "MPT", value: metrics.totalMptSqft },
                        { name: "Sale", value: metrics.totalSaleSqft },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      strokeWidth={2}
                      paddingAngle={3}
                      label={({ cx, cy, midAngle, outerRadius, percent, value, name }: any) => {
                        if (!value || value === 0 || !percent) return null
                        const RADIAN = Math.PI / 180
                        const radius = outerRadius * 1.5
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        const lineX = cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)
                        const lineY = cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)
                        const textAnchor = x > cx ? "start" : "end"
                        
                        return (
                          <g>
                            <path
                              d={`M ${lineX},${lineY} L ${x},${y}`}
                              stroke="#6b7280"
                              strokeWidth={1}
                              fill="none"
                            />
                            <circle cx={x} cy={y} r={2} fill="#6b7280" />
                            <text
                              x={x + (x > cx ? 5 : -5)}
                              y={y - 4}
                              textAnchor={textAnchor}
                              fill="#374151"
                              fontSize={10}
                              fontWeight={600}
                            >
                              {name}
                            </text>
                            <text
                              x={x + (x > cx ? 5 : -5)}
                              y={y + 8}
                              textAnchor={textAnchor}
                              fill="#6b7280"
                              fontSize={9}
                            >
                              {(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft ({((percent || 0) * 100).toFixed(0)}%)
                            </text>
                          </g>
                        )
                      }}
                      labelLine={false}
                    >
                      <Cell fill="#fb923c" stroke="#c2410c" strokeWidth={2} />
                      <Cell fill="#60a5fa" stroke="#1e40af" strokeWidth={2} />
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })} sq ft`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stacked Square Footage Over Time */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow rounded-none lg:rounded-b-lg bg-white border-0 col-span-1 lg:col-span-3"
            onClick={() => setOpenChart("stackedSqft")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Square Footage Over Time (MPT vs Sale)</CardTitle>
              <CardDescription className="text-xs">{formattedDateRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={metrics.timeSeriesData}
                    onMouseMove={(state) => {
                      if (state?.activeTooltipIndex !== undefined) {
                        setHoveredStackedBar(state.activeTooltipIndex)
                      }
                    }}
                    onMouseLeave={() => setHoveredStackedBar(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => formatDateTick(value)} />
                    <YAxis tickFormatter={formatAxisNumber} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft`,
                        name === "mptSqft" ? "MPT" : "Sale"
                      ]}
                      cursor={false}
                    />
                    <Legend 
                      formatter={(value) => value === "mptSqft" ? "MPT Sq Ft" : "Sale Sq Ft"}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                    <Bar dataKey="saleSqft" stackId="sqft" fill="#60a5fa" strokeWidth={2} radius={[0, 0, 4, 4]}>
                      {metrics.timeSeriesData.map((_, index) => (
                        <Cell
                          key={`sale-cell-${index}`}
                          fill={hoveredStackedBar === index ? "#3b82f6" : "#60a5fa"}
                          stroke="#1e40af"
                          style={{
                            filter: hoveredStackedBar === index ? "drop-shadow(0 4px 8px rgba(30, 64, 175, 0.3))" : "none",
                          }}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="mptSqft"
                      stackId="sqft"
                      fill="#fb923c"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                    >
                      {metrics.timeSeriesData.map((_, index) => (
                        <Cell
                          key={`mpt-cell-${index}`}
                          fill={hoveredStackedBar === index ? "#f97316" : "#fb923c"}
                          stroke="#c2410c"
                          style={{
                            filter: hoveredStackedBar === index ? "drop-shadow(0 4px 8px rgba(194, 65, 12, 0.3))" : "none",
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Employee Performance Breakdown table outside of the chart grid */}
      {hasData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Performance Breakdown
            </CardTitle>
            <CardDescription>{formattedDateRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="text-right font-semibold">Total Signs</TableHead>
                  <TableHead className="text-right font-semibold">Total Sq Ft</TableHead>
                  <TableHead className="text-right font-semibold">Sale Signs</TableHead>
                  <TableHead className="text-right font-semibold">Sale Sq Ft</TableHead>
                  <TableHead className="text-right font-semibold">MPT Signs</TableHead>
                  <TableHead className="text-right font-semibold">MPT Sq Ft</TableHead>
                  <TableHead className="text-right font-semibold">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.employees.map((employee) => (
                  <TableRow key={employee.employee} className="hover:bg-muted/30">
                    <TableCell className="font-medium capitalize">{employee.employee}</TableCell>
                    <TableCell className="text-right font-semibold">{employee.totalSigns.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {employee.totalSqft.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </TableCell>
                    <TableCell className="text-right">{employee.saleSigns.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {employee.saleSqft.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </TableCell>
                    <TableCell className="text-right">{employee.mptSigns.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {employee.mptSqft.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {((employee.totalSigns / metrics.totalSigns) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/70 font-semibold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{metrics.totalSigns.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {metrics.totalSqft.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  <TableCell className="text-right">{metrics.totalSaleSigns.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {metrics.totalSaleSqft.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  <TableCell className="text-right">{metrics.totalMptSigns.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {metrics.totalMptSqft.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </TableCell>
                  <TableCell className="text-right">100.0%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}