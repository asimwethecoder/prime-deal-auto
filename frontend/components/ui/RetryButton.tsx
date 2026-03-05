'use client';

// Retry Button - Client Component for retry functionality
// Used in Server Components that need retry capability

interface RetryButtonProps {
  message?: string;
  className?: string;
}

export function RetryButton({ 
  message = 'Try Again',
  className = 'bg-red-600 text-white px-6 py-2 rounded-[12px] hover:bg-red-700 transition-colors'
}: RetryButtonProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <button
      onClick={handleRetry}
      className={className}
    >
      {message}
    </button>
  );
}
