'use client';

// Typing Indicator Component
// Shows animated dots while waiting for AI response

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#F9FBFC] rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-[#050B20]/40 rounded-full animate-typing-dot"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-[#050B20]/40 rounded-full animate-typing-dot"
            style={{ animationDelay: '200ms' }}
          />
          <span
            className="w-2 h-2 bg-[#050B20]/40 rounded-full animate-typing-dot"
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
    </div>
  );
}
