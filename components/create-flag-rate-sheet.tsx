"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateFlagRateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateFlagRateSheet({ open, onOpenChange, onSuccess }: CreateFlagRateSheetProps) {
  const [digits, setDigits] = useState({
    fuel_economy_mpg: "000",
    truck_dispatch_fee: "000",
    worker_comp: "000",
    general_liability: "000",
  });

  useEffect(() => {
    if (!open) {
      setDigits({
        fuel_economy_mpg: "000",
        truck_dispatch_fee: "000",
        worker_comp: "000",
        general_liability: "000",
      });
    }
  }, [open]);
  

  const formatDecimal = (v: string) => (parseInt(v, 10) / 100).toFixed(2);

  const nextDigits = (cur: string, t: string, d: string) => {
    let s = cur;
    if (t === "insertText" && /\d/.test(d)) {
      const c = cur + d;
      if (parseInt(c, 10) <= 99999) s = c;
    } else if (t === "deleteContentBackward") s = cur.slice(0, -1);
    return s.padStart(3, "0");
  };

  const handleChange = (field: keyof typeof digits, ev: InputEvent) => {
    const upd = nextDigits(digits[field], ev.inputType, (ev.data || "").replace(/\$/g, ""));
    setDigits(prev => ({ ...prev, [field]: upd }));
  };

  const handleSubmit = async () => {
    const payload = {
      fuel_economy_mpg: parseFloat(formatDecimal(digits.fuel_economy_mpg)),
      truck_dispatch_fee: parseFloat(formatDecimal(digits.truck_dispatch_fee)),
      worker_comp: parseFloat(formatDecimal(digits.worker_comp)),
      general_liability: parseFloat(formatDecimal(digits.general_liability)),
    };
    if (Object.values(payload).some(v => isNaN(v))) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const res = await fetch("/api/flagging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      toast.success("Record created successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Error creating record.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <SheetTitle className="text-xl font-medium">New Rate</SheetTitle>
          <SheetDescription className="text-sm text-gray-500 mt-1">
            Provide all rate fields below.
          </SheetDescription>
        </div>
        <div className="p-6 space-y-6">
          {([
            ["fuel_economy_mpg", "Fuel economy mpg"],
            ["truck_dispatch_fee", "Truck Dispatch fee"],
            ["worker_comp", "Worker Company"],
            ["general_liability", "General Liability"],
          ] as [keyof typeof digits, string][]).map(([key, label]) => (
            <div key={key} className="relative space-y-2">
              <Label htmlFor={key} className="text-sm font-medium mb-1.5">
                {label}*
              </Label>
              <Input
                id={key}
                inputMode="decimal"
                pattern="^\\d*(\\.\\d{0,2})?$"
                placeholder="$ 0.00"
                value={`$ ${formatDecimal(digits[key])}`}
                onChange={e => handleChange(key, e.nativeEvent as InputEvent)}
                className="h-10"
              />
            </div>
          ))}
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
              Create
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}