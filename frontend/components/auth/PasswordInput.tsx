'use client';

import { forwardRef, useState, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={cn(
              'w-full px-4 py-3 pr-12 text-[15px] font-normal leading-[26px]',
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
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#050B20] hover:text-[#405FF2] transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[#405FF2] focus:ring-offset-2"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1 text-[13px] text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
