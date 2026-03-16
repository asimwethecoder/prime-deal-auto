'use client';

import { parseVideoUrl } from '@/lib/utils/parseVideoUrl';
import { AlertCircle, Play } from 'lucide-react';

interface VideoPlayerProps {
  /** The video URL (YouTube or Vimeo) */
  videoUrl: string;
  /** Optional title for the video iframe */
  title?: string;
  /** Optional className for the container */
  className?: string;
}

/**
 * VideoPlayer Component
 * 
 * Renders a responsive video player for YouTube and Vimeo URLs.
 * Uses parseVideoUrl utility to extract embed URLs.
 * Displays an error fallback for invalid URLs.
 */
export function VideoPlayer({ videoUrl, title = 'Car Video', className = '' }: VideoPlayerProps) {
  const parsed = parseVideoUrl(videoUrl);

  if (!parsed.isValid || !parsed.embedUrl) {
    return (
      <div className={`relative w-full aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-500 text-[15px] leading-[26px] font-medium">
          Unable to load video
        </p>
        <p className="text-gray-400 text-[14px] leading-[24px] mt-1">
          The video URL is invalid or unsupported
        </p>
      </div>
    );
  }

  // Build embed URL with privacy-enhanced parameters
  const embedParams = new URLSearchParams();
  
  if (parsed.provider === 'youtube') {
    embedParams.set('rel', '0'); // Don't show related videos from other channels
    embedParams.set('modestbranding', '1'); // Minimal YouTube branding
    embedParams.set('playsinline', '1'); // Play inline on iOS
  } else if (parsed.provider === 'vimeo') {
    embedParams.set('byline', '0'); // Hide byline
    embedParams.set('portrait', '0'); // Hide portrait
    embedParams.set('title', '0'); // Hide title
  }

  const finalEmbedUrl = `${parsed.embedUrl}?${embedParams.toString()}`;

  return (
    <div className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={finalEmbedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

/**
 * VideoThumbnail Component
 * 
 * Displays a video thumbnail with play button overlay.
 * Used in gallery tabs to indicate video availability.
 */
interface VideoThumbnailProps {
  /** The video URL to extract thumbnail from */
  videoUrl: string;
  /** Whether to show pulse animation on play icon */
  showPulse?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional className */
  className?: string;
}

export function VideoThumbnail({ 
  videoUrl, 
  showPulse = false, 
  onClick,
  className = '' 
}: VideoThumbnailProps) {
  const parsed = parseVideoUrl(videoUrl);
  
  // Generate thumbnail URL based on provider
  let thumbnailUrl: string | null = null;
  
  if (parsed.provider === 'youtube' && parsed.videoId) {
    // YouTube provides multiple thumbnail sizes
    thumbnailUrl = `https://img.youtube.com/vi/${parsed.videoId}/maxresdefault.jpg`;
  }
  // Note: Vimeo requires API call for thumbnails, so we use a placeholder

  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden group cursor-pointer ${className}`}
      aria-label="Play video"
    >
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`
            w-16 h-16 rounded-full bg-white/90 flex items-center justify-center
            shadow-lg group-hover:scale-110 transition-transform duration-200
            ${showPulse ? 'animate-pulse' : ''}
          `}
        >
          <Play className="w-7 h-7 text-primary ml-1" fill="currentColor" />
        </div>
      </div>
      
      {/* Provider badge */}
      {parsed.provider !== 'unknown' && (
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-white text-[12px] font-medium capitalize">
          {parsed.provider}
        </div>
      )}
    </button>
  );
}
