import { MetadataRoute } from 'next';
import { getAllActiveCars } from '@/lib/api/cars';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://primedealauto.co.za';

  // Fetch all active cars for dynamic entries
  let carEntries: MetadataRoute.Sitemap = [];
  try {
    const cars = await getAllActiveCars();
    carEntries = cars.map((car) => ({
      url: `${baseUrl}/cars/${car.id}`,
      lastModified: car.updated_at ? new Date(car.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Failed to fetch cars for sitemap:', error);
    // Continue with static pages even if car fetch fails
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/ad-listing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  return [...staticPages, ...carEntries];
}
