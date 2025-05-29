'use client';

import Link from 'next/link';
import { FiSearch, FiSettings } from 'react-icons/fi';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les problèmes d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-bold hidden sm:block">Ma Bibliothèque iCloud</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/search" className="p-2 rounded-full hover:bg-accent">
            <FiSearch className="h-5 w-5" />
          </Link>
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <MdOutlineLightMode className="h-5 w-5" />
              ) : (
                <MdOutlineDarkMode className="h-5 w-5" />
              )}
            </button>
          )}
          
          <Link href="/admin" className="p-2 rounded-full hover:bg-accent">
            <FiSettings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
