'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InputGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  type: 'percent' | 'dollar';
  onTypeChange: (type: 'percent' | 'dollar') => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function InputGroup({
  value,
  onValueChange,
  type,
  onTypeChange,
  placeholder = "0.00",
  className = '',
  inputClassName = '',
  disabled = false
}: InputGroupProps) {
  return (
    <div className={`flex items-center w-[140px] ${className}`}>
      <Input
        type="number"
        step="0.01"
        min="0"
        className={`flex-1 min-w-0 rounded-r-none border-r-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${inputClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
      />
      <Select value={type} onValueChange={onTypeChange} disabled={disabled}>
        <SelectTrigger className="w-[44px] flex-shrink-0 rounded-l-none border-l-0">
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
