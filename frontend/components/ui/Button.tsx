import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#405FF2]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'antialiased',
          // Size variants
          {
            'px-4 py-2 text-sm min-h-[40px]': size === 'sm',
            'px-6 py-3 text-[15px] min-h-[48px]': size === 'md',
            'px-8 py-4 text-base min-h-[56px]': size === 'lg',
          },
          // Variant styles
          {
            // Primary - Blue background
            'bg-[#405FF2] text-white border border-[#405FF2] rounded-[12px] hover:bg-[#3651E0] hover:border-[#3651E0] active:scale-[0.98]': variant === 'primary',
            
            // Secondary - Dark background  
            'bg-[#050B20] text-white border border-[#050B20] rounded-[12px] hover:bg-[#0A1230] hover:border-[#0A1230] active:scale-[0.98]': variant === 'secondary',
            
            // Tertiary - White background with rounded-full
            'bg-white text-[#050B20] border border-white rounded-full hover:bg-gray-50 active:scale-[0.98] shadow-sm': variant === 'tertiary',
            
            // Outline - Transparent with border
            'bg-transparent text-[#050B20] border border-[#E1E1E1] rounded-[12px] hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]': variant === 'outline',
          },
          // Full width
          fullWidth && 'w-full',
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };