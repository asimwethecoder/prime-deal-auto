/**
 * Video URL Parsing Utility
 * 
 * Parses YouTube and Vimeo URLs to extract video IDs and generate embed URLs.
 * Used by the VideoPlayer component to render responsive video embeds.
 */

export interface ParsedVideo {
  provider: 'youtube' | 'vimeo' | 'unknown';
  videoId: string | null;
  embedUrl: string | null;
  isValid: boolean;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  // youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  // youtu.be/VIDEO_ID
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  // youtube.com/embed/VIDEO_ID
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  // youtube.com/v/VIDEO_ID
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
];

// Vimeo URL patterns
const VIMEO_PATTERNS = [
  // vimeo.com/VIDEO_ID
  /(?:vimeo\.com\/)(\d+)/,
  // player.vimeo.com/video/VIDEO_ID
  /(?:player\.vimeo\.com\/video\/)(\d+)/,
];

/**
 * Parses a video URL and returns provider info, video ID, and embed URL.
 * 
 * @param url - The video URL to parse (YouTube or Vimeo)
 * @returns ParsedVideo object with provider, videoId, embedUrl, and isValid
 * 
 * @example
 * parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // { provider: 'youtube', videoId: 'dQw4w9WgXcQ', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', isValid: true }
 * 
 * @example
 * parseVideoUrl('https://vimeo.com/123456789')
 * // { provider: 'vimeo', videoId: '123456789', embedUrl: 'https://player.vimeo.com/video/123456789', isValid: true }
 */
export function parseVideoUrl(url: string): ParsedVideo {
  if (!url || typeof url !== 'string') {
    return {
      provider: 'unknown',
      videoId: null,
      embedUrl: null,
      isValid: false,
    };
  }

  const trimmedUrl = url.trim();

  // Try YouTube patterns
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        provider: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isValid: true,
      };
    }
  }

  // Try Vimeo patterns
  for (const pattern of VIMEO_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        provider: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        isValid: true,
      };
    }
  }

  // Unknown provider or invalid URL
  return {
    provider: 'unknown',
    videoId: null,
    embedUrl: null,
    isValid: false,
  };
}
