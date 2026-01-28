"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import type React from "react"
import { useState, useEffect } from "react"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"
import { createBrowserClient } from "@supabase/ssr"
import { dateToLocalDateString } from "@/utils/daily-tracker/date-utils"
import { localDateStringToDate } from "@/utils/daily-tracker/date-utils"

interface SignDimension {
  id: number
  dimension_label: string
  square_footage: number
}

interface DimensionEntry {
  dimension: string
  mpt: string
  sale: string
  sq_ft: number
}

interface EmployeeData {
  [employee: string]: DimensionEntry[]
}

interface DailyEntryFormProps {
  onSubmit: (entries: ProductivityEntry[]) => Promise<void>
  onCancel: () => void
}

const EMPLOYEE_OPTIONS = ["Richie", "Dezz", "Woody", "David", "Tommy", "Julia", "Brandon", "Other"]


export function DailyEntryForm({ onSubmit, onCancel }: DailyEntryFormProps) {
  // Initialize date to today using timezone-safe method
  const [date, setDate] = useState(() => dateToLocalDateString(new Date()))
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [employeeData, setEmployeeData] = useState<EmployeeData>({})
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [dimensions, setDimensions] = useState<SignDimension[]>([])
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(true)
  const [showAddDimension, setShowAddDimension] = useState(false)
  const [newDimensionLabel, setNewDimensionLabel] = useState("")
  const [newDimensionLength, setNewDimensionLength] = useState("")
  const [newDimensionWidth, setNewDimensionWidth] = useState("")
  const [newDimensionSqft, setNewDimensionSqft] = useState("")
  const [dimensionInputMode, setDimensionInputMode] = useState<"text" | "lxw">("lxw")
  const [dimensionSearch, setDimensionSearch] = useState("")

  useEffect(() => {
    const fetchDimensions = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      try {
        // Fetch standard dimensions
        const { data: standardDims, error: standardError } = await supabase
          .from("sign_dimensions")
          .select("*")
          .order("id", { ascending: true })
        
        if (standardError) {
          console.error("Error fetching standard dimensions:", standardError)
        }

        // Fetch custom dimensions
        const { data: customDims, error: customError } = await supabase
          .from("custom_dimensions")
          .select("*")
          .order("created_at", { ascending: true })
        
        if (customError) {
          console.error("Error fetching custom dimensions:", customError)
        }

        // Combine custom dimensions first (at the top), then standard dimensions
        const allDims = [...(customDims || []), ...(standardDims || [])]
        setDimensions(allDims)
      } catch (error) {
        console.error("Error in fetchDimensions:", error)
      }
      
      setIsLoadingDimensions(false)
    }
    
    fetchDimensions()
  }, [])

  const handleAddDimension = async () => {
    let label = newDimensionLabel.trim()
    let sqft = parseFloat(newDimensionSqft)

    if (dimensionInputMode === "lxw") {
      const length = parseFloat(newDimensionLength)
      const width = parseFloat(newDimensionWidth)
      
      if (!length || !width) {
        alert("Please enter both length and width")
        return
      }
      
      label = `${length} x ${width}`
      sqft = (length * width) / 144
    } else {
      if (!label || !newDimensionSqft.trim()) {
        alert("Please enter both dimension label and square footage")
        return
      }
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data, error } = await supabase
        .from("custom_dimensions")
        .insert([
          {
            dimension_label: label,
            square_footage: sqft,
          },
        ])
        .select()

      if (error) {
        console.error("Error adding custom dimension:", error)
        alert("Failed to add custom dimension")
        return
      }

      // Add new dimension to local state at the TOP
      if (data && data[0]) {
        setDimensions([data[0], ...dimensions])
        
        // Add to all selected employees
        const newData = { ...employeeData }
        for (const employee of selectedEmployees) {
          newData[employee].push({
            dimension: label,
            mpt: "",
            sale: "",
            sq_ft: sqft,
          })
        }
        setEmployeeData(newData)
      }

      setNewDimensionLabel("")
      setNewDimensionLength("")
      setNewDimensionWidth("")
      setNewDimensionSqft("")
      setShowAddDimension(false)
    } catch (error) {
      console.error("Error in handleAddDimension:", error)
      alert("Failed to add custom dimension")
    }
  }

  const toggleEmployee = (employee: string) => {
    if (selectedEmployees.includes(employee)) {
      setSelectedEmployees(selectedEmployees.filter((e) => e !== employee))
      const newData = { ...employeeData }
      delete newData[employee]
      setEmployeeData(newData)
      if (currentEmployeeIndex >= selectedEmployees.length - 1) {
        setCurrentEmployeeIndex(Math.max(0, selectedEmployees.length - 2))
      }
    } else {
      setSelectedEmployees([...selectedEmployees, employee])
      setEmployeeData({
        ...employeeData,
        [employee]: dimensions.map((dim) => ({ dimension: dim.dimension_label, mpt: "", sale: "", sq_ft: dim.square_footage })),
      })
    }
  }

  const updateQuantity = (dimension: string, type: "mpt" | "sale", value: string) => {
    if (selectedEmployees.length === 0) return
    const currentEmployee = selectedEmployees[currentEmployeeIndex]
    const newData = { ...employeeData }
    const entry = newData[currentEmployee].find((e) => e.dimension === dimension)
    if (entry) {
      entry[type] = value
      setEmployeeData(newData)
    }
  }

  const goToNextEmployee = () => {
    if (currentEmployeeIndex < selectedEmployees.length - 1) {
      setCurrentEmployeeIndex(currentEmployeeIndex + 1)
    }
  }

  const goToPreviousEmployee = () => {
    if (currentEmployeeIndex > 0) {
      setCurrentEmployeeIndex(currentEmployeeIndex - 1)
    }
  }

  const goToReview = () => {
    setShowReview(true)
  }

  const goBackToEdit = () => {
    setShowReview(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate that date is in YYYY-MM-DD format (local timezone)
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        alert("Invalid date format. Please select a valid date.")
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Submitting entries with local date:", date)
      const productivityEntries: ProductivityEntry[] = []

      for (const employee of selectedEmployees) {
        const entries = employeeData[employee]
        for (const entry of entries) {
          // Parse dimension string to get length and width for database storage
          const [lengthStr, widthStr] = entry.dimension.split(" x ")
          const length = Number.parseFloat(lengthStr)
          const width = Number.parseFloat(widthStr)
          const sqft = entry.sq_ft

          if (entry.mpt && Number.parseInt(entry.mpt) > 0) {
            const quantity = Number.parseInt(entry.mpt)
            productivityEntries.push({
              date,
              employee: employee.toLowerCase(),
              dimension_l: length,
              dimension_w: width,
              sqft: sqft,
              type: "mpt",
              quantity,
              total_sqft: Number.parseFloat((sqft * quantity).toFixed(2)),
            })
          }

          if (entry.sale && Number.parseInt(entry.sale) > 0) {
            const quantity = Number.parseInt(entry.sale)
            productivityEntries.push({
              date,
              employee: employee.toLowerCase(),
              dimension_l: length,
              dimension_w: width,
              sqft: sqft,
              type: "sale",
              quantity,
              total_sqft: Number.parseFloat((sqft * quantity).toFixed(2)),
            })
          }
        }
      }

      if (productivityEntries.length === 0) {
        alert("Please enter at least one quantity for MPT or Sale signs")
        setIsSubmitting(false)
        return
      }

      await onSubmit(productivityEntries)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting entries:", error)
      alert("Error submitting entries. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Calculate totals for review
  const calculateTotals = () => {
    let totalMpt = 0
    let totalSale = 0
    let totalSqft = 0

    for (const employee of selectedEmployees) {
      const entries = employeeData[employee]
      for (const entry of entries) {
        const sqft = entry.sq_ft

        if (entry.mpt && Number.parseInt(entry.mpt) > 0) {
          const quantity = Number.parseInt(entry.mpt)
          totalMpt += quantity
          totalSqft += sqft * quantity
        }

        if (entry.sale && Number.parseInt(entry.sale) > 0) {
          const quantity = Number.parseInt(entry.sale)
          totalSale += quantity
          totalSqft += sqft * quantity
        }
      }
    }

    return { totalMpt, totalSale, totalSqft: totalSqft.toFixed(2) }
  }

  // Success screen after submission
  if (isSubmitted) {
    const totals = calculateTotals()
    
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Report Submitted Successfully!</h2>
          <p className="text-muted-foreground max-w-md">
            Daily production report for {localDateStringToDate(date).toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric", 
              year: "numeric" 
            })} has been saved.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Signs</p>
              <p className="text-2xl font-bold">{totals.totalMpt + totals.totalSale}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MPT</p>
              <p className="text-2xl font-bold text-blue-600">{totals.totalMpt}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sale</p>
              <p className="text-2xl font-bold text-green-600">{totals.totalSale}</p>
            </div>
          </div>
        </div>

        <Button onClick={onCancel} size="lg" className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  if (showReview) {
    const totals = calculateTotals()
    
    // Build flat list of all entries for table display
    const allEntries: Array<{
      employee: string
      dimension: string
      type: "mpt" | "sale"
      quantity: number
      sqft: number
    }> = []

    for (const employee of selectedEmployees) {
      const entries = employeeData[employee]
      for (const entry of entries) {
        const sqft = entry.sq_ft

        if (entry.mpt && Number.parseInt(entry.mpt) > 0) {
          const quantity = Number.parseInt(entry.mpt)
          allEntries.push({
            employee,
            dimension: entry.dimension,
            type: "mpt",
            quantity,
            sqft: sqft * quantity,
          })
        }

        if (entry.sale && Number.parseInt(entry.sale) > 0) {
          const quantity = Number.parseInt(entry.sale)
          allEntries.push({
            employee,
            dimension: entry.dimension,
            type: "sale",
            quantity,
            sqft: sqft * quantity,
          })
        }
      }
    }
    
    return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Review Daily Production Report</h2>
            <p className="text-muted-foreground mt-1">
              {localDateStringToDate(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
    
          {/* Summary Metrics - Matching Daily Modal Style */}
          <div className="grid grid-cols-2 gap-6 py-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Sale Signs</p>
              <p className="text-3xl font-semibold tabular-nums">{totals.totalSale.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total MPT Signs</p>
              <p className="text-3xl font-semibold tabular-nums">{totals.totalMpt.toLocaleString()}</p>
            </div>
          </div>
    
          {/* Entry Table - Matching Daily Modal Style */}
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
                {allEntries.map((entry, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 capitalize">{entry.employee}</td>
                    <td className="py-2 px-3">
                      {`${entry.dimension.replace(" x ", '" × "')}"`}
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
                      {entry.sqft.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    
          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={goBackToEdit}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Go Back & Edit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
              <Check className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      );
    }
  
  if (isLoadingDimensions) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading dimension options...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Date Section - The HTML date input stores dates in local timezone YYYY-MM-DD format */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-muted-foreground">
          DATE
        </Label>
        <div className="flex gap-3 items-end">
          <Input 
            id="date" 
            type="date" 
            value={date} 
            onChange={(e) => {
              // e.target.value is already in YYYY-MM-DD local timezone format
              const selectedDate = e.target.value
              console.log("[v0] Date selected from picker:", selectedDate)
              setDate(selectedDate)
            }}
            required 
            className="max-w-xs focus:ring-blue-200 focus:border-blue-600" 
          />
        </div>
      </div>
      
      {/* Employee Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">SELECT EMPLOYEES WHO WORKED TODAY</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EMPLOYEE_OPTIONS.map((employee) => (
            <Button
              key={employee}
              type="button"
              variant="outline"
              onClick={() => toggleEmployee(employee)}
              className={`h-16 text-base font-medium transition-all ${
                selectedEmployees.includes(employee)
                  ? "bg-blue-50 border-blue-600 border-2 text-blue-900 hover:bg-blue-100"
                  : "border-2 hover:border-gray-400"
              }`}
            >
              {employee}
            </Button>
          ))}
        </div>
      </div>

      {/* Entry Section - Always Visible */}
      <div className="flex gap-6">
        {/* Employee Progress Sidebar */}
        {selectedEmployees.length > 0 && (
          <div className="w-64 shrink-0">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">PROGRESS</Label>
              {selectedEmployees.map((employee, index) => {
                const isActive = index === currentEmployeeIndex
                const isPast = index < currentEmployeeIndex
                
                return (
                  <button
                    key={employee}
                    type="button"
                    onClick={() => setCurrentEmployeeIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      isPast
                        ? "bg-green-50 border-green-600 text-green-900 hover:bg-green-100"
                        : isActive
                        ? "bg-transparent border-blue-600 text-gray-900 shadow-sm"
                        : "bg-transparent border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <div className="shrink-0">
                      {isPast ? (
                        <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className={`h-6 w-6 rounded-full border-2 ${isActive ? "border-blue-600" : "border-gray-400"}`} />
                      )}
                    </div>
                    <span className="font-medium">{employee}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          <Card className="overflow-hidden border-0 shadow-sm">
            {selectedEmployees.length === 0 && (
              <div className="bg-gray-50 px-6 py-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Select employees above to begin entering production data</p>
              </div>
            )}
            {selectedEmployees.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousEmployee}
                  disabled={currentEmployeeIndex === 0 || isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  {currentEmployeeIndex + 1} of {selectedEmployees.length}
                </div>
                {currentEmployeeIndex === selectedEmployees.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={goToReview}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Finish
                    <Check className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={goToNextEmployee}
                    disabled={isSubmitting}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
            <div className="p-6">
              {selectedEmployees.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployees[currentEmployeeIndex]}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter production quantities for each dimension</p>
                </div>
              )}
              <div className="overflow-x-auto">
                <div className="mb-4 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search dimensions..."
                    value={dimensionSearch}
                    onChange={(e) => setDimensionSearch(e.target.value.toLowerCase())}
                    className="max-w-xs focus:ring-blue-200 focus:border-blue-600"
                  />
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 pr-4 font-medium text-sm">Dimension</th>
                      <th className="text-center pb-3 px-4 font-medium text-sm">MPT</th>
                      <th className="text-center pb-3 pl-4 font-medium text-sm">Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add Custom Dimension Row - appears first */}
                    <tr className="border-b">
                      <td colSpan={3} className="py-3 px-4">
                        {!showAddDimension ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddDimension(true)}
                            className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                          >
                            + Add Custom Dimension
                          </Button>
                        ) : (
                          <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex gap-2 mb-3">
                              <Button
                                type="button"
                                variant={dimensionInputMode === "lxw" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDimensionInputMode("lxw")}
                                className={dimensionInputMode === "lxw" ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                Length x Width
                              </Button>
                              <Button
                                type="button"
                                variant={dimensionInputMode === "text" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDimensionInputMode("text")}
                                className={dimensionInputMode === "text" ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                Label & Sqft
                              </Button>
                            </div>
                            
                            <div className="flex gap-3 items-end">
                              {dimensionInputMode === "text" ? (
                                <>
                                  <div className="flex-1">
                                    <Label htmlFor="custom-label" className="text-xs font-medium text-muted-foreground">
                                      Dimension Label
                                    </Label>
                                    <Input
                                      id="custom-label"
                                      type="text"
                                      placeholder="e.g., 24oct or Custom"
                                      value={newDimensionLabel}
                                      onChange={(e) => setNewDimensionLabel(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="custom-sqft" className="text-xs font-medium text-muted-foreground">
                                      Square Footage
                                    </Label>
                                    <Input
                                      id="custom-sqft"
                                      type="number"
                                      step="0.01"
                                      placeholder="6.0"
                                      value={newDimensionSqft}
                                      onChange={(e) => setNewDimensionSqft(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <Label htmlFor="custom-length" className="text-xs font-medium text-muted-foreground">
                                      Length
                                    </Label>
                                    <Input
                                      id="custom-length"
                                      type="number"
                                      step="0.1"
                                      placeholder="Enter length..."
                                      value={newDimensionLength}
                                      onChange={(e) => setNewDimensionLength(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="custom-width" className="text-xs font-medium text-muted-foreground">
                                      Width
                                    </Label>
                                    <Input
                                      id="custom-width"
                                      type="number"
                                      step="0.1"
                                      placeholder="Enter width..."
                                      value={newDimensionWidth}
                                      onChange={(e) => setNewDimensionWidth(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="calculated-sqft" className="text-xs font-medium text-muted-foreground">
                                      Sq. Ft
                                    </Label>
                                    <div className="mt-1 flex items-center justify-center h-10 bg-gray-100 rounded border border-gray-300 text-sm font-medium">
                                      {newDimensionLength && newDimensionWidth
                                        ? ((parseFloat(newDimensionLength) * parseFloat(newDimensionWidth)) / 144).toFixed(2)
                                        : "—"}
                                    </div>
                                  </div>
                                </>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddDimension}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Add
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowAddDimension(false)
                                  setNewDimensionLabel("")
                                  setNewDimensionLength("")
                                  setNewDimensionWidth("")
                                  setNewDimensionSqft("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                    {/* Dimension entries */}
                    {dimensions
                      .filter((dim) => 
                        dim.dimension_label.toLowerCase().includes(dimensionSearch)
                      )
                      .map((dim) => {
                        const currentEmployee = selectedEmployees[currentEmployeeIndex]
                        const entry = currentEmployee ? employeeData[currentEmployee].find((e) => e.dimension === dim.dimension_label) : null
                        return (
                          <tr key={dim.dimension_label} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-sm font-medium">{dim.dimension_label}</td>
                            <td className="py-2 px-4">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={entry?.mpt || ""}
                                onChange={(e) => updateQuantity(dim.dimension_label, "mpt", e.target.value)}
                                disabled={selectedEmployees.length === 0}
                                className="text-center disabled:bg-gray-50"
                              />
                            </td>
                            <td className="py-2 pl-4">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={entry?.sale || ""}
                                onChange={(e) => updateQuantity(dim.dimension_label, "sale", e.target.value)}
                                disabled={selectedEmployees.length === 0}
                                className="text-center disabled:bg-gray-50"
                              />
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
