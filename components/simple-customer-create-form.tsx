"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface CreatedCustomer {
  id: number
  name?: string | null
  display_name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  main_phone?: string | null
}

interface SimpleCustomerCreateFormProps {
  onCreated?: (customer: CreatedCustomer) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
}

export function SimpleCustomerCreateForm({
  onCreated,
  onCancel,
  submitLabel = "Create",
  cancelLabel = "Cancel",
}: SimpleCustomerCreateFormProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [creating, setCreating] = useState(false)

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
          address: address.trim() || null,
          main_phone: phone.trim() || null,
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
    } catch (error) {
      console.error("Failed to create customer:", error)
      toast.error("Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div>
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

      <div>
        <label className="text-sm font-medium text-foreground">
          Address <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Input
          className="mt-1.5"
          value={address}
          onChange={event => setAddress(event.target.value)}
          placeholder="Enter address"
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              void handleCreate()
            }
          }}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          Phone Number <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Input
          className="mt-1.5"
          value={phone}
          onChange={event => setPhone(event.target.value)}
          placeholder="Enter phone number"
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              void handleCreate()
            }
          }}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={creating}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!name.trim() || creating}
        >
          {creating ? "Creating..." : submitLabel}
        </Button>
      </div>
    </div>
  )
}
