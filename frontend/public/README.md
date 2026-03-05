# Public Assets Directory

This directory contains all static assets served directly by Next.js.

## Directory Structure

```
public/
├── images/           # General images (hero, banners, backgrounds)
│   └── cars/        # Car-related images (demo/placeholder only)
├── logo/            # Logo files (SVG, PNG)
├── icons/           # Icons and favicons
└── fonts/           # Custom fonts (if needed)
```

## Usage in Components

### Images
```tsx
import Image from 'next/image';

// Reference images from /public
<Image src="/images/hero-bg.jpg" alt="Hero" width={1920} height={1080} />
<Image src="/logo/logo.svg" alt="Prime Deal Auto" width={200} height={50} />
```

### Icons
```tsx
// Favicon is automatically loaded from /public
// Place favicon.ico in /public/icons/ and reference in layout metadata
```

## Important Notes

1. **Car Images in Production**: Production car images are stored in S3 and served via CloudFront. The `/images/cars/` folder is only for development placeholders.

2. **Image Optimization**: Always use `next/image` component for automatic optimization, lazy loading, and responsive images.

3. **Logo Formats**: 
   - Use SVG for scalability
   - Provide PNG fallback for older browsers
   - Include white version for dark backgrounds

4. **Favicon**: Place `favicon.ico` in `/public/icons/` and configure in `app/layout.tsx` metadata.

5. **Font Loading**: We use `next/font` with Google Fonts (DM Sans). Only add custom fonts here if they're not available on Google Fonts.

## Asset Naming Conventions

- Use kebab-case: `hero-background.jpg`, `logo-white.svg`
- Be descriptive: `contact-banner.jpg` not `img1.jpg`
- Include dimensions for raster images: `icon-192x192.png`
- Use appropriate extensions: `.svg`, `.png`, `.jpg`, `.webp`

## Recommended Image Formats

- **SVG**: Logos, icons, simple graphics
- **WebP**: Photos, complex images (best compression)
- **PNG**: Images requiring transparency
- **JPG**: Photos without transparency

## File Size Guidelines

- Hero images: < 500KB (use WebP)
- Logos: < 50KB (use SVG)
- Icons: < 20KB
- Thumbnails: < 100KB

## Next.js Image Optimization

Next.js automatically optimizes images served through the `next/image` component:
- Automatic format conversion (WebP, AVIF)
- Responsive image sizing
- Lazy loading
- Blur placeholder support
