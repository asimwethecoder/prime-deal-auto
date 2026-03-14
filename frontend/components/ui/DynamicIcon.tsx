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

export function DynamicIcon({
  name,
  alt = '',
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  className,
  'aria-hidden': ariaHidden,
}: DynamicIconProps) {
  const [svgExists, setSvgExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if SVG exists in /public/icons/
    const checkSvgExists = async () => {
      try {
        const svgPath = `/icons/${name}.svg`;
        const response = await fetch(svgPath, { method: 'HEAD' });
        setSvgExists(response.ok);
      } catch {
        setSvgExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSvgExists();
  }, [name]);

  // Show loading state
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

  // Fallback to Lucide React
  const LucideIconComponent = getLucideIcon(name);
  
  if (LucideIconComponent) {
    return (
      <LucideIconComponent
        size={width}
        className={className}
        aria-hidden={ariaHidden}
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