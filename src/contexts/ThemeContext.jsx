import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'rz-portal-theme-mode';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeToDOM(isDark) {
  const html = document.documentElement;
  html.classList.toggle('dark', isDark);
  html.classList.toggle('light', !isDark);
  const scheme = isDark ? 'dark' : 'light';
  html.style.colorScheme = scheme;
  document.body.style.colorScheme = scheme;
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeRaw] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch { /* private browsing */ }
    return 'light';
  });

  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  const isDark = useMemo(
    () => (themeMode === 'system' ? systemDark : themeMode === 'dark'),
    [themeMode, systemDark],
  );

  const setThemeMode = useCallback((mode) => {
    setThemeModeRaw(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      localStorage.removeItem('rz-portal-theme');
      localStorage.removeItem('rz-portal-theme-v2');
    } catch { /* quota / private browsing */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    applyThemeToDOM(isDark);
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.removeItem('rz-portal-theme');
      localStorage.removeItem('rz-portal-theme-v2');
    } catch { /* ignore */ }
  }, []);

  const value = useMemo(
    () => ({ isDark, themeMode, setThemeMode, toggleTheme }),
    [isDark, themeMode, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
