'use client';

// Message Bubble Component
// Displays individual chat messages with role-based styling

import { RefreshCw } from 'lucide-react';
import { ChatCarCard } from './ChatCarCard';
import { splitMessageContent } from '@/lib/utils/parse-car-references';
import type { ChatMessageDisplay, MessageSegment } from '@/lib/types/chat';

interface MessageBubbleProps {
  message: ChatMessageDisplay;
  onRetry?: () => void;
}

/**
 * Simple markdown parser for bold, italic, and links
 */
function parseMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Pattern for **bold**, *italic*, and [text](url)
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  pattern.lastIndex = 0;

  while ((match = pattern.exec(remaining)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      nodes.push(remaining.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold: **text**
      nodes.push(
        <strong key={key++} className="font-bold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic: *text*
      nodes.push(
        <em key={key++} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Link: [text](url)
      nodes.push(
        <a
          key={key++}
          href={match[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#405FF2] underline hover:no-underline"
        >
          {match[6]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    nodes.push(remaining.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * Render message segment (text or car card)
 */
function renderSegment(segment: MessageSegment, index: number, isAssistant: boolean) {
  if (segment.type === 'car' && segment.carId) {
    return (
      <div key={index} className="my-2">
        <ChatCarCard carId={segment.carId} />
      </div>
    );
  }

  // Text segment - apply markdown parsing for assistant messages
  const content = isAssistant ? parseMarkdown(segment.content) : segment.content;
  return <span key={index}>{content}</span>;
}

/**
 * Format timestamp for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  // Parse message content for car references
  const segments = splitMessageContent(message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-message-fade-in`}>
      <div className="max-w-[85%] flex flex-col">
        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 text-[15px] leading-[26px] whitespace-pre-wrap break-words
            ${isUser
              ? 'bg-[#405FF2] text-white rounded-2xl rounded-br-sm'
              : 'bg-[#F9FBFC] text-[#050B20] rounded-2xl rounded-bl-sm'
            }
            ${isSending ? 'opacity-70' : ''}
            ${isError ? 'border-2 border-red-300' : ''}
          `}
        >
          {segments.map((segment, index) => renderSegment(segment, index, isAssistant))}
        </div>

        {/* Timestamp and status */}
        <div
          className={`flex items-center gap-2 mt-1 text-[12px] text-gray-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isSending && <span>Sending...</span>}
        </div>

        {/* Error state with retry */}
        {isError && (
          <div
            className={`flex items-center gap-2 mt-1 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="text-[12px] text-red-500">
              {message.error || 'Failed to send'}
            </span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[12px] text-[#405FF2] hover:underline focus:outline-none"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
