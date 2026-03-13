import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { isLandingDomain, getPortalUrl } from '@/lib/portalConfig';

const NAV_LINKS = [
  { label: 'Features',     href: '/landing',       section: 'features',  key: 'landing'      },
  { label: 'How It Works', href: '/how-it-works',  section: null,        key: 'how-it-works'  },
  { label: 'Pricing',      href: '/pricing',        section: null,        key: 'pricing'       },
  { label: 'Roadmap',      href: '/roadmap',        section: null,        key: 'roadmap'       },
];

export default function PublicNav({ activePage }) {
  const { isDark } = useTheme();
  const [scrolled,  setScrolled]  = useState(false);
  const [hidden,    setHidden]    = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Hide when scrolling down past 80px, show when scrolling up
      if (y > 80) {
        setHidden(y > lastY);
      } else {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (link) => {
    setMenuOpen(false);
    if (link.section && activePage === 'landing') {
      const el = document.getElementById(link.section);
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    if (isLandingDomain()) {
      window.location.href = getPortalUrl(link.section ? `${link.href}#${link.section}` : link.href);
      return;
    }
    if (link.section) {
      navigate(`${link.href}#${link.section}`);
    } else {
      navigate(link.href);
    }
  };

  const isActive = (link) => activePage === link.key;

  const navBg = scrolled
    ? isDark
      ? 'rgba(15,15,15,0.9)'
      : 'rgba(255,255,255,0.94)'
    : 'transparent';

  const navBorder = scrolled
    ? isDark
      ? '1px solid rgba(255,107,53,0.1)'
      : '1px solid rgba(0,0,0,0.08)'
    : '1px solid transparent';

  return (
    <motion.nav
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background:   navBg,
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: navBorder,
        boxShadow:    scrolled ? '0 1px 0 0 rgba(255,107,53,0.06)' : 'none',
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <Link to="/landing" className="flex items-center gap-2.5">
            <img
              src="/zaproc-logo-192.png"
              alt="Zaproc"
              className="h-8 w-8 object-contain rounded-lg transition-all"
            />
            <AnimatePresence>
            {!scrolled && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                className="hidden sm:flex flex-col leading-none gap-0.5 overflow-hidden"
              >
                <span className="text-base font-black tracking-tight transition-colors whitespace-nowrap" style={{ color: 'var(--heading)' }}>
                  Zaproc
                </span>
                <span className="text-[10px] font-medium transition-colors whitespace-nowrap" style={{ color: 'var(--caption)' }}>
                  by RZ Global Solutions
                </span>
              </motion.div>
            )}
            </AnimatePresence>
          </Link>
        </motion.div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              onClick={() => handleNavClick(link)}
              className="relative px-3 py-2 text-sm font-medium transition-colors group"
              style={{ color: isActive(link) ? 'var(--heading)' : 'var(--body)' }}
            >
              {link.label}
              {/* Hover underline */}
              <span
                className="absolute bottom-1 left-3 right-3 h-px rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                style={{ background: '#FF6B35', transform: 'scaleX(0)', transformOrigin: 'left' }}
              />
              {/* Active indicator */}
              {isActive(link) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute bottom-1 left-3 right-3 h-px rounded-full"
                  style={{ background: '#FF6B35' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {isLandingDomain() ? (
            <a
              href={getPortalUrl('/login')}
              className="hidden sm:block text-sm font-medium transition-colors px-3 py-2"
              style={{ color: 'var(--body)' }}
            >
              Sign In
            </a>
          ) : (
            <Link
              to="/login"
              className="hidden sm:block text-sm font-medium transition-colors px-3 py-2"
              style={{ color: 'var(--body)' }}
            >
              Sign In
            </Link>
          )}
          {isLandingDomain() ? (
            <a
              href={getPortalUrl('/request-demo')}
              className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: '#FF6B35',
                boxShadow: '0 2px 12px rgba(255,107,53,0.35)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,53,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF6B35'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(255,107,53,0.35)'; }}
            >
              Request Demo <ArrowRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <Link
              to="/request-demo"
              className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: '#FF6B35',
                boxShadow: '0 2px 12px rgba(255,107,53,0.35)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,53,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF6B35'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(255,107,53,0.35)'; }}
            >
              Request Demo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--body)' }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              background: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              borderTop: `1px solid rgba(255,107,53,0.12)`,
            }}
          >
            <div className="px-4 py-4 space-y-1">
              <div className="flex items-center justify-between py-2 mb-2" style={{ borderBottom: '1px solid var(--edge)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--caption)' }}>Navigation</span>
                <ThemeToggle />
              </div>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link)}
                  className="flex items-center w-full py-2.5 px-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: isActive(link) ? '#FF6B35' : 'var(--body)',
                    background: isActive(link) ? 'rgba(255,107,53,0.08)' : 'transparent',
                  }}
                >
                  {link.label}
                  {isActive(link) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--edge)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                {isLandingDomain() ? (
                  <>
                    <a
                      href={getPortalUrl('/login')}
                      className="flex w-full py-2.5 px-2 text-sm font-medium"
                      style={{ color: 'var(--body)' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </a>
                    <a
                      href={getPortalUrl('/request-demo')}
                      className="flex items-center justify-center gap-2 w-full mt-2 py-3 text-sm font-bold text-white rounded-xl"
                      style={{ background: '#FF6B35' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      Request Demo <ArrowRight className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex w-full py-2.5 px-2 text-sm font-medium"
                      style={{ color: 'var(--body)' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/request-demo"
                      className="flex items-center justify-center gap-2 w-full mt-2 py-3 text-sm font-bold text-white rounded-xl"
                      style={{ background: '#FF6B35' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      Request Demo <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
