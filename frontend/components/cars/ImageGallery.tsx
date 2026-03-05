'use client';

// Image Gallery Component - Client Component for interactivity
// Displays car images with thumbnail navigation and keyboard support

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CarImage } from '@/lib/api/types';
import { Icon } from '@/components/ui/Icon';

interface ImageGalleryProps {
  images: CarImage[];
  carName: string;
}

export function ImageGallery({ images, carName }: ImageGalleryProps) {
  // Sort images by display_order, with primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentImage = sortedImages[selectedIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedImages.length]);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setImageError(false);
  };

  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className="bg-[#F9FBFC] rounded-[16px] aspect-video flex items-center justify-center">
        <div className="text-center">
          <Icon src="sedan-2-svgrepo-com.svg" width={64} height={64} className="mx-auto mb-4 opacity-30" aria-hidden />
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-[#F9FBFC] rounded-[16px] overflow-hidden aspect-video group">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Icon src="sedan-2-svgrepo-com.svg" width={64} height={64} className="mx-auto mb-4 opacity-30" aria-hidden />
              <p className="text-gray-500">Image failed to load</p>
            </div>
          </div>
        ) : (
          <Image
            src={currentImage.cloudfront_url}
            alt={`${carName} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            priority={selectedIndex === 0}
            onError={() => setImageError(true)}
          />
        )}

        {/* Navigation Arrows (only show if multiple images) */}
        {sortedImages.length > 1 && !imageError && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <Icon src="chevron-left-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <Icon src="chevron-right-double-svgrepo-com.svg" width={20} height={20} aria-hidden />
            </button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-[12px] overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-secondary ring-2 ring-secondary/20'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.cloudfront_url}
                alt={`${carName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
