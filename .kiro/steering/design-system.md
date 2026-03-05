# Prime Deal Auto - Design System

## Overview
This design system defines the visual language, components, and styling conventions for Prime Deal Auto's frontend. All values are extracted from the Figma design to ensure pixel-perfect implementation.

## Color Palette

### Primary Colors
```css
--color-primary: #050B20;        /* Main brand color - dark navy */
--color-secondary: #405FF2;      /* Accent blue */
--color-third: #3D923A;          /* Success green */
```

### Background Colors
```css
--bg-1: #F9FBFC;                 /* Light gray background */
--bg-2: #EEF1FB;                 /* Light blue background */
--bg-3: #E9F2FF;                 /* Lighter blue background */
--bg-4: #FFE9F3;                 /* Light pink background */
```

### Neutral Colors
```css
--white: #FFFFFF;
--border: #E1E1E1;               /* Border and divider color */
```

### Accent Colors
```css
--accent-yellow: #E1C03F;        /* Star rating color */
--accent-pink: #FF5CF4;          /* Decorative accent */
--accent-pink-alt: #FF5CF3;      /* Decorative accent variant */
```

## Typography

**Primary font: DM Sans.** Full scale (headlines 20/30/52/70, body 14/15/16/18) is documented in [typography-reference.md](./typography-reference.md).

### Font Family
```css
--font-primary: 'DM Sans', sans-serif;
--font-brand: 'Bebas Neue', sans-serif;  /* Logo only */
```

### Font Sizes & Line Heights
```css
/* Headlines (DM Sans – Regular/Medium/Bold) */
--text-70: 70px / 91px;          /* Hero headline (H 70) */
--text-52: 52px;                 /* Headline 52 */
--text-30: 30px / 45px;          /* Headline 30 */
--text-20: 20px / 30px;          /* Headline 20 */
--text-40-bold: 40px / 45px;     /* Section headings */
--text-38-bold: 38px / 49px;     /* Stats numbers */
--text-30-bold: 30px / 45px;     /* Sub-headings */
--text-30-medium: 30px / 45px;   /* Large text */

/* Body Text */
--text-26-medium: 26px / 42px;   /* Testimonial quotes */
--text-20-bold: 20px / 30px;     /* Card prices */
--text-20-medium: 20px / 30px;   /* Card titles */
--text-18-medium: 18px / 32px;   /* Brand names, labels */
--text-16-medium: 16px / 28px;   /* Tab labels */
--text-16-regular: 16px / 28px;  /* Body text */
--text-15-medium: 15px / 26px;   /* Buttons, links */
--text-15-regular: 15px / 26px;  /* Body text, descriptions */
--text-14-medium: 14px / 24px;   /* Tags, badges */
--text-14-regular: 14px / 24px;  /* Small text, metadata */
--text-13-regular: 13px / 17px;  /* App store labels */
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-bold: 700;
```

## Spacing System

### Container & Layout
```css
--container-max-width: 1400px;
--container-padding: 260px;      /* Left/right padding from viewport edge */
--section-spacing: 120px;        /* Vertical spacing between sections */
```

### Component Spacing
```css
--gap-10: 10px;
--gap-15: 15px;
--gap-20: 20px;
--gap-30: 30px;
--gap-120: 120px;
```

## Border Radius

```css
--radius-sm: 12px;               /* Small buttons */
--radius-md: 16px;               /* Cards, images */
--radius-lg: 30px;               /* Rounded buttons */
--radius-xl: 60px;               /* Pill buttons */
--radius-full: 120px;            /* Search bar, large buttons */
--radius-circle: 50px;           /* Circular elements */
```

## Shadows

```css
--shadow-1: 0px 2px 8px rgba(0, 0, 0, 0.08);     /* Light shadow */
--shadow-2: 0px 6px 24px rgba(0, 0, 0, 0.05);    /* Medium shadow */
--shadow-3: 0px 10px 40px rgba(0, 0, 0, 0.05);   /* Heavy shadow */
```

## Component Styles

### Buttons

#### Primary Button
```css
background: #405FF2;
border: 1px solid #405FF2;
border-radius: 12px;
padding: 20px 26px;
font: 500 15px/26px 'DM Sans';
color: #FFFFFF;
```

#### Secondary Button (Dark)
```css
background: #050B20;
border: 1px solid #050B20;
border-radius: 12px;
padding: 20px 26px;
font: 500 15px/26px 'DM Sans';
color: #FFFFFF;
```

#### Tertiary Button (White)
```css
background: #FFFFFF;
border-radius: 120px;
padding: 18px 26px;
font: 500 15px/26px 'DM Sans';
color: #050B20;
```

#### Arrow Button (Navigation)
```css
width: 60px;
height: 40px;
background: #F9FBFC;
border: 1px solid #050B20;
border-radius: 30px;
```

### Cards

#### Car Card (List Style v1)
```css
background: #FFFFFF;
border: 1px solid #E1E1E1;
border-radius: 16px;
box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.05);  /* On hover */
```

#### Car Card (List Style v2 - Dark)
```css
background: rgba(255, 255, 255, 0.07);
border-radius: 16px;
```

#### Brand Card
```css
background: #FFFFFF;
border: 1px solid #E1E1E1;
border-radius: 16px;
box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
```

#### Brand Card (Selected)
```css
background: #FFFFFF;
border: 1px solid #405FF2;
border-radius: 16px;
box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
```

### Tags & Badges

#### Tag - Low Mileage (Blue)
```css
background: #405FF2;
border-radius: 30px;
padding: 10px 15px;
font: 500 14px/24px 'DM Sans';
color: #FFFFFF;
```

#### Tag - Great Price (Green)
```css
background: #3D923A;
border-radius: 30px;
padding: 10px 15px;
font: 500 14px/24px 'DM Sans';
color: #FFFFFF;
```

#### Tag - News (White)
```css
background: #FFFFFF;
border-radius: 30px;
padding: 10px 15px;
font: 500 14px/24px 'DM Sans';
color: #050B20;
```

#### Rating Badge
```css
background: #E1C03F;
border-radius: 16px;
padding: 8px;
font: 500 14px/24px 'DM Sans';
color: #FFFFFF;
box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.05);
```

### Forms

#### Search Bar
```css
background: #FFFFFF;
border-radius: 120px;
height: 76px;
```

#### Input Divider
```css
width: 1px;
height: 36px;
background: #E1E1E1;
```

#### Dropdown Arrow
```css
width: 10px;
height: 10px;
color: #050B20;
```

### Navigation

#### Tab (Active)
```css
font: 500 16px/28px 'DM Sans';
color: #050B20;
border-bottom: 2px solid #405FF2;
```

#### Tab (Inactive)
```css
font: 500 16px/28px 'DM Sans';
color: #050B20;
border-bottom: none;
```

#### Category Pill (Active)
```css
background: rgba(255, 255, 255, 0.2);
border-radius: 60px;
padding: 8px 30px;
font: 500 15px/28px 'DM Sans';
color: #FFFFFF;
```

### Icons

#### Icon Sizes
```css
--icon-sm: 12px;
--icon-md: 14px;
--icon-lg: 16px;
--icon-xl: 26px;
--icon-2xl: 60px;
--icon-3xl: 110px;
```

#### Bookmark/Save Button
```css
width: 36px;
height: 36px;
background: #FFFFFF;
border-radius: 50%;
box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.05);
```

### Footer

#### Footer Background
```css
background: #050B20;
border-radius: 80px 80px 0px 0px;  /* Top rounded corners */
```

#### Footer Text
```css
font: 400 15px/26px 'DM Sans';
color: #FFFFFF;
```

#### Footer Heading
```css
font: 500 20px/30px 'DM Sans';
color: #FFFFFF;
```

#### Footer Divider
```css
background: #FFFFFF;
opacity: 0.15;
```

#### Social Icon Container
```css
background: rgba(255, 255, 255, 0.07);
border-radius: 50px;
```

#### App Store Button
```css
background: rgba(255, 255, 255, 0.07);
border-radius: 16px;
```

## Grid System

### Responsive Breakpoints
```css
--mobile: 640px;
--tablet: 1024px;
--desktop: 1920px;
```

### Grid Layouts

#### Car Grid (Responsive)
```css
/* Mobile: 1 column */
grid-template-columns: 1fr;
gap: 20px;

/* Tablet: 2 columns */
@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}
```

#### Brand Grid
```css
grid-template-columns: repeat(6, 210px);
gap: 28px;
```

## Animations & Transitions

### Hover Effects
```css
/* Card hover */
transition: box-shadow 0.3s ease, transform 0.2s ease;
&:hover {
  box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* Button hover */
transition: background 0.2s ease, transform 0.1s ease;
&:hover {
  transform: scale(1.02);
}

/* Link hover */
transition: color 0.2s ease;
&:hover {
  text-decoration: underline;
}
```

## Opacity Values

```css
--opacity-disabled: 0.5;
--opacity-overlay: 0.3;
--opacity-subtle: 0.07;
--opacity-divider: 0.15;
--opacity-hover: 0.2;
```

## Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 100;
--z-fixed: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-popover: 500;
--z-tooltip: 600;
```

## Tailwind CSS Configuration

When implementing with Tailwind CSS v4, extend the default theme with these custom values:

```css
@theme {
  /* Colors */
  --color-primary: #050B20;
  --color-secondary: #405FF2;
  --color-third: #3D923A;
  
  /* Spacing matches design */
  --spacing-container: 260px;
  
  /* Custom shadows */
  --shadow-card: 0px 6px 24px rgba(0, 0, 0, 0.05);
  
  /* Border radius */
  --radius-card: 16px;
  --radius-button: 12px;
}
```

## Component Naming Conventions

### CSS Class Naming (BEM-inspired)
```
.car-card                    /* Block */
.car-card__image            /* Element */
.car-card__title            /* Element */
.car-card--featured         /* Modifier */
```

### Tailwind Utility Classes
```
bg-primary                  /* Background: #050B20 */
bg-secondary                /* Background: #405FF2 */
text-primary                /* Text: #050B20 */
rounded-card                /* Border radius: 16px */
shadow-card                 /* Box shadow: card style */
```

## Accessibility

### Touch Targets
```css
min-width: 44px;
min-height: 44px;
```

### Focus States
```css
&:focus-visible {
  outline: 2px solid #405FF2;
  outline-offset: 2px;
}
```

### Color Contrast
- All text on white backgrounds: WCAG AA compliant
- All text on dark backgrounds (#050B20): WCAG AA compliant
- Button text on colored backgrounds: WCAG AA compliant

## Implementation Notes

1. **Font Loading**: Use `next/font` to optimize DM Sans loading
2. **Images**: All car images use `next/image` with proper aspect ratios
3. **Responsive Images**: Use CloudFront URLs with appropriate sizes
4. **Dark Mode**: Not implemented in initial version (all designs are light mode)
5. **RTL Support**: Not required (South African market, LTR only)

## File References
- Next.js conventions: #[[file:.kiro/steering/nextjs-frontend.md]]
- Project conventions: #[[file:.kiro/steering/project-conventions.md]]
