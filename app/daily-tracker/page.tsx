"use client"

import type React from "react"
import { createBrowserClient } from "@supabase/ssr"
import { dateToLocalDateString } from "@/utils/daily-tracker/date-utils" // Import dateToLocalDateString
import { localDateStringToDate } from "@/utils/daily-tracker/date-utils" // Declare localDateStringToDate

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/daily-tracker/use-toast"
import { DataEntryForm } from "@/components/daily-tracker/data-entry-form"
import { MetricsDisplay } from "@/components/daily-tracker/metrics-display"
import { DateRangePicker } from "@/components/daily-tracker/date-range-picker"
import { CsvImport } from "@/components/daily-tracker/csv-import"
import { DailyEntryForm } from "@/components/daily-tracker/daily-entry-form" // Import DailyEntryForm
import { useProductivityData } from "@/hooks/daily-tracker/use-productivity-data"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { ChevronDown, Plus, Upload, MoreHorizontal, CalendarPlus } from "lucide-react"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"

export default function DailyTrackerDashboard() {
  const router = useRouter()
  const { data, addEntry, importCsv, getLastEntryDate, isLoading, refetch } = useProductivityData()
  const { toast } = useToast()
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showDailyEntry, setShowDailyEntry] = useState(false) // Declare showDailyEntry
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dateToDelete, setDateToDelete] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date()
    const from = new Date(to.getFullYear(), 0, 1) // Year to Date
    return { from, to }
  })
  const [datePreset, setDatePreset] = useState<string>("Year to Date")

  const filteredData = useMemo(() => {
    // Normalize date range to YYYY-MM-DD strings for comparison
    if (!dateRange?.from || !dateRange?.to) {
      return []
    }
    
    try {
      // Use local date strings to avoid timezone shifts
      const fromStr = dateToLocalDateString(dateRange.from)
      const toStr = dateToLocalDateString(dateRange.to)
      
      return data.filter((entry) => {
        // entry.date is already in YYYY-MM-DD format (local)
        return entry.date >= fromStr && entry.date <= toStr
      })
    } catch (error) {
      console.error("[v0] Error filtering data:", error)
      return []
    }
  }, [data, dateRange])

  const dailySummary = useMemo(() => {
    const grouped = new Map<string, { totalSigns: number; totalSqft: number; entries: ProductivityEntry[] }>()

    // Daily tab always shows all time data
    data.forEach((entry) => {
      const dateKey = entry.date
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { totalSigns: 0, totalSqft: 0, entries: [] })
      }
      const day = grouped.get(dateKey)!
      day.totalSigns += entry.quantity
      day.totalSqft += entry.total_sqft
      day.entries.push(entry)
    })

    return Array.from(grouped.entries())
      .map(([date, summary]) => ({ date, ...summary }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data])

  const totalPages = Math.ceil(dailySummary.length / pageSize)
  const paginatedDailySummary = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return dailySummary.slice(startIndex, startIndex + pageSize)
  }, [dailySummary, currentPage, pageSize])

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return []
    // Daily tab always shows all time data
    return data.filter((entry) => entry.date === selectedDate)
  }, [data, selectedDate])

  const selectedDayMetrics = useMemo(() => {
    const saleTotal = selectedDayEntries.filter((e) => e.type === "sale").reduce((sum, e) => sum + e.quantity, 0)
    const mptTotal = selectedDayEntries.filter((e) => e.type === "mpt").reduce((sum, e) => sum + e.quantity, 0)
    return { saleTotal, mptTotal }
  }, [selectedDayEntries])

  const lastEntryDate = getLastEntryDate()

  const handleAddEntry = async (entry: ProductivityEntry) => {
    await addEntry(entry)
    setShowEntryForm(false)
  }

  const handleImportCsv = async (entries: ProductivityEntry[]) => {
    await importCsv(entries)
  }

  const toggleRow = (date: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedRows(newExpanded)
  }

  const handleDeleteDay = (date: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDateToDelete(date)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!dateToDelete) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { error } = await supabase
        .from("sign_production")
        .delete()
        .eq("date", dateToDelete)

      if (error) {
        console.error("[v0] Error deleting entries:", error)
        toast({
          title: "Error",
          description: "Failed to delete entries. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Refetch data
      refetch()
      toast({
        title: "Success",
        description: "Entries deleted successfully",
      })
      setDeleteDialogOpen(false)
      setDateToDelete(null)
    } catch (error) {
      console.error("[v0] Error in confirmDelete:", error)
      toast({
        title: "Error",
        description: "Failed to delete entries. Please try again.",
        variant: "destructive",
      })
    }
  }

  const currentDayIndex = useMemo(() => {
    if (!selectedDate) return -1
    return dailySummary.findIndex((day) => day.date === selectedDate)
  }, [selectedDate, dailySummary])

  const navigateDay = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? currentDayIndex - 1 : currentDayIndex + 1
    if (newIndex >= 0 && newIndex < dailySummary.length) {
      setSelectedDate(dailySummary[newIndex].date)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      navigateDay("prev")
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      navigateDay("next")
    }
  }

  const resetToYTD = () => {
    const to = new Date()
    const from = new Date(to.getFullYear(), 0, 1)
    setDateRange({ from, to })
    setDatePreset("Year to Date")
  }

  const handleDailyEntries = async (entries: ProductivityEntry[]) => {
    // Implement the logic to handle daily entries
    console.log("Daily entries submitted:", entries)
    setShowDailyEntry(false)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col py-4 gap-2 md:gap-6 md:py-6">
          <CsvImport open={showCsvImport} onOpenChange={setShowCsvImport} onImport={handleImportCsv} />

          <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onKeyDown={handleKeyDown}>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Daily Production Breakdown</DialogTitle>
                    <DialogDescription>
                      {selectedDate &&
                        localDateStringToDate(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2 mr-12">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateDay("prev")}
                      disabled={currentDayIndex <= 0}
                      className="h-8 w-8"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateDay("next")}
                      disabled={currentDayIndex >= dailySummary.length - 1}
                      className="h-8 w-8"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mb-3 py-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Sale Signs</p>
                  <p className="text-3xl font-semibold tabular-nums">{selectedDayMetrics.saleTotal.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total MPT Signs</p>
                  <p className="text-3xl font-semibold tabular-nums">{selectedDayMetrics.mptTotal.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Employee</th>
                      <th className="text-left py-2 px-3 font-medium">Dimensions</th>
                      <th className="text-center py-2 px-3 font-medium">Type</th>
                      <th className="text-right py-2 px-3 font-medium">Quantity</th>
                      <th className="text-right py-2 px-3 font-medium">Sq Ft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayEntries.map((entry, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 capitalize">{entry.employee}</td>
                        <td className="py-2 px-3">
                          {`${entry.dimension_l}" × "${entry.dimension_w}"`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              entry.type === "mpt"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            {entry.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{entry.quantity.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {entry.total_sqft.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between mb-6">
            <h1 className="font-semibold text-3xl tracking-tight">Daily Tracker Productivity Dashboard</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/daily-tracker/daily-entry")}>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Import
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEntryForm(!showEntryForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCsvImport(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    preset={datePreset}
                    onPresetChange={setDatePreset}
                  />
                  <Button variant="ghost" size="icon" onClick={resetToYTD} title="Reset to Year to Date">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                  </Button>
                </div>
                {lastEntryDate && (
                  <p className="text-muted-foreground text-sm">
                    Last updated {localDateStringToDate(lastEntryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <MetricsDisplay data={filteredData} dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="daily" className="mt-6">
              {showEntryForm && (
                <Card className="mb-8 border-2">
                  <CardHeader>
                    <CardDescription>{"Enter today's sign production data"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataEntryForm onSubmit={handleAddEntry} onCancel={() => setShowEntryForm(false)} />
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedDailySummary.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                  {Math.min(currentPage * pageSize, dailySummary.length)} of {dailySummary.length} results
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {pageSize}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPageSize(10)}>10</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPageSize(25)}>25</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPageSize(50)}>50</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPageSize(100)}>100</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="bg-card rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-muted-foreground text-sm">
                        <th className="text-left font-medium px-6 py-3">Date</th>
                        <th className="text-right font-medium px-6 py-3">Signs Made</th>
                        <th className="text-right font-medium px-6 py-3">Square Footage</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-muted-foreground">
                            Loading...
                          </td>
                        </tr>
                      ) : dailySummary.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-muted-foreground">
                            No data available. Use the Import button to add entries.
                          </td>
                        </tr>
                      ) : (
                        paginatedDailySummary.map((day) => (
                          <tr
                            key={day.date}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedDate(day.date)}
                          >
                            <td className="px-6 py-3 text-sm">
                              {localDateStringToDate(day.date).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-3 text-sm text-right tabular-nums">
                              {day.totalSigns.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-sm text-right tabular-nums">
                              {day.totalSqft.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              sq ft
                            </td>
                            <td className="px-6 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedDate(day.date)}>View Details</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteDay(day.date, e)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {dailySummary.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete entries for this day?</AlertDialogTitle>
                <AlertDialogDescription>
                  {dateToDelete && `Are you sure you want to delete all entries from ${localDateStringToDate(dateToDelete).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}? This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
