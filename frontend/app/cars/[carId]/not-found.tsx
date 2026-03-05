// Not Found page for Car Detail
// Displays custom 404 message when car is not found

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function CarNotFound() {
  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[16px] p-12 shadow-[0px_6px_24px_rgba(0,0,0,0.05)] text-center">
          {/* 404 Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon src="sedan-2-svgrepo-com.svg" width={40} height={40} className="opacity-30" aria-hidden />
          </div>

          {/* Error Message */}
          <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-4">
            Car Not Found
          </h1>
          <p className="text-[16px] leading-[28px] text-gray-600 mb-8">
            Sorry, we couldn't find the car you're looking for. It may have been sold or removed from our inventory.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cars"
              className="bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
            >
              Browse All Cars
            </Link>
            <Link
              href="/"
              className="bg-white border border-[#E1E1E1] text-primary px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-[#F9FBFC] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
