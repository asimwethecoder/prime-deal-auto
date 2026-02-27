# Prime Deal Auto — Frontend Pages & Components Map

## Page Inventory

### Public Pages (No Auth Required)

| Route | Page | Data Needed | Key Components |
|-------|------|-------------|----------------|
| `/` | Home | Featured cars, makes, body types | HeroSection, FeaturedCars, BrandsSection, BodyTypeSection, BudgetSection, WhyChooseSection |
| `/cars` | Car Listing | Paginated cars, facets | CarGrid, FilterPanel, SearchBar, SortDropdown, CarCard, CarCardSkeleton |
| `/cars/[carId]` | Car Detail | Single car + images + recommendations | ImageGallery, SpecificationsTable, EnquiryForm, FavoriteButton, RelatedCars, Breadcrumb |
| `/search?q=` | Search Results | Search results + facets | SearchBar, CarGrid, FilterPanel, FilterChips |
| `/about` | About Us | Static content | — |
| `/contact` | Contact | Static + lead form | EnquiryForm (standalone) |
| `/login` | Login | — | Login form (Amplify Auth) |
| `/signup` | Sign Up | — | Signup form (Amplify Auth) |
| `/forgot-password` | Reset Password | — | Reset form (Amplify Auth) |

### Protected Pages (Auth Required)

| Route | Page | Data Needed | Key Components |
|-------|------|-------------|----------------|
| `/dashboard` | User Dashboard | User profile, favorites count | StatsCards |
| `/dashboard/favorites` | My Favorites | User's favorited cars | CarGrid, FavoriteButton |

### Admin Pages (Admin Role Required)

| Route | Page | Data Needed | Key Components |
|-------|------|-------------|----------------|
| `/admin` | Admin Dashboard | Stats (cars, leads, analytics) | StatsCards, charts |
| `/admin/cars` | Manage Listings | All cars (any status) | ListingsTable, status badges |
| `/admin/cars/new` | Add Car | Makes/models/variants | CarForm, ImageUploader, MakeModelSelector |
| `/admin/cars/[carId]/edit` | Edit Car | Single car data | CarForm, ImageUploader |
| `/admin/leads` | Manage Leads | Paginated leads | Leads table, status dropdown |
| `/admin/analytics` | Analytics | Overview, popular pages/cars, geography | Charts, data tables |

### SEO/Machine Routes

| Route | Purpose |
|-------|---------|
| `/sitemap.xml` | Dynamic sitemap (all active cars) |
| `/robots.txt` | Crawler rules |
| `/llms.txt` | LLM optimization file |

## User Flows

### Browse → Enquiry Flow
```
Home → Browse Cars → Filter/Search → Car Detail → Enquiry Form → Lead Created → Email Sent
```

### AI Chat Flow
```
Any Page → Chat Widget (floating) → Type Message → AI Response (with car cards) → Click Car → Car Detail
```

### Admin Car Management Flow
```
Admin Dashboard → Manage Listings → Add New Car → Fill Form → Upload Images → Save → Car Live
```

### Favorites Flow
```
Car Detail → Click Heart → Login (if not auth'd) → Added to Favorites → Dashboard → View Favorites
```

## Component Hierarchy

### Layout (wraps all pages)
```
RootLayout
├── Header (logo, nav, search, auth buttons)
├── {Page Content}
├── Footer (links, contact info, social)
├── BottomNavigation (mobile only)
├── ChatWidget (floating, lazy loaded)
└── WhatsAppButton (floating)
```

### Home Page
```
HomePage
├── HeroSection (search bar, hero image, CTA)
├── FeaturedCars (horizontal scroll of CarCards)
├── BrandsSection (make logos grid)
├── BodyTypeSection (SUV, Sedan, etc. cards)
├── BudgetSection (price range cards)
└── WhyChooseSection (value propositions)
```

### Car Listing Page
```
CarsPage
├── SearchBar
├── FilterPanel (sidebar on desktop, drawer on mobile)
│   ├── Make/Model selects
│   ├── Price range slider
│   ├── Year range
│   ├── Body type checkboxes
│   ├── Fuel type checkboxes
│   └── Transmission checkboxes
├── SortDropdown
├── FilterChips (active filters)
├── CarGrid
│   └── CarCard[] (image, title, price, mileage, badges)
└── Pagination / Load More
```

### Car Detail Page
```
CarDetailPage
├── Breadcrumb (Home > Cars > Make > Model)
├── ImageGallery (main image + thumbnails, lightbox)
├── Car Info Header (year make model, price, badges)
├── SpecificationsTable (2-column grid of specs)
├── Features List (checkmark list)
├── Description (rich text)
├── EnquiryForm (name, email, phone, message)
├── RelatedCars (horizontal scroll)
└── StickyMobileFooter (price + enquiry CTA, mobile only)
```

## Data Fetching Strategy (Next.js)

| Page | Rendering | Fetch Method |
|------|-----------|-------------|
| Home | SSG + ISR (60s) | `fetch(API_URL + '/cars?limit=6')` with revalidate |
| Car Listing | SSR | Server Component fetch to REST API |
| Car Detail | SSG + ISR (300s) | `fetch(API_URL + '/cars/' + carId)` with revalidate |
| Search | SSR | Server Component with searchParams → REST API |
| Admin pages | CSR | Client-side TanStack Query → REST API |
| Dashboard | CSR | Client-side TanStack Query → REST API |

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Mobile | < 640px | Single column, bottom nav, sticky footer CTA |
| Tablet | 640-1024px | 2-column car grid, collapsible filters |
| Desktop | > 1024px | 3-column car grid, sidebar filters, full header |
