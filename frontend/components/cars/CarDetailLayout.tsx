'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar,
  Gauge,
  Cog,
  Fuel,
  Share2,
  Bookmark,
  Play,
  Camera,
  Orbit,
  MapPin,
  Phone,
  MessageCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { CarWithImages } from '@/lib/api/types';
import { formatMileage, formatPrice } from '@/lib/utils/format';
import { CarCard } from '@/components/cars/CarCard';

interface CarDetailLayoutProps {
  car: CarWithImages;
  relatedCars: CarWithImages[];
}

export function CarDetailLayout({ car, relatedCars }: CarDetailLayoutProps) {
  const title = `${car.make} ${car.model}`;
  const subtitle = car.variant ? `${car.variant}` : `${car.year} ${car.model}`;

  const primaryImage = car.images.find((img) => img.is_primary) || car.images[0];
  const otherImages = car.images.filter((img) => img !== primaryImage);
  const galleryImages = [primaryImage, ...otherImages].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-16"
    >
      {/* Hero section */}
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <h1 className="text-[40px] leading-[45px] font-bold text-primary">{title}</h1>
          <p className="text-[15px] leading-[26px] text-primary">{subtitle}</p>

          {/* Quick spec pills */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Pill icon={Calendar} label={`${car.year}`} />
            <Pill icon={Gauge} label={formatMileage(car.mileage)} />
            <Pill
              icon={Cog}
              label={car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1)}
            />
            <Pill
              icon={Fuel}
              label={car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1)}
            />
          </div>
        </div>

        {/* Price + actions */}
        <div className="flex flex-col items-start md:items-end gap-4">
          <div className="space-y-1 text-right">
            <p className="text-[30px] leading-[45px] font-bold text-primary">
              {formatPrice(car.price)}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[15px] leading-[26px] font-medium text-primary hover:text-secondary transition-colors"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              <span>Make An Offer Price</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <GhostIconButton icon={Share2} label="Share" />
            <GhostIconButton icon={Bookmark} label="Save" />
          </div>
        </div>
      </header>

      {/* Main grid: gallery + sticky sidebar */}
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_400px] items-start">
        {/* Left column */}
        <div className="space-y-12">
          {/* Gallery */}
          <section aria-label="Car media gallery" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
              {/* Large image */}
              <div className="relative h-[320px] sm:h-[420px] lg:h-[550px] rounded-tl-[16px] rounded-bl-[16px] rounded-tr-[16px] lg:rounded-tr-none overflow-hidden bg-primary">
                {primaryImage && (
                  <Image
                    src={primaryImage.cloudfront_url}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    priority
                  />
                )}
              </div>

              {/* 2x2 grid of secondary images */}
              <div className="hidden h-[550px] grid-cols-2 grid-rows-2 gap-4 lg:grid">
                {galleryImages.slice(1, 5).map((image) => (
                  <div
                    key={image!.id}
                    className="relative overflow-hidden bg-primary first:rounded-tr-[16px] last:rounded-br-[16px]"
                  >
                    <Image
                      src={image!.cloudfront_url}
                      alt={`${car.year} ${car.make} ${car.model} additional`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Media actions */}
            <div className="flex flex-wrap gap-3">
              <MediaButton icon={Play} label="Video" />
              <MediaButton icon={Orbit} label="360 View" />
              <MediaButton icon={Camera} label="All Photos" />
            </div>
          </section>

          {/* Car overview */}
          <section aria-labelledby="car-overview-heading" className="space-y-6">
            <h2
              id="car-overview-heading"
              className="text-[26px] leading-[30px] font-medium text-primary"
            >
              Car Overview
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <OverviewColumn
                items={[
                  { icon: Gauge, label: 'Mileage', value: formatMileage(car.mileage) },
                  {
                    icon: Fuel,
                    label: 'Fuel Type',
                    value: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1),
                  },
                  { icon: Calendar, label: 'Year', value: car.year.toString() },
                  {
                    icon: Cog,
                    label: 'Transmission',
                    value:
                      car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1),
                  },
                  {
                    icon: Gauge,
                    label: 'Body Type',
                    value: car.body_type.charAt(0).toUpperCase() + car.body_type.slice(1),
                  },
                  {
                    icon: Gauge,
                    label: 'Drive Type',
                    value: '—',
                  },
                ]}
              />
              <OverviewColumn
                items={[
                  {
                    icon: Gauge,
                    label: 'Condition',
                    value: car.condition.charAt(0).toUpperCase() + car.condition.slice(1),
                  },
                  {
                    icon: Gauge,
                    label: 'Engine Size',
                    value: '—',
                  },
                  {
                    icon: Gauge,
                    label: 'Doors',
                    value: '—',
                  },
                  {
                    icon: Gauge,
                    label: 'Cylinders',
                    value: '—',
                  },
                  {
                    icon: Gauge,
                    label: 'Color',
                    value: car.color.charAt(0).toUpperCase() + car.color.slice(1),
                  },
                  {
                    icon: Gauge,
                    label: 'VIN',
                    value: car.id ?? '—',
                  },
                ]}
              />
            </div>
          </section>

          {/* Description */}
          <section aria-labelledby="description-heading" className="space-y-6">
            <h2
              id="description-heading"
              className="text-[26px] leading-[30px] font-medium text-primary"
            >
              Description
            </h2>
            <p className="text-[15px] leading-[26px] text-primary whitespace-pre-line">
              {car.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <ActionButton
                bgClass="bg-[#EEF1FB]"
                icon={FileIcon}
                label="View Vin Report"
              />
              <ActionButton
                bgClass="bg-[#E9F2FF]"
                icon={FileIcon}
                label="Car Brochure"
              />
              <ActionButton
                bgClass="bg-[#FFE9F3]"
                icon={Calendar}
                label="Schedule Test Drive"
              />
            </div>
          </section>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <section aria-labelledby="features-heading" className="space-y-6">
              <h2
                id="features-heading"
                className="text-[26px] leading-[30px] font-medium text-primary"
              >
                Features
              </h2>
              <div className="grid grid-cols-1 gap-y-3 gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
                {car.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF1FB]">
                      <Check className="h-3 w-3 text-secondary" aria-hidden />
                    </span>
                    <span className="text-[15px] leading-[26px] text-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Specifications accordion */}
          <section aria-labelledby="specifications-heading" className="space-y-6">
            <h2
              id="specifications-heading"
              className="text-[26px] leading-[30px] font-medium text-primary"
            >
              Specifications
            </h2>
            <SpecificationsAccordion car={car} />
          </section>

          {/* Related listings */}
          {relatedCars.length > 0 && (
            <section aria-labelledby="related-listings-heading" className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="related-listings-heading"
                  className="text-[40px] leading-[45px] font-bold text-primary"
                >
                  Related Listings
                </h2>
                <Link
                  href="/cars"
                  className="inline-flex items-center gap-2 text-[15px] leading-[26px] font-medium text-primary hover:text-secondary transition-colors"
                >
                  <span>View All</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <RelatedListingsCarousel cars={relatedCars} />
            </section>
          )}
        </div>

        {/* Right column: sticky seller sidebar */}
        <aside className="xl:col-[2]">
          <SellerSidebar />
        </aside>
      </div>
    </motion.div>
  );
}

interface PillProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

function Pill({ icon: IconComponent, label }: PillProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#E9F2FF] px-5 py-[11px] text-[15px] leading-[26px] text-secondary">
      <IconComponent className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

interface GhostIconButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

function GhostIconButton({ icon: IconComponent, label }: GhostIconButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-[#E1E1E1] bg-white px-4 py-2 text-[15px] leading-[26px] text-primary shadow-sm hover:bg-gray-50 transition-colors"
    >
      <IconComponent className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

interface MediaButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

function MediaButton({ icon: IconComponent, label }: MediaButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-[11px] text-[15px] leading-[26px] text-primary shadow-sm hover:bg-gray-50 transition-colors"
    >
      <IconComponent className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

interface OverviewItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

interface OverviewColumnProps {
  items: OverviewItem[];
}

function OverviewColumn({ items }: OverviewColumnProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF1FB]">
            <item.icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-[15px] leading-[26px] text-primary">{item.label}</p>
            <p className="text-[15px] leading-[26px] font-medium text-primary">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActionButtonProps {
  bgClass: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

function ActionButton({ bgClass, icon: IconComponent, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-[12px] px-6 py-4 ${bgClass} text-[15px] leading-[26px] font-medium text-primary`}
    >
      <IconComponent className="h-5 w-5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

// Simple file-like icon
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SpecificationsAccordionProps {
  car: CarWithImages;
}

function SpecificationsAccordion({ car }: SpecificationsAccordionProps) {
  const sections: { id: string; title: string; rows: { label: string; value: string }[] }[] = [
    {
      id: 'engine',
      title: 'Engine and Transmission',
      rows: [
        {
          label: 'Engine',
          value: '—',
        },
        {
          label: 'Transmission',
          value: car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1),
        },
        {
          label: 'Fuel Type',
          value: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1),
        },
      ],
    },
    {
      id: 'dimensions',
      title: 'Dimensions & Capacity',
      rows: [
        { label: 'Body Type', value: car.body_type },
        { label: 'Color', value: car.color },
        { label: 'Mileage', value: formatMileage(car.mileage) },
      ],
    },
    {
      id: 'misc',
      title: 'Miscellaneous',
      rows: [
        { label: 'Make', value: car.make },
        { label: 'Model', value: car.model },
        { label: 'Year', value: car.year.toString() },
        {
          label: 'Condition',
          value: car.condition.charAt(0).toUpperCase() + car.condition.slice(1),
        },
        { label: 'VIN', value: car.id ?? '—' },
      ],
    },
  ];

  const [openId, setOpenId] = React.useState<string>('engine');

  return (
    <div className="divide-y divide-[#E1E1E1] rounded-[16px] border border-[#E1E1E1] bg-white">
      {sections.map((section) => {
        const isOpen = openId === section.id;
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? '' : section.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-[18px] leading-[32px] font-medium text-primary">
                {section.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-[15px] leading-[26px] text-gray-600">{row.label}</span>
                    <span className="text-[15px] leading-[26px] font-medium text-primary">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SellerSidebar() {
  return (
    <div className="sticky top-[100px]">
      <div className="rounded-[16px] border border-[#E1E1E1] bg-white p-6 shadow-[0px_6px_24px_rgba(0,0,0,0.05)] space-y-6">
        {/* Dealer logo + info */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#E1E1E1] bg-white text-[24px] font-semibold text-primary">
            P
          </div>
          <div className="space-y-1">
            <p className="text-[20px] leading-[30px] font-medium text-primary">
              Prime Deal Auto
            </p>
            <p className="text-[15px] leading-[26px] text-primary">
              515 Louis Botha Ave, Savoy, Johannesburg, 2090
            </p>
          </div>
        </div>

        {/* Get directions / phone */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF]">
              <MapPin className="h-5 w-5 text-secondary" aria-hidden />
            </div>
            <button
              type="button"
              className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
            >
              Get Directions
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF]">
              <Phone className="h-5 w-5 text-secondary" aria-hidden />
            </div>
            <a
              href="tel:+27732144072"
              className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
            >
              +27 73 214 4072
            </a>
          </div>
        </div>

        {/* Primary actions */}
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-secondary px-6 py-4 text-[15px] leading-[26px] font-medium text-white hover:bg-secondary/90 transition-colors"
          >
            <MailIcon className="h-4 w-4" aria-hidden />
            <span>Message Dealer</span>
          </button>
          <a
            href="https://wa.me/27732144072"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#60C961] bg-white px-6 py-4 text-[15px] leading-[26px] font-medium text-[#60C961] hover:bg-[#F3FFF6] transition-colors"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span>Chat Via Whatsapp</span>
          </a>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 text-[15px] leading-[26px] font-medium text-primary hover:text-secondary transition-colors"
        >
          <span>View all stock at this dealer</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M4 4h16a1 1 0 0 1 1 1v14H3V5a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4 6 8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface RelatedListingsCarouselProps {
  cars: CarWithImages[];
}

function RelatedListingsCarousel({ cars }: RelatedListingsCarouselProps) {
  const [startIndex, setStartIndex] = React.useState(0);
  const visibleCount = 4;

  const total = cars.length;
  const endIndex = Math.min(startIndex + visibleCount, total);

  const canPrev = startIndex > 0;
  const canNext = endIndex < total;

  const handlePrev = () => {
    if (!canPrev) return;
    setStartIndex((prev) => Math.max(prev - visibleCount, 0));
  };

  const handleNext = () => {
    if (!canNext) return;
    setStartIndex((prev) => Math.min(prev + visibleCount, Math.max(total - visibleCount, 0)));
  };

  const visibleCars = cars.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {visibleCars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[15px] leading-[26px] text-primary">
          <span>
            {startIndex + 1}–{endIndex} of {total}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E1E1E1] bg-[#F9FBFC] text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous related listings"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E1E1E1] bg-white text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next related listings"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

