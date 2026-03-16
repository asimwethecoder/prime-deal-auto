'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

const DEFAULT_SIZE = 24;

// Module-level cache for SVG existence checks to prevent duplicate HEAD requests
const svgExistsCache = new Map<string, boolean>();

// Export function to clear cache (for testing purposes)
export function clearSvgExistsCache(): void {
  svgExistsCache.clear();
}

export function DynamicIcon({
  name,
  alt = '',
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  className,
  'aria-hidden': ariaHidden,
}: DynamicIconProps) {
  // 1. Check Lucide icons FIRST (synchronous) - render immediately if found
  const LucideIconComponent = getLucideIcon(name);
  
  if (LucideIconComponent) {
    // Render Lucide icon immediately - no network request, no loading state
    return (
      <LucideIconComponent
        size={width}
        className={className}
        aria-hidden={ariaHidden}
      />
    );
  }

  // 2. For non-Lucide icons, check cache or make HEAD request
  // Initialize state from cache if available
  const [svgExists, setSvgExists] = useState<boolean | null>(
    svgExistsCache.has(name) ? svgExistsCache.get(name)! : null
  );
  const [isLoading, setIsLoading] = useState(!svgExistsCache.has(name));

  useEffect(() => {
    // Skip if we already have a cached result
    if (svgExistsCache.has(name)) {
      setSvgExists(svgExistsCache.get(name)!);
      setIsLoading(false);
      return;
    }

    // Check if SVG exists in /public/icons/
    const checkSvgExists = async () => {
      try {
        const svgPath = `/icons/${name}.svg`;
        const response = await fetch(svgPath, { method: 'HEAD' });
        const exists = response.ok;
        // Cache the result to prevent duplicate requests
        svgExistsCache.set(name, exists);
        setSvgExists(exists);
      } catch {
        svgExistsCache.set(name, false);
        setSvgExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSvgExists();
  }, [name]);

  // Show loading state only for custom SVG checks (non-Lucide icons)
  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width, height }}
        aria-hidden={ariaHidden}
      />
    );
  }

  // Use SVG if it exists
  if (svgExists) {
    return (
      <Image
        src={`/icons/${name}.svg`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        aria-hidden={ariaHidden}
        unoptimized
      />
    );
  }

  // Final fallback - show a placeholder or default icon
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs ${className}`}
      style={{ width, height }}
      aria-hidden={ariaHidden}
      title={`Icon "${name}" not found`}
    >
      ?
    </div>
  );
}

// Helper function to get Lucide icon by name
function getLucideIcon(name: string): LucideIcon | null {
  // Convert kebab-case to PascalCase for Lucide icon names
  const pascalName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Try exact match first
  if (pascalName in LucideIcons) {
    return (LucideIcons as any)[pascalName] as LucideIcon;
  }

  // Try common variations
  const variations = [
    pascalName,
    `${pascalName}Icon`,
    pascalName.replace(/Icon$/, ''),
  ];

  for (const variation of variations) {
    if (variation in LucideIcons) {
      return (LucideIcons as any)[variation] as LucideIcon;
    }
  }

  return null;
}