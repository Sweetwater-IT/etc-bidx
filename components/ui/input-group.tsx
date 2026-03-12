'use client';

import type { FocusEventHandler, KeyboardEventHandler } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InputGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  type: 'percent' | 'dollar';
  onTypeChange: (type: 'percent' | 'dollar') => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;

  /** Optional input handlers for commit-on-blur / Enter workflows */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  ariaLabel?: string;
}

export function InputGroup({
  value,
  onValueChange,
  type,
  onTypeChange,
  placeholder = "0.00",
  className = '',
  inputClassName = '',
  disabled = false,
  onBlur,
  onKeyDown,
  ariaLabel,
}: InputGroupProps) {
  return (
    <div className={cn('flex items-center w-full h-9', className)}>
      <Input
        // Use text + inputMode so users can type decimals naturally without browser
        // number-input quirks (cursor jumps, locale issues, blocking partial values).
        type="text"
        inputMode="decimal"
        className={cn(
          'h-full flex-1 min-w-0 rounded-r-none border-r-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          inputClassName
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <Select value={type} onValueChange={onTypeChange} disabled={disabled}>
        <SelectTrigger className="h-full w-10 flex-shrink-0 rounded-l-none border-l-0 px-0 justify-center">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="percent">%</SelectItem>
          <SelectItem value="dollar">$</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
