/**
 * Vrocure branding kit — logo variants and social links.
 * Use these so logo and socials stay consistent across the app.
 */

const BRAND_BASE = '/logos';

/** Logo mark SVGs for different backgrounds. Use the path as img src or in getLogoForBackground(). */
export const VROCURE_LOGOS = {
  /** White mark — use on dark backgrounds (slate-900, black, dark blue). */
  light: `${BRAND_BASE}/vrocure-mark-light.svg`,
  /** Dark slate mark — use on light backgrounds (white, gray-50, light pages). */
  dark: `${BRAND_BASE}/vrocure-mark-dark.svg`,
  /** Brand orange (#FF6B35) — use on light backgrounds for primary brand presence. */
  orange: `${BRAND_BASE}/vrocure-mark-orange.svg`,
  /** Slate gray — use when you need a subtle or secondary logo. */
  slate: `${BRAND_BASE}/vrocure-mark-slate.svg`,
};

/**
 * Returns the logo path that works best on the given background.
 * @param {'light' | 'dark'} background - 'light' = white/light gray bg, 'dark' = dark/slate bg
 * @param {'primary' | 'subtle'} variant - 'primary' = bold (orange on light, white on dark), 'subtle' = muted
 */
export function getLogoForBackground(background, variant = 'primary') {
  if (background === 'dark') return variant === 'subtle' ? VROCURE_LOGOS.slate : VROCURE_LOGOS.light;
  return variant === 'subtle' ? VROCURE_LOGOS.slate : VROCURE_LOGOS.orange;
}

/** Brand orange hex (use for non-Tailwind contexts). */
export const VROCURE_BRAND_ORANGE = '#FF6B35';

/** Favicon and iOS icons for Vrocure (vrocure.co.uk + portal). Theme-reactive. */
export const VROCURE_FAVICON = '/logos/vrocure-mark-dark.svg';
export const VROCURE_APPLE_TOUCH_LIGHT = '/logos/apple-touch-icon-light.svg';
export const VROCURE_APPLE_TOUCH_DARK = '/logos/apple-touch-icon-dark.svg';

/** Default social links. Replace with real URLs when you have profiles. */
export const VROCURE_SOCIALS = [
  { id: 'twitter', label: 'X (Twitter)', href: 'https://twitter.com/vrocure', icon: 'x' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/vrocure', icon: 'linkedin' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@vrocure', icon: 'youtube' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/rajzala2191/RZGB', icon: 'github' },
];
