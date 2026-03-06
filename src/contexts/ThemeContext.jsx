import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'rz-portal-theme-v2'; // v2 wipes any stored old dark preference

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      // Remove old key so previous dark-mode users get light by default
      localStorage.removeItem('rz-portal-theme');
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
    }
    return false; // Default to light
  });

  // Apply theme on mount and whenever isDark changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light');
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
      document.body.style.colorScheme = 'dark';
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.style.colorScheme = 'light';
      document.body.style.colorScheme = 'light';
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
