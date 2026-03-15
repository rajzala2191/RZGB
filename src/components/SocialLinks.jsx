/**
 * Vrocure social links — configurable list with Lucide (and one inline X logo).
 * Edit VROCURE_SOCIALS in @/lib/vrocureBranding.js to change URLs or add/remove networks.
 */

import React from 'react';
import { Linkedin, Youtube, Github } from 'lucide-react';
import { VROCURE_SOCIALS } from '@/lib/vrocureBranding';

const ICON_MAP = {
  x: XIcon,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
};

function XIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function SocialLinks({ className = '', iconSize = 20, showLabels = false }) {
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`} role="list">
      {VROCURE_SOCIALS.map(({ id, label, href, icon: iconKey }) => {
        const Icon = ICON_MAP[iconKey] || null;
        if (!Icon) return null;
        return (
          <li key={id}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors"
              aria-label={label}
            >
              <Icon size={iconSize} className="shrink-0" />
              {showLabels && <span className="text-sm font-medium">{label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
