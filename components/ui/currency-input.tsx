'use client';

import * as React from 'react';
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
  const normalizeDigits = React.useCallback((raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 8);
    return digitsOnly === '' ? '0' : digitsOnly;
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      onChange(normalizeDigits(`${value}${e.key}`));
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(normalizeDigits(value.slice(0, -1)));
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      onChange('0');
      return;
    }

    if ([
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Enter',
    ].includes(e.key)) {
      return;
    }

    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(normalizeDigits(e.target.value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    onChange(normalizeDigits(pasted));
  };

  return (
    <Input
      type="text"
      className={className}
      placeholder={placeholder}
      value={formatDecimal(value)}
      inputMode="numeric"
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onPaste={handlePaste}
      disabled={disabled}
    />
  );
}
