'use client';

import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';

interface ZoomControlsProps {
  /** Current zoom level (1.0 to 3.0) */
  zoomLevel: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Zoom step increment */
  zoomStep?: number;
  /** Current image index (0-based) */
  currentIndex: number;
  /** Total number of images */
  totalImages: number;
  /** Callback when zoom in is clicked */
  onZoomIn: () => void;
  /** Callback when zoom out is clicked */
  onZoomOut: () => void;
  /** Callback when previous image is clicked */
  onPrevious: () => void;
  /** Callback when next image is clicked */
  onNext: () => void;
  /** Optional className for the container */
  className?: string;
}

/**
 * ZoomControls Component
 * 
 * Floating control bar for image gallery with:
 * - Zoom in/out buttons with level indicator
 * - Left/right carousel navigation arrows
 * - Current image index display (e.g., "1/8")
 * 
 * Buttons are disabled at min/max bounds.
 */
export function ZoomControls({
  zoomLevel,
  minZoom = 1.0,
  maxZoom = 3.0,
  zoomStep = 0.5,
  currentIndex,
  totalImages,
  onZoomIn,
  onZoomOut,
  onPrevious,
  onNext,
  className = '',
}: ZoomControlsProps) {
  const isMinZoom = zoomLevel <= minZoom;
  const isMaxZoom = zoomLevel >= maxZoom;
  const displayIndex = currentIndex + 1; // Convert to 1-based for display

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 
        bg-white/90 backdrop-blur-sm rounded-full 
        shadow-lg border border-gray-100
        ${className}
      `}
    >
      {/* Navigation: Previous */}
      <button
        onClick={onPrevious}
        className="
          w-8 h-8 flex items-center justify-center rounded-full
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Previous image"
        disabled={totalImages <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Image Counter */}
      <span className="text-[14px] leading-[24px] font-medium text-primary min-w-[40px] text-center">
        {displayIndex}/{totalImages}
      </span>

      {/* Navigation: Next */}
      <button
        onClick={onNext}
        className="
          w-8 h-8 flex items-center justify-center rounded-full
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Next image"
        disabled={totalImages <= 1}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Zoom: Out */}
      <button
        onClick={onZoomOut}
        disabled={isMinZoom}
        className="
          w-8 h-8 flex items-center justify-center rounded-full
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Zoom Level Indicator */}
      <span className="text-[13px] leading-[17px] font-medium text-gray-600 min-w-[36px] text-center">
        {zoomLevel.toFixed(1)}x
      </span>

      {/* Zoom: In */}
      <button
        onClick={onZoomIn}
        disabled={isMaxZoom}
        className="
          w-8 h-8 flex items-center justify-center rounded-full
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Compact zoom controls for mobile or smaller containers
 */
interface CompactZoomControlsProps {
  zoomLevel: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

export function CompactZoomControls({
  zoomLevel,
  minZoom = 1.0,
  maxZoom = 3.0,
  onZoomIn,
  onZoomOut,
  className = '',
}: CompactZoomControlsProps) {
  const isMinZoom = zoomLevel <= minZoom;
  const isMaxZoom = zoomLevel >= maxZoom;

  return (
    <div
      className={`
        flex flex-col gap-1 p-1.5
        bg-white/90 backdrop-blur-sm rounded-lg
        shadow-lg border border-gray-100
        ${className}
      `}
    >
      <button
        onClick={onZoomIn}
        disabled={isMaxZoom}
        className="
          w-8 h-8 flex items-center justify-center rounded
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
      
      <span className="text-[11px] font-medium text-gray-500 text-center">
        {zoomLevel.toFixed(1)}x
      </span>
      
      <button
        onClick={onZoomOut}
        disabled={isMinZoom}
        className="
          w-8 h-8 flex items-center justify-center rounded
          text-primary hover:bg-gray-100 transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
