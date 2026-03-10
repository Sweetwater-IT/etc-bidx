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
  disabled?: boolean;
}

export function InputGroup({
  value,
  onValueChange,
  type,
  onTypeChange,
  placeholder = "0.00",
  className = '',
  disabled = false
}: InputGroupProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Input
        type="number"
        step="0.01"
        min="0"
        className="rounded-r-none border-r-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
      />
      <Select value={type} onValueChange={onTypeChange} disabled={disabled}>
        <SelectTrigger className="w-[60px] rounded-l-none border-l-0">
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