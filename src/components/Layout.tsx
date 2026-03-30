import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromSupabase, saveToSupabase, subscribeToStoreChanges } from '../lib/sync';
import { useDynamicFavicon } from '../lib/favicon';
import { useTotalAssets } from '../store/useStore';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: '🏠' },
  { path: '/salary', label: 'Salary & Tax', icon: '💰' },
  { path: '/family-income', label: 'Family Income', icon: '👨‍👩‍👧' },
  { path: '/expenses', label: 'Expenses', icon: '📊' },
  { path: '/emi', label: 'EMI Calculator', icon: '🏦' },
  { path: '/prepayment', label: 'Prepayment', icon: '⚡' },
  { path: '/assets', label: 'Income & Assets', icon: '📈' },
];

export default function Layout() {
  const { darkMode, toggleDarkMode } = useStore();
  const totalAssets = useTotalAssets();
  useDynamicFavicon(totalAssets);
  const [user, setUser]     = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const navigate            = useNavigate();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Auth state + initial load
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setSyncing(true);
        loadFromSupabase().then(() => saveToSupabase()).finally(() => setSyncing(false));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setSyncing(true);
        loadFromSupabase().then(() => saveToSupabase()).finally(() => setSyncing(false));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Subscribe to store changes → debounced save
  useEffect(() => {
    if (!supabase || !user) return;
    const unsub = subscribeToStoreChanges();
    return unsub;
  }, [user]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎯</span>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Target</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">₹3 Crore House Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {supabase && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  {syncing ? '⟳ Syncing…' : '✓ Synced'}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1"
                  title={`Signed in as ${user.email}`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
              >
                Sign in to sync
              </button>
            )
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            title="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-4 gap-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile nav */}
          <div className="md:hidden flex overflow-x-auto bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 gap-1 sticky top-14 z-20">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
