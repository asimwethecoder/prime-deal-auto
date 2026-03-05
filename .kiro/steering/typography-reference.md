# Typography Reference – DM Sans

Reference for Prime Deal Auto typography. **All styles use the font family: DM Sans.**

## Font family

- **Primary UI font:** DM Sans (sans-serif)
- **Usage:** Body text, headings, buttons, labels. Loaded via `next/font` as `--font-dm-sans`; apply with `font-sans` in Tailwind.

## Headline scale

| Style        | Size | Line height | Weights        | Use |
|-------------|------|-------------|----------------|-----|
| Headline 70 | 70px | 91px        | Regular, Medium, Bold | Hero headline |
| Headline 52 | 52px | —           | Regular, Medium, Bold | Large section titles |
| Headline 30 | 30px | 45px        | Regular, Medium, Bold | Section subheads, card titles |
| Headline 20 | 20px | 30px        | Regular, Medium, Bold | Small headings, card titles |

**Weights:** Regular = 400, Medium = 500, Bold = 700.

## Body text scale

| Style    | Font size | Line height | Weights    |
|----------|-----------|-------------|------------|
| Text 18  | 18px      | 32px        | Regular (400), Medium |
| Text 16  | 16px      | 28px        | Regular (400), Medium |
| Text 15  | 15px      | 26px        | Regular (400), Medium |
| Text 14  | 14px      | 24px        | Regular, Medium |

Use for body copy, descriptions, buttons, links, labels, and metadata.

## Tailwind usage

- **Font:** `font-sans` (DM Sans) is the default in `layout.tsx` via `font-sans` on `body`.
- **Weights:** `font-normal` (400), `font-medium` (500), `font-bold` (700).
- **Headlines:** Use arbitrary values or existing design-system classes, e.g.:
  - Hero: `text-[70px] leading-[91px] font-bold`
  - Section: `text-[40px] leading-[45px] font-bold` or `text-[30px] leading-[45px] font-medium`
- **Body:** e.g. `text-[15px] leading-[26px]`, `text-[14px] leading-[24px]`, `text-[16px] leading-[28px]`, `text-[18px] leading-[32px]`.

## Implementation

- DM Sans is loaded in `app/layout.tsx` with `next/font` (weights 400, 500, 700).
- Tailwind `theme.extend.fontFamily.sans` uses `var(--font-dm-sans)`.
- No code change required to “use this font”; it is already the default. Use the scales above for new components.
