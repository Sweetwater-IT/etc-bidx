'use client';

import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string; // digits as string (e.g., "12345" for $123.45)
  onChange: (digits: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className = '',
  disabled = false
}: CurrencyInputProps) {
  const formatDecimal = (digits: string): string => {
    if (!digits || digits === "0") return "0.00";
    const parsed = parseInt(digits, 10);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return "0.00";
    const num = parsed / 100;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleNextDigits = (current: string, inputType: string, data: string): string => {
    let digits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
      const candidate = current + data;
      if (candidate.length <= 8) digits = candidate; // Max 8 digits for $999,999.99
    } else if (inputType === "deleteContentBackward") {
      digits = current.slice(0, -1);
    }

    return digits.padStart(1, "0");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const ev = (e as any).nativeEvent;
    const { inputType } = ev;
    const data = (ev.data || "").replace(/,/g, "");

    const nextDigits = handleNextDigits(value, inputType, data);
    onChange(nextDigits);
  };

  return (
    <Input
      type="text"
      className={className}
      placeholder={placeholder}
      value={formatDecimal(value)}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}