import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            'w-full px-4 py-3 text-[15px] font-normal',
            'border border-[#E1E1E1] rounded-[12px]',
            'bg-white text-primary placeholder:text-gray-500',
            'transition-colors duration-200',
            // Focus styles
            'focus:outline-none focus:ring-0 focus:border-[#405FF2]',
            // Disabled styles
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            // Error styles
            error && 'border-red-500 focus:border-red-500',
            // Mobile touch targets
            'min-h-[48px]',
            // Font smoothing
            'antialiased',
            className
          )}
          ref={ref}
          {...props}
        />
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

Input.displayName = 'Input';

export { Input };