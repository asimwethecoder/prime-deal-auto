'use client';

import { forwardRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

export interface NumberInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  suffix?: string;
  value?: number | string;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

/**
 * Formats a number with thousands separators (spaces for ZA locale)
 */
function formatNumber(value: number | string | undefined): string {
  if (value === undefined || value === '' || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-ZA');
}

/**
 * Parses a formatted string back to a number
 */
function parseNumber(value: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    prefix,
    suffix,
    value,
    onChange,
    onBlur,
    min,
    max,
    placeholder = '0',
    disabled,
    name,
  }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => formatNumber(value));
    const [isFocused, setIsFocused] = useState(false);

    // Sync display value when external value changes
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumber(value));
      }
    }, [value, isFocused]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      
      // Allow only digits, spaces, commas, and one decimal point
      const sanitized = rawValue.replace(/[^\d\s,.-]/g, '');
      setDisplayValue(sanitized);
      
      // Parse and notify parent
      const numericValue = parseNumber(sanitized);
      onChange?.(numericValue);
    }, [onChange]);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      // Show raw number on focus for easier editing
      const num = parseNumber(displayValue);
      if (num > 0) {
        setDisplayValue(num.toString());
      }
    }, [displayValue]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      // Format on blur
      const num = parseNumber(displayValue);
      
      // Apply min/max constraints
      let constrainedNum = num;
      if (min !== undefined && num < min) constrainedNum = min;
      if (max !== undefined && num > max) constrainedNum = max;
      
      setDisplayValue(formatNumber(constrainedNum));
      if (constrainedNum !== num) {
        onChange?.(constrainedNum);
      }
      onBlur?.();
    }, [displayValue, min, max, onChange, onBlur]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-4 text-[15px] text-primary pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            name={name}
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 text-[15px] font-normal',
              'border border-[#E1E1E1] rounded-[12px]',
              'bg-white text-primary placeholder:text-gray-500',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-0 focus:border-[#405FF2]',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500',
              'min-h-[48px]',
              'antialiased',
              prefix && 'pl-8',
              suffix && 'pr-12',
              className
            )}
          />
          {suffix && (
            <span className="absolute right-4 text-[14px] text-gray-500 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
