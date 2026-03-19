'use client';

import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DollarPercentCurrencyInputFieldProps {
  type: 'percent' | 'dollar';
  value: number;
  onTypeChange: (type: 'percent' | 'dollar') => void;
  onValueChange: (value: number) => void;
  fixedType?: 'percent' | 'dollar';
  className?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
  'aria-label'?: string;
}

export function DollarPercentCurrencyInputField({
  type,
  value,
  onTypeChange,
  onValueChange,
  fixedType,
  className,
  size = 'default',
  disabled = false,
  'aria-label': ariaLabel,
}: DollarPercentCurrencyInputFieldProps) {
  const heightClass = size === 'sm' ? 'h-7' : 'h-8';
  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
  const selectWidth = size === 'sm' ? 'w-10' : 'w-12';
  const effectiveType = fixedType || type;
  const inputWidth = size === 'sm' ? 'w-[125px]' : 'flex-1';

  return (
    <div className={cn('flex items-center border rounded-md bg-background overflow-hidden', heightClass, className)}>
      {fixedType ? (
        <div
          className={cn(
            heightClass,
            selectWidth,
            'flex items-center justify-center border-r bg-muted/30',
            textSizeClass
          )}
        >
          {fixedType === 'percent' ? '%' : '$'}
        </div>
      ) : (
        <Select
          value={type}
          onValueChange={(newType) => {
            const currentValue = value;
            const mappedType = newType === 'fixed' ? 'dollar' : newType as 'percent' | 'dollar';
            const newValue = mappedType === 'percent' ? currentValue / 100 : currentValue * 100;
            onTypeChange(mappedType);
            onValueChange(newValue);
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn(
            heightClass,
            selectWidth,
            'rounded-none border-0 border-r px-0 justify-center focus:ring-0',
            textSizeClass
          )}>
            <SelectValue>{type === 'percent' ? '%' : '$'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">%</SelectItem>
            <SelectItem value="dollar">$</SelectItem>
          </SelectContent>
        </Select>
      )}
      <CurrencyInput
        value={Math.round(value * 100).toString()}
        onChange={(digits) => {
          const num = parseInt(digits || '0', 10) || 0;
          const scaled = effectiveType === 'percent' ? num / 100 : num / 100;
          onValueChange(scaled);
        }}
        className={cn(
          heightClass,
          inputWidth,
          'border-0 bg-transparent px-3 text-right focus-visible:ring-0 focus-visible:ring-offset-0',
          textSizeClass
        )}
        disabled={disabled}
        aria-label={ariaLabel || `Value in ${effectiveType === 'percent' ? 'percent' : 'dollars'}`}
      />
    </div>
  );
}
