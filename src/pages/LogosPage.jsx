/**
 * View all logo assets locally. Open /logos in the app (no auth required).
 */

import React from 'react';
import { VROCURE_LOGOS, VROCURE_FAVICON, VROCURE_APPLE_TOUCH_LIGHT, VROCURE_APPLE_TOUCH_DARK } from '@/lib/vrocureBranding';
import { RZGB_FAVICON, RZGB_APPLE_TOUCH_LIGHT, RZGB_APPLE_TOUCH_DARK, RZGB_LOGO_URL } from '@/lib/rzgbBranding';

const SECTION = 'mb-10';
const TITLE = 'text-lg font-bold text-slate-800 dark:text-slate-200 mb-3';
const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';
const CARD = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col items-center';
const IMG_WRAP = 'w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 overflow-hidden';
const LABEL = 'text-xs font-medium text-slate-600 dark:text-slate-400 text-center break-all';

function LogoCard({ src, label, path }) {
  return (
    <div className={CARD}>
      <div className={IMG_WRAP}>
        <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
      </div>
      <span className={LABEL}>{label}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate w-full text-center" title={path}>{path}</span>
    </div>
  );
}

export default function LogosPage() {
  const vrocureMarks = [
    { src: VROCURE_LOGOS.light, label: 'Vrocure mark (light)', path: VROCURE_LOGOS.light },
    { src: VROCURE_LOGOS.dark, label: 'Vrocure mark (dark)', path: VROCURE_LOGOS.dark },
    { src: VROCURE_LOGOS.orange, label: 'Vrocure mark (orange)', path: VROCURE_LOGOS.orange },
    { src: VROCURE_LOGOS.slate, label: 'Vrocure mark (slate)', path: VROCURE_LOGOS.slate },
  ];
  const vrocureIcons = [
    { src: VROCURE_FAVICON, label: 'Vrocure favicon (with bg, visible on any tab)', path: VROCURE_FAVICON },
    { src: VROCURE_APPLE_TOUCH_LIGHT, label: 'Vrocure iOS (light)', path: VROCURE_APPLE_TOUCH_LIGHT },
    { src: VROCURE_APPLE_TOUCH_DARK, label: 'Vrocure iOS (dark)', path: VROCURE_APPLE_TOUCH_DARK },
  ];
  const rzgbIcons = [
    { src: RZGB_FAVICON, label: 'RZ Global favicon', path: RZGB_FAVICON },
    { src: RZGB_LOGO_URL, label: 'RZ Global logo', path: RZGB_LOGO_URL },
    { src: RZGB_APPLE_TOUCH_LIGHT, label: 'RZ Global iOS (light)', path: RZGB_APPLE_TOUCH_LIGHT },
    { src: RZGB_APPLE_TOUCH_DARK, label: 'RZ Global iOS (dark)', path: RZGB_APPLE_TOUCH_DARK },
  ];
  const social = [
    { src: '/logos/og-image.svg', label: 'OG / Twitter card (1200×630)', path: '/logos/og-image.svg' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">All logos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Preview every logo asset used in the app. Paths are from <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">vrocureBranding.js</code> and <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">rzgbBranding.js</code>.</p>

        <section className={SECTION}>
          <h2 className={TITLE}>Vrocure — mark variants</h2>
          <div className={GRID}>
            {vrocureMarks.map((item) => (
              <LogoCard key={item.path} src={item.src} label={item.label} path={item.path} />
            ))}
          </div>
        </section>

        <section className={SECTION}>
          <h2 className={TITLE}>Vrocure — favicon &amp; iOS</h2>
          <div className={GRID}>
            {vrocureIcons.map((item) => (
              <LogoCard key={item.path} src={item.src} label={item.label} path={item.path} />
            ))}
          </div>
        </section>

        <section className={SECTION}>
          <h2 className={TITLE}>RZ Global Solutions</h2>
          <div className={GRID}>
            {rzgbIcons.map((item) => (
              <LogoCard key={item.path} src={item.src} label={item.label} path={item.path} />
            ))}
          </div>
        </section>

        <section className={SECTION}>
          <h2 className={TITLE}>Social share image</h2>
          <div className={GRID}>
            {social.map((item) => (
              <div key={item.path} className={CARD + ' col-span-full sm:col-span-2'}>
                <div className="w-full max-w-sm aspect-[1200/630] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 overflow-hidden">
                  <img src={item.src} alt={item.label} className="w-full h-full object-contain" />
                </div>
                <span className={LABEL}>{item.label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate w-full text-center" title={item.path}>{item.path}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
