import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme; // user preference
  effective: 'light' | 'dark'; // applied theme
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

  // Media query for system theme
  const getSystem = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [system, setSystem] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' ? getSystem() : 'light'));

  // Listen to system changes only when theme === 'system'
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystem(mq.matches ? 'dark' : 'light');
    handler();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effective = theme === 'system' ? system : theme;

  // Apply theme to <html> and persist preference
  useEffect(() => {
    const isDark = effective === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [effective, theme]);

  const toggle = () => {
    // When on system, toggle to explicit opposite of current effective
    if (theme === 'system') {
      setTheme(effective === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const value = useMemo(() => ({ theme, effective, setTheme, toggle }), [theme, effective]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
