'use client';

import { useState } from 'react';
import { Star, User } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Thabo Molefe',
    location: 'Johannesburg, SA',
    rating: 5,
    text: "Excellent service and great selection of cars. The team at Prime Deal Auto made the buying process smooth and hassle-free. Highly recommended!",
  },
  {
    id: 2,
    name: 'Naledi Khumalo',
    location: 'Pretoria, SA',
    rating: 5,
    text: "I found my dream SUV at an unbeatable price. The staff were professional and helped me with financing options. Will definitely come back!",
  },
  {
    id: 3,
    name: 'Sipho Ndlovu',
    location: 'Durban, SA',
    rating: 5,
    text: "From start to finish, the experience was fantastic. No hidden fees, transparent pricing, and the car was exactly as described. Thank you Prime Deal Auto!",
  },
  {
    id: 4,
    name: 'Lerato Dlamini',
    location: 'Cape Town, SA',
    rating: 5,
    text: "Best car dealership I've ever dealt with. They went above and beyond to find me the perfect family car within my budget. Five stars!",
  },
  {
    id: 5,
    name: 'Mandla Zulu',
    location: 'Bloemfontein, SA',
    rating: 5,
    text: "The AI chat assistant helped me narrow down my options before I even visited. Modern, efficient, and customer-focused. Impressive!",
  },
  {
    id: 6,
    name: 'Ayanda Mthembu',
    location: 'Port Elizabeth, SA',
    rating: 5,
    text: "Bought a bakkie for my business and couldn't be happier. Fair trade-in value for my old vehicle and excellent after-sales support.",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-[500px] bg-white rounded-[16px] p-8 shadow-[0px_6px_24px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-[#E1C03F] text-[#E1C03F]" />
        ))}
      </div>
      <p className="text-[26px] leading-[42px] font-medium text-primary mb-6">
        "{testimonial.text}"
      </p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <div className="text-[18px] leading-[32px] font-medium text-primary">
            {testimonial.name}
          </div>
          <div className="text-[14px] leading-[24px] text-gray-600">
            {testimonial.location}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-16 bg-[#F9FBFC] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
        <h2 className="text-[40px] leading-[45px] font-bold text-primary text-center mb-12">
          What Our Customers Say
        </h2>
      </div>
      
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-6 ${isPaused ? '[animation-play-state:paused]' : ''}`}
          style={{
            animation: 'scroll-left 40s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
