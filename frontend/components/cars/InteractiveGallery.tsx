'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Play, ImageIcon } from 'lucide-react';
import { ZoomControls, CompactZoomControls } from './ZoomControls';
import { VideoPlayer } from './VideoPlayer';
import { parseVideoUrl } from '@/lib/utils/parseVideoUrl';

interface GalleryImage {
  id?: string;
  url: string;
  alt?: string;
  cloudfront_url?: string;
}

interface InteractiveGalleryProps {
  /** Array of images to display */
  images: GalleryImage[];
  /** Car name for alt text */
  carName: string;
  /** Optional video URL (YouTube or Vimeo) */
  videoUrl?: string | null;
  /** Optional className for the container */
  className?: string;
}

type GalleryTab = 'photos' | 'video';

// Zoom configuration
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.5;

/**
 * InteractiveGallery Component
 * 
 * Premium car gallery with:
 * - Tabbed interface: "All Photos" | "Video"
 * - GPU-accelerated zoom using CSS transform: scale()
 * - Carousel navigation with wrapping at boundaries
 * - Responsive design with mobile-optimized controls
 */
export function InteractiveGallery({
  images,
  carName,
  videoUrl,
  className = '',
}: InteractiveGalleryProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('photos');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Check if video is valid
  const parsedVideo = videoUrl ? parseVideoUrl(videoUrl) : null;
  const hasValidVideo = parsedVideo?.isValid ?? false;

  // Get current image URL (prefer cloudfront_url)
  const getImageUrl = (image: GalleryImage) => {
    return image.cloudfront_url || image.url;
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      // Reset pan when zooming back to 1x
      if (newZoom === MIN_ZOOM) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Reset zoom when changing images
  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Navigation handlers with wrapping
  const handlePrevious = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length, resetZoom]);

  const handleNext = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length, resetZoom]);

  // Tab change handler
  const handleTabChange = (tab: GalleryTab) => {
    setActiveTab(tab);
    if (tab === 'photos') {
      resetZoom();
    }
  };

  // Thumbnail click handler
  const handleThumbnailClick = (index: number) => {
    resetZoom();
    setCurrentIndex(index);
  };

  // Handle drag/pan when zoomed
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (zoomLevel <= MIN_ZOOM) return;
      
      const container = imageContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * -100 * (zoomLevel - 1);
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -100 * (zoomLevel - 1);
      
      setPanPosition({ x, y });
    },
    [zoomLevel]
  );

  const handleMouseLeave = useCallback(() => {
    if (zoomLevel > MIN_ZOOM) {
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  const currentImage = images[currentIndex];

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => handleTabChange('photos')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-[15px] leading-[26px] font-medium
            transition-colors duration-150
            ${activeTab === 'photos'
              ? 'bg-secondary text-white'
              : 'bg-gray-100 text-primary hover:bg-gray-200'
            }
          `}
        >
          <ImageIcon className="w-4 h-4" />
          All Photos
          <span className="ml-1 text-[13px] opacity-80">({images.length})</span>
        </button>

        {hasValidVideo && (
          <button
            onClick={() => handleTabChange('video')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-[15px] leading-[26px] font-medium
              transition-colors duration-150
              ${activeTab === 'video'
                ? 'bg-secondary text-white'
                : 'bg-gray-100 text-primary hover:bg-gray-200'
              }
            `}
          >
            <Play className="w-4 h-4 animate-pulse" />
            Video
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {activeTab === 'photos' ? (
          <>
            {/* Main Image with Zoom */}
            <div
              ref={imageContainerRef}
              className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: zoomLevel > MIN_ZOOM ? 'grab' : 'zoom-in' }}
            >
              {currentImage && (
                <div
                  className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x}%, ${panPosition.y}%)`,
                  }}
                >
                  <Image
                    src={getImageUrl(currentImage)}
                    alt={currentImage.alt || `${carName} - Image ${currentIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
                    priority={currentIndex === 0}
                  />
                </div>
              )}

              {/* Floating Zoom Controls - Desktop */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:block">
                <ZoomControls
                  zoomLevel={zoomLevel}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  zoomStep={ZOOM_STEP}
                  currentIndex={currentIndex}
                  totalImages={images.length}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                />
              </div>

              {/* Compact Zoom Controls - Mobile */}
              <div className="absolute bottom-4 right-4 md:hidden">
                <CompactZoomControls
                  zoomLevel={zoomLevel}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                />
              </div>

              {/* Mobile Navigation Arrows */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:hidden pointer-events-none">
                <button
                  onClick={handlePrevious}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md pointer-events-auto"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md pointer-events-auto"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Mobile Image Counter */}
              <div className="absolute top-4 right-4 md:hidden px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <span className="text-white text-[13px] font-medium">
                  {currentIndex + 1}/{images.length}
                </span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={image.id || index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`
                      relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden
                      transition-all duration-150
                      ${index === currentIndex
                        ? 'ring-2 ring-secondary ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                      }
                    `}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={getImageUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Video Tab Content */
          <div className="aspect-[4/3] md:aspect-video">
            {videoUrl && <VideoPlayer videoUrl={videoUrl} title={`${carName} Video Tour`} />}
          </div>
        )}
      </div>
    </div>
  );
}
