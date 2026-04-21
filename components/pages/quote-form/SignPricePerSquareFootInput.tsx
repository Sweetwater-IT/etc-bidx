"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

interface SignPricePerSquareFootInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function SignPricePerSquareFootInput({
  label,
  value,
  onChange,
  className = "",
}: SignPricePerSquareFootInputProps) {
  const [digits, setDigits] = React.useState(() =>
    String(Math.round((Number(value) || 0) * 100))
  );

  React.useEffect(() => {
    setDigits(String(Math.round((Number(value) || 0) * 100)));
  }, [value]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label className="text-sm text-muted-foreground whitespace-nowrap">{label}</Label>
      <div className="flex h-9 w-[140px] items-center rounded-md border bg-background transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
        <span className="border-r px-3 text-sm text-muted-foreground">$</span>
        <CurrencyInput
          value={digits}
          onChange={(nextDigits) => {
            const normalized = nextDigits || "0";
            setDigits(normalized);
            onChange(parseInt(normalized, 10) / 100);
          }}
          className="h-9 w-full cursor-text border-0 bg-transparent pr-3 text-right focus-visible:ring-0"
        />
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">/ sq ft</span>
    </div>
  );
}
