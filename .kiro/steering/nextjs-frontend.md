---
inclusion: always
---

# Next.js 15 Frontend Conventions

## App Router Structure
- Use `app/` directory with `layout.tsx` and `page.tsx` conventions
- Route groups for organization without URL impact:
  - `(public)/` — public pages (cars, about, contact, search)
  - `(auth)/` — login, signup, forgot-password
- Protected routes use layout-level auth guards:
  - `dashboard/layout.tsx` — requires authenticated user
  - `admin/layout.tsx` — requires admin group membership

## Server Components vs Client Components (Critical)
- All components in `app/` are React Server Components (RSC) by default
- Only add `'use client'` when you need interactivity (useState, onClick, browser APIs)
- Keep client component boundaries small — extract minimal interactive "islands"
- Anti-pattern: marking an entire page as `'use client'` — instead, extract only the interactive parts
- Server Components can import Client Components, but not vice versa
- Data fetching should happen in Server Components whenever possible

## Caching (Next.js 15 Breaking Change)
- In Next.js 15, `fetch()` defaults to `no-store` (uncached) — this is different from Next.js 14
- You MUST explicitly opt into caching:
  - `fetch(url, { cache: 'force-cache' })` for static data
  - `fetch(url, { next: { revalidate: 60 } })` for ISR with revalidation
- GET Route Handlers are also dynamic by default (no caching unless configured)
- Client-side router cache no longer caches Page components by default

## Data Fetching Strategy
| Page Type | Rendering | Method | Caching |
|-----------|-----------|--------|---------|
| Home | SSG + ISR | Server Component fetch | `next: { revalidate: 60 }` |
| Car Listing | SSR | Server Component fetch | `no-store` (default, always fresh) |
| Car Detail | SSG + ISR | Server Component fetch | `next: { revalidate: 300 }` |
| Search | SSR | Server Component with searchParams | `no-store` (default) |
| Admin pages | CSR | TanStack Query | Client-side cache |
| Dashboard | CSR | TanStack Query | Client-side cache |

## Client State
- TanStack Query v5 for all server state (API data, caching, mutations, optimistic updates)
- Zustand for client-only state (auth state, UI toggles, modals)
- React Hook Form + Zod for form state and validation
- Do NOT duplicate server state in Zustand — let TanStack Query own it

## Component Organization
```
components/
├── cars/        # CarCard, CarGrid, ImageGallery, SpecificationsTable, etc.
├── home/        # HeroSection, FeaturedCars, BrandsSection, etc.
├── search/      # SearchBar, FilterPanel, FilterChips, SortDropdown
├── chat/        # ChatWidget, ChatWindow, MessageBubble, ChatCarCard
├── admin/       # CarForm, ImageUploader, ListingsTable, StatsCards
├── layout/      # Header, Footer, BottomNavigation, Sidebar
└── ui/          # Button, Input, Modal, Skeleton, Badge, Accordion
```

## Styling
- Tailwind CSS v4 (utility-first, no custom CSS unless necessary)
- Framer Motion for animations (page transitions, hover effects)
- Responsive breakpoints: mobile (<640px), tablet (640–1024px), desktop (>1024px)
- Mobile-first approach

## Auth Integration
- AWS Amplify JS v6 for Cognito auth flows
- `amplify-config.ts` for Amplify configuration
- `useAuth.ts` hook wraps Amplify auth state
- `authStore.ts` (Zustand) for reactive auth state in components
- `Authorization: Bearer <idToken>` header on authenticated API calls

## API Client
- `lib/api/client.ts` — fetch wrapper with base URL, auth headers, error handling
- Domain-specific API modules: `cars.ts`, `search.ts`, `leads.ts`, `chat.ts`, `admin.ts`, `favorites.ts`
- All API calls return typed responses matching backend format

## Performance
- Use `next/image` for all images (automatic optimization, lazy loading)
- Use `next/font` for font optimization
- Lazy load heavy components (ChatWidget, ImageGallery lightbox) with `dynamic()`
- Minimize `'use client'` surface area to reduce client JS bundle

## SEO & Metadata

### Metadata API (generateMetadata)
- Use `generateMetadata()` export for dynamic page metadata — never use `<Head>` in App Router
- Set site-wide defaults in `app/layout.tsx`, override per page in `page.tsx`
- Use `title.template` in root layout for consistent title format: `%s | Prime Deal Auto`
- `title.default` is required when using `title.template`
- Static metadata (via `export const metadata`) is preferred when data doesn't depend on runtime info
- `generateMetadata` fetch requests are automatically memoized across the page render

```typescript
// app/layout.tsx — site-wide defaults
export const metadata: Metadata = {
  metadataBase: new URL('https://primedealauto.co.za'),
  title: { default: 'Prime Deal Auto', template: '%s | Prime Deal Auto' },
  description: 'Find your perfect car at Prime Deal Auto',
  openGraph: {
    type: 'website',
    siteName: 'Prime Deal Auto',
    locale: 'en_ZA',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

// app/(public)/cars/[carId]/page.tsx — dynamic per-car metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getCar(params.carId);
  return {
    title: `${car.year} ${car.make} ${car.model}`,
    description: `${car.year} ${car.make} ${car.model} — ${car.mileage} km, R${car.price}`,
    alternates: { canonical: `/cars/${car.id}` },
    openGraph: {
      title: `${car.year} ${car.make} ${car.model}`,
      description: car.description,
      images: [{ url: car.primaryImage, width: 1200, height: 630 }],
    },
  };
}
```

### Canonical URLs
- Set `metadataBase` in root layout — all relative URLs resolve against it
- Use `alternates.canonical` on every page to prevent duplicate content issues
- Use relative paths (`./` or `/cars/123`) — Next.js resolves them against `metadataBase`

### Open Graph Images
- Use the `opengraph-image.tsx` file convention for dynamic OG image generation
- Place in route segments: `app/(public)/cars/[carId]/opengraph-image.tsx`
- Next.js auto-generates `<meta property="og:image">` tags from these files
- For static pages (home, about), use a static `opengraph-image.png` file in the route
- Car detail pages: generate dynamic OG images showing car photo, make/model, price

```typescript
// app/(public)/cars/[carId]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { carId: string } }) {
  const car = await getCar(params.carId);
  return new ImageResponse(
    <div style={{ /* car image + title + price overlay */ }}>
      {car.year} {car.make} {car.model} — R{car.price}
    </div>,
    { ...size }
  );
}
```

### Structured Data (JSON-LD)
- Render as `<script type="application/ld+json">` in Server Components (Next.js recommended approach)
- Sanitize JSON-LD payload to prevent XSS — replace `<` with `\u003c` in output
- Use `schema-dts` package for TypeScript type safety
- Validate with Google Rich Results Test and Schema Markup Validator

Per-page structured data:
| Page | Schema Type | Key Properties |
|------|------------|----------------|
| Home | `AutoDealer` | name, address, url, logo, openingHours, telephone |
| Car Detail | `Car` | make, model, year, mileage, fuelType, color, price (via `Offer`), image |
| Car Listing | `ItemList` | list of `Car` items with position |
| About | `Organization` + `FAQPage` | name, description, FAQ items |
| Contact | `ContactPage` | address, telephone, email |

```typescript
// Car detail page — JSON-LD example
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Car',
  name: `${car.year} ${car.make} ${car.model}`,
  manufacturer: { '@type': 'Organization', name: car.make },
  modelDate: car.year.toString(),
  mileageFromOdometer: {
    '@type': 'QuantitativeValue',
    value: car.mileage,
    unitCode: 'KMT',
  },
  fuelType: car.fuel_type,
  vehicleTransmission: car.transmission,
  color: car.color,
  image: car.images.map(img => img.cloudfront_url),
  offers: {
    '@type': 'Offer',
    price: car.price,
    priceCurrency: 'ZAR',
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'AutoDealer', name: 'Prime Deal Auto' },
  },
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
    {/* page content */}
  </>
);
```

### Breadcrumb Structured Data
- Add `BreadcrumbList` schema on car detail and category pages
- Matches the visual `Breadcrumb.tsx` component (Home > Cars > Make > Model)
- Helps search engines understand site hierarchy

### Dynamic Sitemap (`app/sitemap.ts`)
- Use Next.js built-in `MetadataRoute.Sitemap` — no need for `next-sitemap` package
- Fetch all active cars from API and generate entries dynamically
- Set `changeFrequency` and `priority` per page type
- For large inventories (>50K URLs), use `generateSitemaps()` to create sitemap index

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await fetchAllActiveCars();
  const carEntries = cars.map(car => ({
    url: `https://primedealauto.com/cars/${car.id}`,
    lastModified: car.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://primedealauto.com', changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://primedealauto.com/cars', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://primedealauto.com/about', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://primedealauto.com/contact', changeFrequency: 'monthly', priority: 0.5 },
    ...carEntries,
  ];
}
```

### Dynamic Robots (`app/robots.ts`)
- Use Next.js built-in `MetadataRoute.Robots`
- Allow all crawlers on public pages, block admin/dashboard routes
- Reference sitemap URL

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/dashboard/', '/api/'] },
    ],
    sitemap: 'https://primedealauto.com/sitemap.xml',
  };
}
```

### LLM Optimization (`llms.txt`)
- Serve `/llms.txt` at the site root — a markdown file that helps AI systems (ChatGPT, Claude, Perplexity) understand the site
- Think of it as `robots.txt` for AI: while robots.txt controls crawl access, llms.txt provides context for understanding
- Implement as a Next.js Route Handler (`app/llms.txt/route.ts`) returning markdown with `text/markdown` content type

llms.txt structure (per the [llms.txt specification](https://llmstxtgenerator.org/llmstxt-documentation)):
1. H1 header (required): site/project name
2. Blockquote (optional): short summary of the business
3. Additional details (optional): key info paragraphs
4. H2 sections with file lists: links to important pages with descriptions
5. "Optional" H2 section: secondary resources that can be skipped for shorter context

```typescript
// app/llms.txt/route.ts
export async function GET() {
  const content = `# Prime Deal Auto

> Prime Deal Auto is an online car dealership offering a curated inventory of quality used and new vehicles. Browse, search, compare, and enquire about cars.

## Key Pages
- [Browse All Cars](https://primedealauto.com/cars): Full searchable inventory with filters for make, model, year, price, body type, fuel type, and transmission
- [About Us](https://primedealauto.com/about): Company information, values, and history
- [Contact](https://primedealauto.com/contact): Enquiry form and contact details

## Inventory Features
- AI-powered chat assistant to help find the right car
- Advanced search with autocomplete suggestions
- Detailed car pages with specifications, images, and pricing
- Enquiry forms for direct dealer contact

## Optional
- [Sitemap](https://primedealauto.com/sitemap.xml): Complete list of all pages and car listings
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
```

### Core Web Vitals (SEO Ranking Factor)
- LCP (Largest Contentful Paint): use `next/image` with `priority` on above-the-fold hero/car images
- CLS (Cumulative Layout Shift): always set `width` and `height` on images; use skeleton loaders for async content
- INP (Interaction to Next Paint): minimize client JS; keep interactive components small
- Use `next/font` to eliminate font-related layout shift (FOIT/FOUT)
- Target: LCP < 2.5s, CLS < 0.1, INP < 200ms

## Icons
- Lucide React (tree-shakeable, consistent style)

## File References
- Frontend pages map: #[[file:04-FRONTEND-PAGES.md]]
- Project structure: #[[file:01-PROJECT-STRUCTURE.md]]
