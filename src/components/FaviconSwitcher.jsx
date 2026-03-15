/**
 * Sets favicon and theme-reactive iOS app icons by domain.
 * - rzglobalsolutions.co.uk → RZ Global favicon + RZ Global apple-touch (light/dark)
 * - vrocure.co.uk + portal.vrocure.co.uk → Vrocure favicon + Vrocure apple-touch (light/dark)
 * Run once on app mount (e.g. in App.jsx).
 */

import { useEffect } from 'react';
import { isRZGBDomain } from '@/lib/portalConfig';
import {
  RZGB_FAVICON,
  RZGB_APPLE_TOUCH_LIGHT,
  RZGB_APPLE_TOUCH_DARK,
} from '@/lib/rzgbBranding';
import {
  VROCURE_FAVICON,
  VROCURE_APPLE_TOUCH_LIGHT,
  VROCURE_APPLE_TOUCH_DARK,
} from '@/lib/vrocureBranding';

function setFavicon(href, type) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
  link.type = type || (href.endsWith('.svg') ? 'image/svg+xml' : href.endsWith('.jpg') || href.endsWith('.jpeg') ? 'image/jpeg' : 'image/x-icon');
}

function setAppleTouch(lightHref, darkHref) {
  const light = document.querySelector('link[rel="apple-touch-icon"][media="(prefers-color-scheme: light)"]');
  const dark = document.querySelector('link[rel="apple-touch-icon"][media="(prefers-color-scheme: dark)"]');
  if (light) light.href = lightHref;
  else {
    const link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    link.sizes = '180x180';
    link.media = '(prefers-color-scheme: light)';
    link.href = lightHref;
    document.head.appendChild(link);
  }
  if (dark) dark.href = darkHref;
  else {
    const link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    link.sizes = '180x180';
    link.media = '(prefers-color-scheme: dark)';
    link.href = darkHref;
    document.head.appendChild(link);
  }
}

export default function FaviconSwitcher() {
  useEffect(() => {
    const isRZ = isRZGBDomain();
    const faviconHref = isRZ ? RZGB_FAVICON : VROCURE_FAVICON;
    const faviconType = isRZ ? 'image/jpeg' : 'image/svg+xml';
    setFavicon(faviconHref, faviconType);

    const appleLight = isRZ ? RZGB_APPLE_TOUCH_LIGHT : VROCURE_APPLE_TOUCH_LIGHT;
    const appleDark = isRZ ? RZGB_APPLE_TOUCH_DARK : VROCURE_APPLE_TOUCH_DARK;
    setAppleTouch(appleLight, appleDark);
  }, []);

  return null;
}
