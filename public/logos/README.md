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
| `rz-global-apple-touch-light.svg` | **RZ Global iOS (light)** — 180×180 for rzglobalsolutions.co.uk when system theme is light |
| `rz-global-apple-touch-dark.svg` | **RZ Global iOS (dark)** — 180×180 for rzglobalsolutions.co.uk when system theme is dark |

**Domain-aware favicons:** `FaviconSwitcher` (in App) sets favicon + theme-reactive iOS icons by hostname: **rzglobalsolutions.co.uk** → RZ Global favicon + RZ Global apple-touch (light/dark); **vrocure.co.uk** and **portal** → Vrocure favicon + Vrocure apple-touch (light/dark).

**In code:** `src/lib/vrocureBranding.js` — `VROCURE_LOGOS`, `getLogoForBackground('light'|'dark', 'primary'|'subtle')`; `src/lib/rzgbBranding.js` — RZ Global favicon + apple-touch paths.  
**Social links:** `vrocureBranding.js` — `VROCURE_SOCIALS`; component `@/components/SocialLinks`

URLs: use `/logos/...` (or full URL in production).
