"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const formatDecimal = (v: string) => (parseInt(v, 10) / 100).toFixed(2)
const parseDigits = (rate: number) => Math.round(rate * 100).toString().padStart(3, "0")

const useDigits = (initial: number) => {
  const [digits, setDigits] = useState(parseDigits(initial))
  const next = (current: string, inputType: string, data: string) => {
    let d = current
    if (inputType === "insertText" && /\d/.test(data)) {
      const c = current + data
      if (parseInt(c, 10) <= 99999) d = c
    } else if (inputType === "deleteContentBackward") d = current.slice(0, -1)
    return d.padStart(3, "0")
  }
  return { digits, setDigits, next }
}

export function CreateBranchSheet({ open, onOpenChange, onSuccess }: SheetProps) {
  const [form, setForm] = useState({ name: "", address: "" })
  const { digits, setDigits, next } = useDigits(0)

  const submit = async () => {
    const rate = parseFloat(formatDecimal(digits))
    const { name, address } = form
    if (!name || !address || isNaN(rate)) {
      toast.error("Please fill all required fields.")
      return
    }
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, shop_rate: rate }),
      })
      if (!res.ok) throw await res.json()
      toast.success("Record created successfully!")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Error creating record.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <SheetTitle className="text-xl font-medium">New Record</SheetTitle>
          <SheetDescription className="text-sm text-gray-500 mt-1">Provide the information below to create a new record.</SheetDescription>
        </div>
        <BranchForm form={form} setForm={setForm} digits={digits} setDigits={setDigits} next={next} onSubmit={submit} onCancel={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

interface EditProps extends SheetProps {
  branch: { id: number; name: string; address: string; shop_rate: number }
}

export function EditBranchSheet({ open, onOpenChange, onSuccess, branch }: EditProps) {

  const [form, setForm] = useState({ name: branch.name, address: branch.address })
  const { digits, setDigits, next } = useDigits(branch.shop_rate)
  

  useEffect(() => {
    setForm({ name: branch.name, address: branch.address })
    setDigits(parseDigits(branch.shop_rate))
  }, [branch, setDigits])

  const submit = async () => {
    const rate = parseFloat(formatDecimal(digits))
    const { name, address } = form
    if (!name || !address || isNaN(rate)) {
      toast.error("Please fill all required fields.")
      return
    }
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, shop_rate: rate }),
      })
      if (!res.ok) throw await res.json()
      toast.success("Record updated successfully!")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Error updating record.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <SheetTitle className="text-xl font-medium">Edit Record</SheetTitle>
          <SheetDescription className="text-sm text-gray-500 mt-1">Update the information below and save changes.</SheetDescription>
        </div>
        <BranchForm form={form} setForm={setForm} digits={digits} setDigits={setDigits} next={next} onSubmit={submit} onCancel={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

interface BranchFormProps {
  form: { name: string; address: string }
  setForm: (f: { name: string; address: string }) => void
  digits: string
  setDigits: (v: string) => void
  next: (cur: string, t: string, d: string) => string
  onSubmit: () => void
  onCancel: () => void
}

const BranchForm = ({ form, setForm, digits, setDigits, next, onSubmit, onCancel }: BranchFormProps) => (
  <div className="p-6 space-y-6">
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-sm font-medium mb-1.5">Name*</Label>
        <Input id="name" placeholder="John Doe" className="h-10 border-gray-200" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="address" className="text-sm font-medium mb-1.5">Address*</Label>
        <Input id="address" placeholder="123 Main St" className="h-10 border-gray-200" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="relative space-y-2">
        <Label htmlFor="shopRate" className="text-sm font-medium mb-1.5">Shop Rate*</Label>
        <Input id="shopRate" inputMode="decimal" pattern="^\\d*(\\.\\d{0,2})?$" placeholder="$ 0.00" value={`$ ${formatDecimal(digits)}`} onChange={e => {
          const ev = e.nativeEvent as InputEvent
          setDigits(next(digits, ev.inputType, (ev.data || "").replace(/\$/g, "")))
        }} className="h-10" />
      </div>
    </div>
    <div className="pt-4 flex justify-end space-x-2">
      <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      <Button onClick={onSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">Save</Button>
    </div>
  </div>
)
