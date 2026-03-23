'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string; // digits as string (e.g., "12345" for $123.45)
  onChange: (digits: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className = '',
  disabled = false,
  onFocus,
  onBlur,
}: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const normalizeDigits = React.useCallback((raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 11);
    return digitsOnly === '' ? '0' : digitsOnly;
  }, []);

  const [draftDigits, setDraftDigits] = React.useState(() => normalizeDigits(value));
  const draftDigitsRef = React.useRef(draftDigits);

  React.useEffect(() => {
    draftDigitsRef.current = draftDigits;
  }, [draftDigits]);

  React.useEffect(() => {
    if (isFocused) return;
    const normalized = normalizeDigits(value);
    draftDigitsRef.current = normalized;
    setDraftDigits(normalized);
  }, [isFocused, normalizeDigits, value]);

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

  const applyDigits = React.useCallback((nextRaw: string) => {
    const normalized = normalizeDigits(nextRaw);
    draftDigitsRef.current = normalized;
    setDraftDigits(normalized);
    onChange(normalized);
  }, [normalizeDigits, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      applyDigits(`${draftDigitsRef.current}${e.key}`);
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      applyDigits(draftDigitsRef.current.slice(0, -1));
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      applyDigits('0');
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    applyDigits(pasted);
  };

  const moveCaretToEnd = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      className={className}
      placeholder={placeholder}
      value={formatDecimal(draftDigits)}
      inputMode="numeric"
      readOnly
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={() => {
        setIsFocused(true);
        moveCaretToEnd();
        onFocus?.();
      }}
      onBlur={() => {
        setIsFocused(false);
        onBlur?.();
      }}
      onClick={moveCaretToEnd}
      disabled={disabled}
    />
  );
}
