import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prime Deal Auto',
    short_name: 'Prime Deal Auto',
    description: 'Find your perfect car at Prime Deal Auto. Browse quality used and new vehicles in South Africa.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050B20',
    theme_color: '#050B20',
    icons: [
      {
        src: '/logo/primedealautologo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo/primedealautologo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
