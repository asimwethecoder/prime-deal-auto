// Renders an icon from /public/icons/ with consistent sizing.
// Use className="invert" for white icons on dark backgrounds (e.g. footer).

import Image from 'next/image';

interface IconProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

const DEFAULT_SIZE = 24;

export function Icon({
  src,
  alt = '',
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  className,
  'aria-hidden': ariaHidden,
}: IconProps) {
  return (
    <Image
      src={`/icons/${src}`}
      alt={alt}
      width={width}
      height={height}
      className={className}
      aria-hidden={ariaHidden}
      unoptimized
    />
  );
}
