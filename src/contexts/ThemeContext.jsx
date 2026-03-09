import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always light — clear any previously stored dark preference
  useEffect(() => {
    localStorage.removeItem('rz-portal-theme');
    localStorage.removeItem('rz-portal-theme-v2');
    const html = document.documentElement;
    html.classList.remove('dark');
    html.classList.add('light');
    html.style.colorScheme = 'light';
    document.body.style.colorScheme = 'light';
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
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
