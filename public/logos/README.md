# Vrocure logos — one folder for all logo assets

Everything you need in one place:

| File | Use when |
|------|----------|
| `vrocure-mark-light.svg` | **Dark backgrounds** (slate-900, black) — white mark |
| `vrocure-mark-dark.svg` | **Light backgrounds** (white, gray-50) — dark slate mark |
| `vrocure-mark-orange.svg` | **Light backgrounds** — brand orange (#FF6B35), primary emphasis |
| `vrocure-mark-slate.svg` | **Any background** — subtle/secondary (slate-500) |
| `og-image.svg` | **Social sharing** — 1200×630 Open Graph / Twitter card image |
| `apple-touch-icon-light.svg` | **iOS icon (light)** — 180×180, light background; used when system theme is light |
| `apple-touch-icon-dark.svg` | **iOS icon (dark)** — 180×180, dark background; used when system theme is dark |
| `apple-touch-icon-source.svg` | **iOS fallback** — single 180×180 source (dark); export to `public/apple-touch-icon.png` for fallback |

The site uses **theme-reactive** icons: `index.html` links light/dark SVGs with `media="(prefers-color-scheme: light|dark)"`. Fallback: `apple-touch-icon.png`. For best iOS support, export the two SVGs to PNG and point the same `media` links to those PNGs.

**In code:** `src/lib/vrocureBranding.js` — `VROCURE_LOGOS`, `getLogoForBackground('light'|'dark', 'primary'|'subtle')`  
**Social links:** same file — `VROCURE_SOCIALS`; component `@/components/SocialLinks`

URLs: use `/logos/vrocure-mark-light.svg` etc. (or full URL in production).
