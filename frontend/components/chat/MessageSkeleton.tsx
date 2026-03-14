'use client';

// Message Skeleton Component
// Shows loading placeholder while fetching chat history

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="bg-[#F9FBFC] rounded-2xl rounded-bl-sm px-4 py-3 w-[70%] animate-shimmer">
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>

      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="bg-[#405FF2]/20 rounded-2xl rounded-br-sm px-4 py-3 w-[60%] animate-shimmer">
          <div className="h-4 bg-[#405FF2]/30 rounded w-full" />
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="bg-[#F9FBFC] rounded-2xl rounded-bl-sm px-4 py-3 w-[80%] animate-shimmer">
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>

      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="bg-[#405FF2]/20 rounded-2xl rounded-br-sm px-4 py-3 w-[50%] animate-shimmer">
          <div className="h-4 bg-[#405FF2]/30 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
