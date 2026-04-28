import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History as HistoryIcon, Settings as SettingsIcon, Palette, LineChart } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import PageTransition from './components/PageTransition';
import RouteLoader from './components/RouteLoader';
import { seedExerciseLibrary } from './progression/exerciseLibrarySeed';
import { cn } from './utils/ui';

// Lazy load route components for performance optimization
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LogSession = React.lazy(() => import('./components/LogSession'));
const History = React.lazy(() => import('./components/History'));
const ExerciseDetail = React.lazy(() => import('./components/ExerciseDetail'));
const Settings = React.lazy(() => import('./components/Settings'));
const ExerciseLibrary = React.lazy(() => import('./components/ExerciseLibrary'));
const Analysis = React.lazy(() => import('./components/Analysis'));

const AnimatedRoutes: React.FC<{ theme: string; selectTheme: (theme: string) => void }> = ({ theme, selectTheme }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteLoader />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/log" element={<PageTransition><LogSession /></PageTransition>} />
        <Route path="/history" element={<PageTransition><History /></PageTransition>} />
        <Route path="/library" element={<PageTransition><ExerciseLibrary /></PageTransition>} />
        <Route path="/analysis" element={<PageTransition><Analysis /></PageTransition>} />
        <Route path="/exercise/:name" element={<PageTransition><ExerciseDetail /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings theme={theme} selectTheme={selectTheme} /></PageTransition>} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'monochrome';
  });
  const [isStandalone, setIsStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    seedExerciseLibrary().catch(console.error);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => setIsStandalone(event.matches);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('dark'); // Keep for utility compatibility
    document.documentElement.setAttribute('data-display-mode', isStandalone ? 'standalone' : 'browser');

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themeColors: Record<string, string> = {
      monochrome: '#121212',
      jewel: '#080C10',
      amoled: '#000000'
    };
    themeMeta?.setAttribute('content', themeColors[theme] || themeColors.monochrome);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [theme, isStandalone]);

  const toggleTheme = () => {
    const themes = ['monochrome', 'jewel', 'amoled'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const selectTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <Router>
      <div className={cn(
        "relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-theme-bg-primary transition-colors duration-500 md:my-4 md:max-w-2xl md:rounded-[2rem] md:shadow-2xl",
        isStandalone && "standalone-shell"
      )}>
        <header className={cn(
          "glass sticky top-0 z-50 flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] shadow-sm backdrop-blur-xl",
          isStandalone && "border-b border-white/10 bg-theme-bg-primary/92"
        )}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-theme-accent shadow-lg shadow-blue-500/20">
               <BrandIcon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black leading-tight text-theme-text-primary sm:text-lg">SmartTracker</h1>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">
                {isStandalone ? (
                  <span className="flex items-center gap-1 text-theme-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-theme-accent"></span> Installed App
                  </span>
                ) : isOnline ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> Live System
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Offline Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-theme-bg-tertiary text-theme-text-primary transition-all active:scale-90"
            aria-label="Change theme"
          >
            <Palette size={18} />
          </button>
        </header>

        <main className={cn(
          "flex-grow px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4",
          isStandalone && "pb-[calc(7.25rem+env(safe-area-inset-bottom))]"
        )}>
           <AnimatedRoutes theme={theme} selectTheme={selectTheme} />
        </main>

        <nav 
          className={cn(
            "glass fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-md items-end justify-around gap-1 border-t border-white/10 px-2 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:max-w-2xl md:rounded-t-[2rem]",
            isStandalone && "bg-theme-bg-primary/96 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-14px_36px_rgba(0,0,0,0.28)]"
          )}
          role="navigation"
          aria-label="Main Navigation"
        >
          <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dash" />
          <NavLink to="/analysis" icon={<LineChart size={20} />} label="Stats" />
          <NavLink to="/log" icon={<PlusCircle size={20} />} label="Log" />
          <NavLink to="/history" icon={<HistoryIcon size={20} />} label="History" />
          <NavLink to="/settings" icon={<SettingsIcon size={20} />} label="Setup" />
        </nav>
      </div>
    </Router>
  );
};

// Internal icon component to avoid name conflict with lucide-react Activity
const BrandIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-300",
        isActive
          ? "text-theme-accent"
          : "text-theme-text-tertiary hover:text-theme-text-secondary"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <div className={cn(
        "transition-all duration-300",
        isActive ? "scale-110 -translate-y-0.5" : ""
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-black uppercase tracking-[0.14em] transition-all",
        isActive ? "opacity-100" : "opacity-70"
      )}>{label}</span>
      {isActive && (
        <m.span
          layoutId="nav-dot"
          className="absolute right-4 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"
        ></m.span>
      )}
    </Link>
  );
};

export default App;
