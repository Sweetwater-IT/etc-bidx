"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SaleTrackerItem } from "@/data/sale-tracker"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface SaleTrackerMetrics {
  totalSales: number
  averagePrice: number
  pendingItems: number
  responseRate: number
}

interface SaleTrackerCardsProps {
  data: SaleTrackerItem[]
}

function calculateMetrics(data: SaleTrackerItem[]): SaleTrackerMetrics {
  const totalSales = data.reduce((sum, item) => sum + item.totalPrice, 0)
  const averagePrice = totalSales / data.length || 0
  const pendingItems = data.filter(item => item.status === "Pending").length
  const responseRate = (data.filter(item => item.status === "Approved").length / data.length) * 100 || 0

  return {
    totalSales,
    averagePrice,
    pendingItems,
    responseRate
  }
}

export function SaleTrackerCards({ data }: SaleTrackerCardsProps) {
  const metrics = calculateMetrics(data)

  return (
    <div className="grid gap-4">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Sales</div>
            <Badge variant="default">+12%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total value of all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Average Price</div>
            <Badge variant="default">+5%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.averagePrice.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Average price per item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Pending Items</div>
            <Badge variant="default">+8%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingItems}</div>
            <p className="text-xs text-muted-foreground">Items awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Response Rate</div>
            <Badge variant="default">-2%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Approval rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Sale Items Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">{item.jobNumber}</div>
              <Badge 
                variant={item.status.toLowerCase() === "approved" ? "default" : "secondary"}
              >
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold mb-2">{item.description}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Quantity:</div>
                <div className="text-right">{item.quantity}</div>
                <div className="text-muted-foreground">Unit Price:</div>
                <div className="text-right">${item.unitPrice}</div>
                <div className="text-muted-foreground">Total Price:</div>
                <div className="text-right font-medium">${item.totalPrice}</div>
                <div className="text-muted-foreground">Created:</div>
                <div className="text-right">{format(new Date(item.createdAt), "MMM d, yyyy")}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 