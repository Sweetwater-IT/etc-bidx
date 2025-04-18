"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface CreateSaleItemSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSaleItemSheet({ open, onOpenChange }: CreateSaleItemSheetProps) {
  const [jobNumber, setJobNumber] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  const handleSubmit = () => {
    // TODO: Implement form submission
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create Sale Item</SheetTitle>
          <SheetDescription>
            Add a new sale item to track. Fill in all the required information below.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jobNumber">Job Number</Label>
                <Input
                  id="jobNumber"
                  placeholder="Enter job number"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter item description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter unit price"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-6">
          <Button onClick={handleSubmit} className="w-full">Create Sale Item</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 