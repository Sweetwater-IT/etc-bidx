'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeNumber } from '@/lib/safe-number';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  onBlur?: () => void;
}

export function QuantityInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className = '',
  disabled = false,
  inputClassName = '',
  onBlur,
}: QuantityInputProps) {
  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const inputValue = e.target.value;
    const numericValue = parseInt(inputValue);

    if (isNaN(numericValue)) {
      onChange(min);
      return;
    }

    const clampedValue = Math.max(min, Math.min(max, numericValue));
    onChange(clampedValue);
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        className={`no-spinner w-10 px-0 py-1 border rounded text-center bg-background !border-none ${inputClassName}`}
        style={{ width: 40, height: 28 }}
        disabled={disabled}
      />
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
