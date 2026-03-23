'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Gauge,
  Cog,
  Fuel,
  Share2,
  Bookmark,
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
import { InteractiveGallery } from '@/components/cars/InteractiveGallery';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { getSpecIcon, ICON_STYLES } from '@/lib/constants/icon-mapping';
import { ContactFormModal } from '@/components/contact/ContactFormModal';
import { MobileVDPNavigation } from '@/components/layout/MobileVDPNavigation';
import { generateWhatsAppLink, getPhoneLink, formatPhoneNumber } from '@/lib/whatsapp';
import { useTrackCarView } from '@/hooks/useTrackCarView';

interface CarDetailLayoutProps {
  car: CarWithImages;
  relatedCars: CarWithImages[];
}

export function CarDetailLayout({ car, relatedCars }: CarDetailLayoutProps) {
  useTrackCarView(car.id);
  const title = `${car.make} ${car.model}`;
  const subtitle = car.variant ? `${car.variant}` : `${car.year} ${car.model}`;

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [contactFormType, setContactFormType] = React.useState<'enquiry' | 'test_drive'>('enquiry');

  const openEnquiryModal = () => {
    setContactFormType('enquiry');
    setIsContactModalOpen(true);
  };

  const openTestDriveModal = () => {
    setContactFormType('test_drive');
    setIsContactModalOpen(true);
  };

  // Car info for contact forms
  const carInfo = {
    id: car.id,
    make: car.make,
    model: car.model,
    variant: car.variant,
    year: car.year,
    price: car.price,
  };

  // Prepare gallery images with primary first
  const primaryImage = car.images.find((img) => img.is_primary) || car.images[0];
  const otherImages = car.images.filter((img) => img !== primaryImage);
  const galleryImages = [primaryImage, ...otherImages].filter(Boolean).map((img) => ({
    id: img!.id,
    url: img!.cloudfront_url,
    cloudfront_url: img!.cloudfront_url,
    alt: `${car.year} ${car.make} ${car.model}`,
  }));

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
          {/* Interactive Gallery */}
          <section aria-label="Car media gallery">
            <InteractiveGallery
              images={galleryImages}
              carName={`${car.year} ${car.make} ${car.model}`}
              videoUrl={car.video_url}
            />
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
              <OverviewColumnWithCustomIcons
                items={[
                  { label: 'Mileage', value: formatMileage(car.mileage) },
                  {
                    label: 'Fuel Type',
                    value: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1),
                  },
                  { label: 'Year', value: car.year.toString() },
                  {
                    label: 'Transmission',
                    value:
                      car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1),
                  },
                  {
                    label: 'Body Type',
                    value: car.body_type.charAt(0).toUpperCase() + car.body_type.slice(1),
                  },
                  {
                    label: 'Drive Type',
                    value: '—',
                  },
                ]}
              />
              <OverviewColumnWithCustomIcons
                items={[
                  {
                    label: 'Condition',
                    value: car.condition.charAt(0).toUpperCase() + car.condition.slice(1),
                  },
                  {
                    label: 'Engine Size',
                    value: '—',
                  },
                  {
                    label: 'Doors',
                    value: '—',
                  },
                  {
                    label: 'Cylinders',
                    value: '—',
                  },
                  {
                    label: 'Color',
                    value: car.color.charAt(0).toUpperCase() + car.color.slice(1),
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
                bgClass="bg-[#FFE9F3]"
                icon={Calendar}
                label="Schedule Test Drive"
                onClick={openTestDriveModal}
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
          <SellerSidebar 
            onMessageClick={openEnquiryModal}
            whatsappLink={generateWhatsAppLink(carInfo)}
          />
        </aside>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        car={carInfo}
        formType={contactFormType}
      />

      {/* Mobile VDP Navigation - only visible on mobile */}
      <MobileVDPNavigation
        car={carInfo}
        onEmailClick={openEnquiryModal}
      />

      {/* Spacer for mobile navigation */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
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

interface OverviewItemWithCustomIcon {
  label: string;
  value: string;
}

interface OverviewColumnWithCustomIconsProps {
  items: OverviewItemWithCustomIcon[];
}

function OverviewColumnWithCustomIcons({ items }: OverviewColumnWithCustomIconsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const iconMapping = getSpecIcon(item.label);
        
        return (
          <div key={item.label} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF1FB] transition-colors group-hover:bg-[#E9F2FF]">
              {iconMapping ? (
                <DynamicIcon
                  name={iconMapping.filename.replace('.svg', '')}
                  width={ICON_STYLES.size}
                  height={ICON_STYLES.size}
                  className="text-primary group-hover:text-secondary transition-colors"
                />
              ) : (
                <Gauge className="h-4 w-4 text-primary" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-[15px] leading-[26px] text-primary">{item.label}</p>
              <p className="text-[15px] leading-[26px] font-medium text-primary">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ActionButtonProps {
  bgClass: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}

function ActionButton({ bgClass, icon: IconComponent, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-[12px] px-6 py-4 ${bgClass} text-[15px] leading-[26px] font-medium text-primary hover:opacity-90 transition-opacity`}
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

interface SellerSidebarProps {
  onMessageClick: () => void;
  whatsappLink: string;
}

function SellerSidebar({ onMessageClick, whatsappLink }: SellerSidebarProps) {
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
              href={getPhoneLink()}
              className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
            >
              {formatPhoneNumber()}
            </a>
          </div>
        </div>

        {/* Primary actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onMessageClick}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-secondary px-6 py-4 text-[15px] leading-[26px] font-medium text-white hover:bg-secondary/90 transition-colors"
          >
            <MailIcon className="h-4 w-4" aria-hidden />
            <span>Message Dealer</span>
          </button>
          <a
            href={whatsappLink}
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

