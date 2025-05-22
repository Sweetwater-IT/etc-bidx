"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Digits = {
  fuel_economy_mpg: string
  truck_dispatch_fee: string
  worker_comp: string
  general_liability: string
}

const fmt = (v: string) => (parseInt(v, 10) / 100).toFixed(2)
const toDigits = (n: number) => Math.round(n * 100).toString().padStart(3, "0")
const next = (cur: string, t: string, d: string) => {
  let s = cur
  if (t === "insertText" && /\d/.test(d)) {
    const c = cur + d
    if (parseInt(c, 10) <= 99999) s = c
  } else if (t === "deleteContentBackward") s = cur.slice(0, -1)
  return s.padStart(3, "0")
}

interface EditFlagRateSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess?: () => void
  rate: {
    id: number
    fuel_economy_mpg: number
    truck_dispatch_fee: number
    worker_comp: number
    general_liability: number
  }
}

export function EditFlagRateSheet({ open, onOpenChange, onSuccess, rate }: EditFlagRateSheetProps) {
  const [digits, setDigits] = useState<Digits>({
    fuel_economy_mpg: toDigits(rate.fuel_economy_mpg),
    truck_dispatch_fee: toDigits(rate.truck_dispatch_fee),
    worker_comp: toDigits(rate.worker_comp),
    general_liability: toDigits(rate.general_liability),
  })


  useEffect(() => {
    if (open) {
      const parseRateValue = (value: number | string) => {
        const num =
          typeof value === "string" ? Number(value.replace(/\$/g, "")) : value;
        return toDigits(num);
      };

      setDigits({
        fuel_economy_mpg: parseRateValue(rate.fuel_economy_mpg),
        truck_dispatch_fee: parseRateValue(rate.truck_dispatch_fee),
        worker_comp: parseRateValue(rate.worker_comp),
        general_liability: parseRateValue(rate.general_liability),
      });
    }
  }, [open, rate]);

  const handle = (k: keyof Digits, e: InputEvent) =>
    setDigits(p => ({ ...p, [k]: next(p[k], e.inputType, (e.data || "").replace(/\$/g, "")) }))

  const submit = async () => {
    const payload = {
      fuel_economy_mpg: parseFloat(fmt(digits.fuel_economy_mpg)),
      truck_dispatch_fee: parseFloat(fmt(digits.truck_dispatch_fee)),
      worker_comp: parseFloat(fmt(digits.worker_comp)),
      general_liability: parseFloat(fmt(digits.general_liability)),
    }
    if (Object.values(payload).some(isNaN)) {
      toast.error("Please fill all required fields.")
      return
    }
    try {
      const res = await fetch(`/api/flagging/${rate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <SheetTitle className="text-xl font-medium">Edit Rate</SheetTitle>
          <SheetDescription className="text-sm text-gray-500 mt-1">Update the values below.</SheetDescription>
        </div>
        <div className="p-6 space-y-6">
          {([
            ["fuel_economy_mpg", "Fuel economy mpg"],
            ["truck_dispatch_fee", "Truck Dispatch fee"],
            ["worker_comp", "Worker Company"],
            ["general_liability", "General Liability"],
          ] as [keyof Digits, string][]).map(([k, label]) => (
            <div key={k} className="relative space-y-2">
              <Label htmlFor={k} className="text-sm font-medium mb-1.5">{label}*</Label>
              <Input
                id={k}
                inputMode="decimal"
                pattern="^\\d*(\\.\\d{0,2})?$"
                placeholder="$ 0.00"
                value={`$ ${fmt(digits[k])}`}
                onChange={e => handle(k, e.nativeEvent as InputEvent)}
                className="h-10"
              />
            </div>
          ))}
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={submit} className="flex-1 bg-black text-white hover:bg-gray-800">Save</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}