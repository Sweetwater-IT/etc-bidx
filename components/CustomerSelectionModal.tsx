"use client"

import { useState, useMemo } from "react"
import { Customer } from "@/types/Customer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Search, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomerSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  onAddNewCustomer?: () => void
}

export function CustomerSelectionModal({
  open,
  onOpenChange,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer,
}: CustomerSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers

    const query = searchQuery.toLowerCase()
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(query) ||
      customer.displayName?.toLowerCase().includes(query) ||
      (customer.emails && customer.emails.length > 0 && customer.emails[0]?.toLowerCase().includes(query))
    )
  }, [customers, searchQuery])

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onOpenChange(false)
    setSearchQuery("")
  }

  const handleClearSelection = () => {
    onSelectCustomer(null)
    onOpenChange(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onAddNewCustomer && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onAddNewCustomer()
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Customer
            </Button>
          )}
          {selectedCustomer && (
            <Button
              variant="outline"
              onClick={handleClearSelection}
              className="text-muted-foreground"
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Customer List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-2 py-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No customers found matching your search." : "No customers available."}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    selectedCustomer?.id === customer.id && "bg-primary/5 border-primary"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">
                          {customer.displayName || customer.name}
                        </h3>
                        {selectedCustomer?.id === customer.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {customer.emails && customer.emails.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {customer.emails[0]}
                        </p>
                      )}
                      {customer.mainPhone && (
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.mainPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedCustomer && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}