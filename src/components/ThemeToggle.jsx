import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const MODES = [
  { value: 'light',  label: 'Light',  Icon: Sun     },
  { value: 'dark',   label: 'Dark',   Icon: Moon    },
  { value: 'system', label: 'System', Icon: Monitor },
];

export const ThemeToggle = () => {
  const { isDark, themeMode, setThemeMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ActiveIcon = themeMode === 'system' ? Monitor : isDark ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg transition-all duration-200 border"
        style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
          e.currentTarget.style.color = isDark ? '#fff' : '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
          e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        }}
        title="Theme"
        aria-label="Toggle theme"
      >
        <ActiveIcon size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl py-1 shadow-xl border z-[100]"
          style={{
            background: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          {MODES.map(({ value, label, Icon }) => {
            const active = themeMode === value;
            return (
              <button
                key={value}
                onClick={() => { setThemeMode(value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                style={{
                  background: active
                    ? isDark ? 'rgba(255,107,53,0.1)' : 'rgba(255,107,53,0.08)'
                    : 'transparent',
                  color: active
                    ? '#FF6B35'
                    : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.color = isDark ? '#fff' : '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
                  }
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
                {active && <Check size={14} className="ml-auto text-orange-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
