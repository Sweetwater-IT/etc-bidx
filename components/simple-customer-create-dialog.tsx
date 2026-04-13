"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreatedCustomer {
  id: number
  name?: string | null
  display_name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  main_phone?: string | null
}

interface SimpleCustomerCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (customer: CreatedCustomer) => void | Promise<void>
  title?: string
  description?: string
}

export function SimpleCustomerCreateDialog({
  open,
  onOpenChange,
  onCreated,
  title = "New Customer",
  description = "Create a customer with a company name, then it will be available right away.",
}: SimpleCustomerCreateDialogProps) {
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)

  const reset = () => {
    setName("")
    setCreating(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      reset()
    }
  }

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          display_name: trimmedName,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok || !result?.customer) {
        throw new Error(
          result?.error || result?.message || "Failed to create customer"
        )
      }

      await onCreated?.(result.customer as CreatedCustomer)
      toast.success("Customer created")
      handleOpenChange(false)
    } catch (error) {
      console.error("Failed to create customer:", error)
      toast.error("Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium text-foreground">
            Company Name
          </label>
          <Input
            className="mt-1.5"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Enter company name"
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault()
                void handleCreate()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || creating}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
