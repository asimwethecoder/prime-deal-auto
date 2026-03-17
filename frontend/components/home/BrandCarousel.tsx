'use client';

import Link from 'next/link';
import Image from 'next/image';

const BRANDS = [
  { name: 'Toyota', icon: 'toyota-svgrepo-com.svg', make: 'Toyota' },
  { name: 'Isuzu', icon: 'isuzu-svgrepo-com.svg', make: 'Isuzu' },
  { name: 'Ford', icon: 'ford-svgrepo-com.svg', make: 'Ford' },
  { name: 'Nissan', icon: 'nissan-svgrepo-com.svg', make: 'Nissan' },
  { name: 'Hyundai', icon: 'hyundai-svgrepo-com.svg', make: 'Hyundai' },
  { name: 'Audi', icon: 'audi-svgrepo-com.svg', make: 'Audi' },
  { name: 'BMW', icon: 'bmw-svgrepo-com.svg', make: 'BMW' },
  { name: 'Mercedes Benz', icon: 'mercedes-svgrepo-com.svg', make: 'Mercedes Benz' },
  { name: 'Volkswagen', icon: 'volkswagen-svgrepo-com.svg', make: 'Volkswagen' },
];

export function BrandCarousel() {
  const duplicated = [...BRANDS, ...BRANDS];

  return (
    <>
      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .carousel-track {
          animation: scroll 25s linear infinite;
        }
        .carousel-container:hover .carousel-track {
          animation-play-state: paused;
        }
      `}</style>
      <div className="overflow-hidden w-full carousel-container">
        <div className="flex gap-6 w-max carousel-track">
          {duplicated.map((brand, index) => (
            <Link
              key={`${brand.name}-${index}`}
              href={`/cars?make=${encodeURIComponent(brand.make)}`}
              className="flex flex-col items-center justify-center w-[180px] min-h-[140px] p-6 bg-white rounded-[16px] border border-gray-200 transition-all shrink-0 hover:border-secondary hover:shadow-md hover:shadow-secondary/10"
            >
              <div className="relative w-[80px] h-[80px] mb-3">
                <Image
                  src={`/icons/${brand.icon}`}
                  alt={brand.name}
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-[16px] leading-[24px] font-medium text-primary text-center">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
