import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { effective, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={`Switch to ${effective === 'dark' ? 'light' : 'dark'} mode`}
      className="relative w-9 h-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition"
    >
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500" style={{ opacity: effective === 'dark' ? 1 : 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-300 animate-pulse">
          <path d="M12 2l1.5 3 3 .5-2.25 2.2.55 3.2L12 9.8 9.2 10.9l.55-3.2L7.5 5.5l3-.5L12 2z" />
          <circle cx="18" cy="6" r="1" />
          <circle cx="5" cy="8" r="1" />
          <circle cx="16" cy="14" r="1" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500" style={{ opacity: effective === 'light' ? 1 : 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-blue-700">
          <circle cx="12" cy="10" r="3" fill="#fde68a" stroke="none" />
          <path d="M6 15a3 3 0 0 1 2.8-2 4 4 0 0 1 7.2 1h.5a2.5 2.5 0 1 1 0 5H7a3 3 0 0 1-1-4z" fill="#e6f0ff" stroke="none" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-cyan-500/20 dark:from-blue-400/10 dark:to-cyan-400/10" />
    </button>
  );
}