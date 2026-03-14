'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-3 text-[15px] font-normal leading-[26px]',
            'border border-[#E1E1E1] rounded-[12px]',
            'bg-white text-[#050B20] placeholder:text-gray-500',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-0 focus:border-[#405FF2]',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500',
            'min-h-[60px]',
            'antialiased',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[13px] text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };
