import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all duration-200 relative group"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {isDark ? (
          // Sun icon for dark mode (click to go light)
          <Sun 
            size={20} 
            className="text-amber-400 transition-all duration-200 absolute inset-0 group-hover:text-amber-300"
          />
        ) : (
          // Moon icon for light mode (click to go dark)
          <Moon 
            size={20} 
            className="text-slate-600 transition-all duration-200 absolute inset-0 group-hover:text-slate-500"
          />
        )}
      </div>
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-100 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
