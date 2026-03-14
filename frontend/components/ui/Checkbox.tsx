'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { DynamicIcon } from './DynamicIcon';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            className={cn(
              // Base styles
              'h-5 w-5 rounded-[4px] border-2 border-[#E1E1E1]',
              'bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#405FF2] focus:ring-offset-2',
              // Checked styles
              'checked:bg-[#405FF2] checked:border-[#405FF2]',
              'checked:hover:bg-[#3651E0] checked:hover:border-[#3651E0]',
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
          {/* Custom checkmark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <DynamicIcon
              name="check"
              width={12}
              height={12}
              className={cn(
                'text-white transition-opacity duration-200',
                props.checked ? 'opacity-100' : 'opacity-0'
              )}
              aria-hidden
            />
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
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

Checkbox.displayName = 'Checkbox';

export { Checkbox };