import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rz-portal-theme');
      return saved !== 'light';
    }
    return true; // Default to dark
  });

  // Apply theme on mount and whenever isDark changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light');
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
      document.body.style.colorScheme = 'dark';
      localStorage.setItem('rz-portal-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.style.colorScheme = 'light';
      document.body.style.colorScheme = 'light';
      localStorage.setItem('rz-portal-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

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
