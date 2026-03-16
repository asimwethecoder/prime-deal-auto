import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

// Make React available globally for JSX transform
globalThis.React = React;

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className, 'aria-hidden': ariaHidden, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        aria-hidden={ariaHidden}
        {...props}
      />
    );
  },
}));
