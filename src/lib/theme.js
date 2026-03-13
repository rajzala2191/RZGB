/**
 * Central theme constants & helpers.
 *
 * Every colour in the app should trace back to either:
 *   1. A CSS variable defined in index.css  (preferred — auto-switches with theme)
 *   2. A constant exported from this file    (for values that never change)
 *
 * Components use `var(--token)` in inline styles or the Tailwind semantic
 * classes (bg-surface, text-heading, border-edge, etc.) so that changing
 * the theme means editing ONE place — the :root / :root.light blocks in
 * index.css — instead of hunting through dozens of files.
 */

export const ACCENT      = 'var(--brand)';
export const ACCENT_GLOW = 'var(--brand-glow)';

/**
 * Sidebar token object consumed by ControlCentreLayout,
 * ClientDashboardLayout and SupplierHubLayout.
 *
 * Every value is a CSS variable reference, so it reacts to theme changes
 * without any JS-level isDark branching.
 */
export const SIDEBAR = {
  bg:            'var(--sidebar-bg)',
  border:        'var(--sidebar-border)',
  labelColor:    'var(--sidebar-label)',
  navInactive:      'var(--sidebar-nav-text)',
  navHoverBg:       'var(--sidebar-nav-hover-bg)',
  navHoverText:     'var(--sidebar-nav-hover-text)',
  navActiveBg:      'var(--sidebar-nav-active-bg)',
  navActiveBorder:  'var(--sidebar-nav-active-border)',
  navActiveText:    'var(--sidebar-nav-active-text)',
  navActiveIconBg:  'var(--sidebar-nav-active-icon-bg)',
  navActiveIconColor:'var(--sidebar-nav-active-icon-color)',
  iconBg:           'var(--sidebar-icon-bg)',
  iconColor:        'var(--sidebar-icon-color)',
  cardBg:        'var(--sidebar-card-bg)',
  cardBorder:    'var(--sidebar-card-border)',
  nameColor:     'var(--sidebar-name)',
  emailColor:    'var(--sidebar-email)',
  btnBg:         'var(--sidebar-btn-bg)',
  btnBorder:     'var(--sidebar-btn-border)',
  btnColor:      'var(--sidebar-btn-color)',
  btnHoverBg:    'var(--sidebar-btn-hover-bg)',
  btnHoverColor: 'var(--sidebar-btn-hover-color)',
  mobileBtnBg:   'var(--sidebar-mobile-bg)',
};

/** Header bar tokens. */
export const HEADER = {
  bg:        'var(--header-bg)',
  border:    'var(--header-border)',
  btnBg:     'var(--header-btn-bg)',
  btnBorder: 'var(--header-btn-border)',
  btnColor:  'var(--header-btn-color)',
};

/** Toast popup tokens. */
export const TOAST = {
  bg:            'var(--toast-bg)',
  border:        'var(--toast-border)',
  titleColor:    'var(--toast-title)',
  descColor:     'var(--toast-desc)',
  closeBg:       'var(--toast-close-bg)',
  closeColor:    'var(--toast-close-color)',
  closeHover:    'var(--toast-close-hover)',
  closeHoverBg:  'var(--toast-close-hover-bg)',
};

/**
 * Inline-style surface tokens for components that can't use Tailwind
 * classes (e.g. OrderTimeline, MilestoneUpdater).
 *
 * All values are CSS var() references — no isDark branching needed.
 */
export const SURFACE = {
  bg:         'var(--surface)',
  raised:     'var(--surface-raised)',
  inset:      'var(--surface-inset)',
  heading:    'var(--heading)',
  body:       'var(--body)',
  caption:    'var(--caption)',
  faint:      'var(--faint)',
  edge:       'var(--edge)',
  edgeStrong: 'var(--edge-strong)',
  edgeSubtle: 'var(--edge-subtle)',
  appBg:      'var(--app-bg)',
};
