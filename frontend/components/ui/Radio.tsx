'use client';

import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  value?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center">
          <input
            type="radio"
            id={radioId}
            className={cn(
              // Base styles
              'h-5 w-5 rounded-full border-2 border-[#E1E1E1]',
              'bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#405FF2] focus:ring-offset-2',
              // Checked styles - using appearance-none to customize
              'appearance-none',
              'checked:border-[#405FF2]',
              // Hover styles
              'hover:border-[#405FF2]',
              // Disabled styles
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Error styles
              error && 'border-red-500 focus:ring-red-500',
              // Mobile touch targets
              'min-h-[20px] min-w-[20px]',
              className
            )}
            ref={ref}
            {...props}
          />
          {/* Custom radio dot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={cn(
                'w-2 h-2 rounded-full bg-[#405FF2] transition-all duration-200',
                props.checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
            />
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'block text-[15px] font-medium leading-[26px] cursor-pointer',
                  error ? 'text-red-700' : 'text-[#050B20]'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                'text-[14px] leading-[24px] mt-1',
                error ? 'text-red-600' : 'text-gray-600'
              )}>
                {description}
              </p>
            )}
            {error && (
              <p className="text-[14px] leading-[24px] text-red-600 mt-1" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

// RadioGroup component for managing multiple radio buttons
export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

export function RadioGroup({ 
  name, 
  value, 
  defaultValue,
  onChange, 
  children, 
  className,
  error 
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className={cn('space-y-3', className)} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Radio) {
          const radioProps = child.props as RadioProps & { value?: string };
          return React.cloneElement(child as React.ReactElement<RadioProps>, {
            name,
            checked: radioProps.value === currentValue,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.checked && radioProps.value) {
                handleChange(radioProps.value);
              }
              radioProps.onChange?.(e);
            },
            error: error || radioProps.error,
          });
        }
        return child;
      })}
    </div>
  );
}

export { Radio };