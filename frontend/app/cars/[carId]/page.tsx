// Car Detail Page - Server Component with ISR
// Displays full car specifications, image gallery, and contact options

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCar } from '@/lib/api/cars';
import { ImageGallery } from '@/components/cars/ImageGallery';
import { SpecificationsTable } from '@/components/cars/SpecificationsTable';
import { formatPrice, formatMileage } from '@/lib/utils/format';
import { Icon } from '@/components/ui/Icon';

// Enable ISR with 300 second (5 minute) revalidation
export const revalidate = 300;

interface CarDetailPageProps {
  params: Promise<{
    carId: string;
  }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: CarDetailPageProps): Promise<Metadata> {
  const { carId } = await params;
  try {
    const car = await getCar(carId);
    const title = `${car.year} ${car.make} ${car.model}`;
    const description = `${car.year} ${car.make} ${car.model} - ${formatMileage(car.mileage)}, ${formatPrice(car.price)}. ${car.description.substring(0, 150)}`;
    const primaryImage = car.images.find(img => img.is_primary) || car.images[0];

    return {
      title,
      description,
      openGraph: {
        title,
        description: car.description,
        images: primaryImage ? [{ url: primaryImage.cloudfront_url, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: car.description,
        images: primaryImage ? [primaryImage.cloudfront_url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Car Not Found',
      description: 'The car you are looking for could not be found.',
    };
  }
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { carId } = await params;
  let car;

  try {
    car = await getCar(carId);
  } catch (error) {
    // If car not found, show 404 page
    notFound();
  }

  // Generate JSON-LD structured data for SEO
  const primaryImage = car.images.find(img => img.is_primary) || car.images[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${car.year} ${car.make} ${car.model}`,
    manufacturer: {
      '@type': 'Organization',
      name: car.make,
    },
    modelDate: car.year.toString(),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: car.mileage,
      unitCode: 'KMT',
    },
    fuelType: car.fuel_type,
    vehicleTransmission: car.transmission,
    color: car.color,
    bodyType: car.body_type,
    vehicleEngine: {
      '@type': 'EngineSpecification',
      fuelType: car.fuel_type,
    },
    image: car.images.map(img => img.cloudfront_url),
    offers: {
      '@type': 'Offer',
      price: car.price,
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoDealer',
        name: 'Prime Deal Auto',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '515 Louis Botha Ave, Savoy',
          addressLocality: 'Johannesburg',
          postalCode: '2090',
          addressCountry: 'ZA',
        },
        telephone: '+27732144072',
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-secondary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/cars" className="hover:text-secondary transition-colors">
            Cars
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">
            {car.year} {car.make} {car.model}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={car.images} carName={`${car.year} ${car.make} ${car.model}`} />

            {/* Car Title and Price */}
            <div>
              <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-2">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-[38px] leading-[49px] font-bold text-secondary">
                {formatPrice(car.price)}
              </p>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#F9FBFC] rounded-[16px] p-4 text-center">
                <Icon src="speedometer-02-svgrepo-com.svg" width={24} height={24} className="mx-auto mb-2" aria-hidden />
                <div className="text-[14px] leading-[24px] text-gray-600 mb-1">Mileage</div>
                <div className="text-[16px] leading-[28px] font-medium text-primary">{formatMileage(car.mileage)}</div>
              </div>
              <div className="bg-[#F9FBFC] rounded-[16px] p-4 text-center">
                <Icon src="gearbox-svgrepo-com.svg" width={24} height={24} className="mx-auto mb-2" aria-hidden />
                <div className="text-[14px] leading-[24px] text-gray-600 mb-1">Transmission</div>
                <div className="text-[16px] leading-[28px] font-medium text-primary capitalize">{car.transmission}</div>
              </div>
              <div className="bg-[#F9FBFC] rounded-[16px] p-4 text-center">
                <Icon src="gas-pump-fill-svgrepo-com.svg" width={24} height={24} className="mx-auto mb-2" aria-hidden />
                <div className="text-[14px] leading-[24px] text-gray-600 mb-1">Fuel Type</div>
                <div className="text-[16px] leading-[28px] font-medium text-primary capitalize">{car.fuel_type}</div>
              </div>
              <div className="bg-[#F9FBFC] rounded-[16px] p-4 text-center">
                <Icon src="sedan-2-svgrepo-com.svg" width={24} height={24} className="mx-auto mb-2" aria-hidden />
                <div className="text-[14px] leading-[24px] text-gray-600 mb-1">Body Type</div>
                <div className="text-[16px] leading-[28px] font-medium text-primary capitalize">{car.body_type}</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">Description</h2>
              <p className="text-[16px] leading-[28px] text-gray-700 whitespace-pre-line">
                {car.description}
              </p>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div>
                <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-[#EEF1FB] text-primary px-4 py-2 rounded-[30px] text-[14px] leading-[24px] font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Table */}
            <div>
              <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">Specifications</h2>
              <SpecificationsTable car={car} />
            </div>
          </div>

          {/* Right Column - Contact Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-[#F9FBFC] rounded-[16px] p-6 sticky top-24">
              <h3 className="text-[20px] leading-[30px] font-bold text-primary mb-4">
                Interested in this car?
              </h3>
              <p className="text-[15px] leading-[26px] text-gray-600 mb-6">
                Contact us to schedule a test drive or get more information about this vehicle.
              </p>

              {/* Contact Buttons */}
              <div className="space-y-3">
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 w-full bg-secondary text-white px-6 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
                >
                  <Icon src="email-1573-svgrepo-com.svg" width={20} height={20} className="invert" aria-hidden />
                  Send Enquiry
                </Link>
                <a
                  href="tel:+27732144072"
                  className="flex items-center justify-center gap-2 w-full bg-white border border-[#E1E1E1] text-primary px-6 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-[#F9FBFC] transition-colors"
                >
                  <Icon src="call-medicine-svgrepo-com.svg" width={20} height={20} aria-hidden />
                  Call Us
                </a>
                <a
                  href="https://wa.me/27732144072"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white px-6 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-[#25D366]/90 transition-colors"
                >
                  <Icon src="whatsapp-svgrepo-com.svg" width={20} height={20} className="invert" aria-hidden />
                  WhatsApp
                </a>
              </div>

              {/* Dealer Info */}
              <div className="mt-6 pt-6 border-t border-[#E1E1E1]">
                <h4 className="text-[16px] leading-[28px] font-medium text-primary mb-3">
                  Prime Deal Auto
                </h4>
                <div className="space-y-2 text-[14px] leading-[24px] text-gray-600">
                  <div className="flex items-start gap-2">
                    <Icon src="location-svgrepo-com.svg" width={16} height={16} className="mt-1 shrink-0" aria-hidden />
                    <span>515 Louis Botha Ave, Savoy, Johannesburg, 2090</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon src="call-medicine-svgrepo-com.svg" width={16} height={16} className="shrink-0" aria-hidden />
                    <span>+27 73 214 4072</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
