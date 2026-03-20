// Home Page - Server Component with ISR
// Fetches featured cars from the API with 60 second revalidation

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedCars, getCars } from '@/lib/api/cars';
import { getSearchFacets, type FacetResult } from '@/lib/api/search';
import type { CarWithImages } from '@/lib/api/types';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { BrandCarousel } from '@/components/home/BrandCarousel';
import { ExploreAllVehiclesSection } from '@/components/home/ExploreAllVehiclesSection';
import { PopularMakesSection } from '@/components/home/PopularMakesSection';
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel';
import { CarCard } from '@/components/cars/CarCard';
import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton';
import { EnhancedHeroSearch } from '@/components/home/EnhancedHeroSearch';
import { AISearchBar } from '@/components/search/AISearchBar';
import {
  Tag,
  Gem,
  DollarSign,
  Wrench,
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { RetryButton } from '@/components/ui/RetryButton';

// Enable ISR with 60 second revalidation
export const revalidate = 60;

/** Set to true to show the Featured Cars section on the homepage */
const SHOW_FEATURED_CARS = false;

// Page metadata
export const metadata: Metadata = {
  title: 'Home',
  description: 'Find your perfect car at Prime Deal Auto. Browse quality used and new vehicles in South Africa.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  let featuredCars: Awaited<ReturnType<typeof getFeaturedCars>> | undefined;
  let error: string | null = null;
  let carCount = 0;

  let facets: FacetResult = {};

  try {
    const [featured, countRes, facetsRes] = await Promise.all([
      getFeaturedCars(),
      getCars({ limit: 1 }),
      getSearchFacets().catch(() => ({})),
    ]);
    featuredCars = featured;
    carCount = countRes.total;
    facets = facetsRes ?? {};
  } catch (err) {
    console.error('Failed to fetch featured cars:', err);
    featuredCars = [];
    carCount = 0;
    error =
      err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string'
        ? (err as Error).message
        : 'Unable to load cars. Please check your connection and try again.';
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Prime Deal Auto',
    url: 'https://primedealauto.co.za',
    logo: 'https://primedealauto.co.za/logo/primedealautologo.jpeg',
    description: 'Quality used and new cars at unbeatable prices in Johannesburg, South Africa.',
    telephone: '+27732144072',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '515 Louis Botha Ave, Savoy',
      addressLocality: 'Johannesburg',
      postalCode: '2090',
      addressCountry: 'ZA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -26.1496,
      longitude: 28.0738,
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '17:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '13:00' },
    ],
    sameAs: ['https://www.facebook.com/profile.php?id=61567384738083'],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Hero Section: 90vh, content vertically centered */}
      <section className="relative grid grid-cols-1 grid-rows-1 min-h-[90vh] overflow-hidden">
        <HeroCarousel />
        <div className="col-start-1 row-start-1 z-10 flex flex-col items-center justify-center w-full px-6 md:px-6 lg:px-8 py-16 text-center">
          <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center gap-y-6">
            {/* 1. Main Heading: text-4xl mobile → text-6xl desktop, font-bold 700, #FFFFFF */}
            <div className="w-full max-w-[1400px] mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                Prime Deal Auto
              </h1>
              <p className="text-lg text-white/80 max-w-2xl mx-auto font-normal text-center">
                Quality used cars at unbeatable prices.
              </p>
            </div>
            {/* 2. AI Search Bar (Tier 1) - mobile only; rounded-full, white, sh-3 shadow */}
            <div className="w-full max-w-[1400px] mx-auto md:hidden" id="hero-search" data-cursor-magnetic>
              <AISearchBar
                placeholder='Search e.g. "SUVs under R300k"'
                className="max-w-xl mx-auto w-full min-w-0"
                variant="hero"
                inputId="hero-ai-search-input"
              />
            </div>
            <p className="text-white/80 text-sm font-normal text-center md:hidden -mt-2">Or search by</p>
            {/* 3. Classic Filters (Tier 2) - gap-y-4 on mobile, 12px radius */}
            <div className="w-full max-w-[1400px] mx-auto flex justify-center gap-y-4 md:gap-y-0" data-cursor-magnetic>
              <EnhancedHeroSearch totalCount={carCount} />
            </div>
          </div>
        </div>
      </section>

      {/* White container: subtle curve overlap, Premium Brands right after hero */}
      <section className="relative z-10 -mt-16 pt-16 pb-16 bg-[#F9FBFC] rounded-t-[40px] md:rounded-t-[80px]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-[40px] leading-[45px] font-bold text-primary">
              Explore Our Premium Brands
            </h2>
            <Link
              href="/cars"
              className="flex items-center gap-2 text-primary font-medium text-[15px] hover:text-secondary transition-colors"
            >
              Show All Brands
              <Icon src="arrow-up-right-svgrepo-com.svg" width={16} height={16} className="rotate-[-45deg] shrink-0" aria-hidden />
            </Link>
          </div>
          <BrandCarousel />
        </div>
      </section>

      {/* Explore All Vehicles */}
      <ExploreAllVehiclesSection />

      {/* Popular Makes - dark section, make tabs, car slider */}
      <PopularMakesSection facets={facets} />

      {/* Featured Cars Section - hidden; set SHOW_FEATURED_CARS to true to show */}
      {SHOW_FEATURED_CARS && (
        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                Featured Cars
              </h2>
              <Link
                href="/cars"
                className="text-secondary hover:text-secondary/80 font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-card p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <RetryButton />
              </div>
            )}

            {/* Loading State (shown during build/revalidation) */}
            {!featuredCars && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Featured Cars Grid */}
            {featuredCars && featuredCars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {featuredCars && featuredCars.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">
                  No cars available at the moment.
                </p>
                <p className="text-gray-500">
                  Check back soon for new arrivals!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Reviews Section - Carousel */}
      <TestimonialsCarousel />

      {/* Banner CTAs - match reference: same description, filled Get Started buttons */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Looking for a Car - light blue card, blue button */}
            <div className="bg-[#E9F2FF] rounded-[16px] p-8 flex items-center gap-6">
              <div className="flex-shrink-0 w-[60px] h-[60px] bg-secondary/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-[30px] leading-[45px] font-bold text-primary mb-2">
                  Are You Looking For a Car?
                </h3>
                <p className="text-[15px] leading-[26px] text-gray-600 mb-4">
                  We are committed to providing our customers with exceptional service.
                </p>
                <Link
                  href="/cars"
                  className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 min-h-[54px] rounded-[12px] font-medium hover:bg-secondary/90 transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Want to Sell - light pink card, dark button */}
            <div className="bg-[#FFE9F3] rounded-[16px] p-8 flex items-center gap-6">
              <div className="flex-shrink-0 w-[60px] h-[60px] bg-[#FF5CF4]/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-[#FF5CF4]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[30px] leading-[45px] font-bold text-primary mb-2">
                  Do You Want to Sell a Car?
                </h3>
                <p className="text-[15px] leading-[26px] text-gray-600 mb-4">
                  We are committed to providing our customers with exceptional service.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 min-h-[54px] rounded-[12px] font-medium hover:bg-primary/90 transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-[#F9FBFC]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-[40px] leading-[45px] font-bold text-primary">
              Latest Blog Posts
            </h2>
            <Link
              href="/blog"
              className="text-secondary hover:text-secondary/80 font-medium transition-colors hidden sm:block"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Top 10 Cars for South African Roads in 2024',
                tag: 'News',
                author: 'Admin',
                date: '2024-01-15',
                image: '/images/hero/hero3.jpg'
              },
              {
                title: 'How to Choose the Right Car for Your Family',
                tag: 'Guide',
                author: 'Admin',
                date: '2024-01-10',
                image: '/images/hero/hero4.jpg'
              },
              {
                title: 'Electric vs Petrol: Which is Right for You?',
                tag: 'Comparison',
                author: 'Admin',
                date: '2024-01-05',
                image: '/images/hero/hero5.jpg'
              }
            ].map((post, index) => (
              <article key={index} className="bg-white rounded-[16px] overflow-hidden shadow-[0px_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0px_6px_24px_rgba(0,0,0,0.05)] transition-shadow">
                <div className="relative h-48 w-full">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white rounded-[30px] px-4 py-2 text-[14px] leading-[24px] font-medium text-primary">
                      {post.tag}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-[20px] leading-[30px] font-medium text-primary mb-4 hover:text-secondary transition-colors cursor-pointer">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[14px] leading-[24px] text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.date).toLocaleDateString('en-ZA')}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Block - Get A Fair Price */}
      <section className="py-16 bg-[#E9F2FF]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-[40px] leading-[45px] font-bold text-primary mb-4">
                Get A Fair Price For Your Car
              </h2>
              <p className="text-[16px] leading-[28px] text-gray-600 mb-6">
                Looking to sell your car? Get an instant valuation and fair market price. 
                We make selling your car quick, easy, and transparent.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-5 min-h-[54px] rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-all hover:scale-105"
              >
                Get Your Valuation
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex-1 relative h-[300px] w-full">
              <Image
                src="/images/hero/hero2.jpg"
                alt="Sell your car"
                fill
                className="object-cover rounded-[16px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white py-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8">
          <h2 className="text-[40px] leading-[45px] font-bold text-primary text-center mb-12">
            Why Choose Prime Deal Auto?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-[#EEF1FB] w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-[20px] leading-[30px] font-bold text-primary mb-2">Special Financing</h3>
              <p className="text-[15px] leading-[26px] text-gray-600">
                Flexible payment options to help you get your dream car.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#EEF1FB] w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4">
                <Gem className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-[20px] leading-[30px] font-bold text-primary mb-2">Quality Vehicles</h3>
              <p className="text-[15px] leading-[26px] text-gray-600">
                Every car is thoroughly inspected and verified for quality.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#EEF1FB] w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-[20px] leading-[30px] font-bold text-primary mb-2">Competitive Prices</h3>
              <p className="text-[15px] leading-[26px] text-gray-600">
                Get the best value for your money with transparent pricing.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#EEF1FB] w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-[20px] leading-[30px] font-bold text-primary mb-2">Expert Service</h3>
              <p className="text-[15px] leading-[26px] text-gray-600">
                Our experienced team is here to help you find the perfect car.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
