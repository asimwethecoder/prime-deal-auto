// Car Reference Parsing Utility
// Parses car URLs from chat messages to render inline car cards

import type { CarReference, MessageSegment } from '@/lib/types/chat';

/**
 * Regex to match car URLs in message content
 * Matches: https://primedealauto.co.za/cars/{uuid}
 */
const CAR_URL_REGEX =
  /https?:\/\/(?:www\.)?primedealauto\.co\.za\/cars\/([a-f0-9-]{36})/gi;

/**
 * Parse car references from message content
 */
export function parseCarReferences(content: string): CarReference[] {
  const references: CarReference[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  CAR_URL_REGEX.lastIndex = 0;

  while ((match = CAR_URL_REGEX.exec(content)) !== null) {
    references.push({
      carId: match[1],
      url: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return references;
}

/**
 * Split message content into text and car reference segments
 */
export function splitMessageContent(content: string): MessageSegment[] {
  const references = parseCarReferences(content);

  if (references.length === 0) {
    return [{ type: 'text', content }];
  }

  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const ref of references) {
    // Add text before this reference
    if (ref.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, ref.startIndex),
      });
    }

    // Add car reference
    segments.push({
      type: 'car',
      content: ref.url,
      carId: ref.carId,
    });

    lastIndex = ref.endIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return segments;
}
