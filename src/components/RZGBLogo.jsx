/**
 * RZ Global Solutions logo for rzglobalsolutions.co.uk.
 * Uses RZGB_LOGO_URL when set, otherwise the RZ mark.
 */

import { RZGB_SITE_NAME, RZGB_LOGO_URL } from '@/lib/rzgbBranding';

export default function RZGBLogo({ size = 36, className = '' }) {
  const s = size;
  if (RZGB_LOGO_URL) {
    return (
      <img
        src={RZGB_LOGO_URL}
        alt={RZGB_SITE_NAME}
        width={s}
        height={s}
        className={`rounded-xl object-contain flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0 ${className}`}
      style={{ width: s, height: s }}
      aria-hidden
    >
      <span className="text-white font-black text-sm leading-none">RZ</span>
    </div>
  );
}
