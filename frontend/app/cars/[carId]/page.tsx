// Car Detail Page - Server Component with ISR
// Displays full car specifications, image gallery, and contact options

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCar, getCars } from '@/lib/api/cars';
import { CarDetailLayout } from '@/components/cars/CarDetailLayout';
import { formatPrice, formatMileage } from '@/lib/utils/format';

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

  // Fetch related cars for the carousel (best-effort; page still renders if this fails)
  let relatedCars: Awaited<ReturnType<typeof getCars>>['data'] = [];
  try {
    const response = await getCars({ limit: 8 });
    relatedCars = response.data.filter((c) => c.id !== car.id);
  } catch {
    relatedCars = [];
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
      <div className="mx-auto max-w-[1400px] px-6 lg:px-0 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[15px] leading-[26px] text-secondary">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/cars" className="hover:underline">
            Cars for Sale
          </Link>
          <span>/</span>
          <span className="text-primary">
            {car.year} {car.make} {car.model}
          </span>
        </nav>

        <CarDetailLayout car={car} relatedCars={relatedCars} />
      </div>
    </div>
  );
}
