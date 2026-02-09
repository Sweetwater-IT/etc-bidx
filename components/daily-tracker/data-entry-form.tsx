"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"

interface DataEntryFormProps {
  onSubmit: (entry: ProductivityEntry) => void
  onCancel: () => void
}

export function DataEntryForm({ onSubmit, onCancel }: DataEntryFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    employee: "",
    dimension_l: "",
    dimension_w: "",
    type: "sale" as "sale" | "mpt",
    quantity: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const length = Number.parseFloat(formData.dimension_l)
    const width = Number.parseFloat(formData.dimension_w)
    const quantity = Number.parseInt(formData.quantity)
    const sqft = (length * width) / 144 // Convert square inches to square feet
    const total_sqft = sqft * quantity

    const entry: ProductivityEntry = {
      date: formData.date,
      employee: formData.employee.toLowerCase(),
      dimension_l: length,
      dimension_w: width,
      sqft: Number.parseFloat(sqft.toFixed(3)),
      type: formData.type,
      quantity,
      total_sqft: Number.parseFloat(total_sqft.toFixed(2)),
    }

    try {
      await onSubmit(entry)

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        employee: "",
        dimension_l: "",
        dimension_w: "",
        type: "sale",
        quantity: "",
      })
    } catch (error) {
      console.error("Error submitting entry:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee">Employee Name</Label>
          <Input
            id="employee"
            type="text"
            placeholder="e.g., Richie"
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimension_l">Length (inches)</Label>
          <Input
            id="dimension_l"
            type="number"
            step="0.01"
            placeholder="e.g., 24"
            value={formData.dimension_l}
            onChange={(e) => setFormData({ ...formData, dimension_l: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimension_w">Width (inches)</Label>
          <Input
            id="dimension_w"
            type="number"
            step="0.01"
            placeholder="e.g., 18"
            value={formData.dimension_w}
            onChange={(e) => setFormData({ ...formData, dimension_w: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "sale" | "mpt") => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="mpt">MPT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            placeholder="e.g., 10"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Entry"}
        </Button>
      </div>
    </form>
  )
}