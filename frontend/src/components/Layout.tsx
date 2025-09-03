import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './UI';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import CloudBackdrop from './CloudBackdrop';
import NightSkyBackdrop from './NightSkyBackdrop';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { effective, toggle, theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();
  const isAdmin = user?.role === 'admin';
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 bg-[radial-gradient(1000px_600px_at_0%_0%,rgba(59,130,246,0.05),transparent_40%),radial-gradient(800px_500px_at_100%_0%,rgba(16,185,129,0.05),transparent_40%)] dark:bg-[radial-gradient(800px_500px_at_0%_0%,rgba(2,6,23,0.6),transparent_50%),radial-gradient(1000px_700px_at_100%_0%,rgba(2,6,23,0.5),transparent_50%),linear-gradient(180deg,#030712,#00010a)]">
      {/* Light and dark dynamic backdrops */}
      <CloudBackdrop opacity={0.24} />
      <NightSkyBackdrop density={110} opacity={0.5} aurora={true} />
      <header className="border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <Link to={user ? (isAdmin ? '/admin/dashboard' : '/student/dashboard') : '/'} className="flex items-center gap-3">
            <Logo withWordmark={true} />
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            {isAdmin ? (
              <>
                <NavLink to="/admin/dashboard" active={loc.pathname.startsWith('/admin/dashboard')}>Dashboard</NavLink>
                <NavLink to="/admin/exams" active={loc.pathname.startsWith('/admin/') && !loc.pathname.startsWith('/admin/dashboard')}>Manage</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/student/dashboard">Dashboard</NavLink>
                <NavLink to="/results">Results</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
              </>
            )}
            {/* Theme Toggle */}
            <div className="ml-2 relative"><ThemeToggle /></div>
            <div className="ml-2 text-sm text-gray-700 dark:text-gray-300 px-2 py-1 rounded bg-gray-100/70 dark:bg-gray-800/60">{user?.email}</div>
            <Button onClick={() => { logout(); navigate('/'); }}>Logout</Button>
          </nav>
        </div>
      </header>
      <main className="container py-6">
        {/* Decorative underlay for admin to add subtle depth */}
        {isAdmin && (
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-30">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-blue-500/5" />
            <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl bg-emerald-500/5" />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, children, active }: { to: string; children: ReactNode; active?: boolean }) {
  return (
    <Link
      to={to}
  className={`px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
    >
      {children}
    </Link>
  );
}

export default Layout;