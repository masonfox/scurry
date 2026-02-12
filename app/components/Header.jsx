"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TokenManager from './TokenManager';
import ThemeToggle from './ThemeToggle';

export default function Header({ onTokenUpdate, mamTokenExists }) {
  const [showTokenManager, setShowTokenManager] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleTokenUpdate = (tokenExists) => {
    onTokenUpdate?.(tokenExists);
    // Auto-hide token manager after successful token addition
    if (tokenExists && !mamTokenExists) {
      setShowTokenManager(false);
    }
  };

  return (
    <div className="p-7 rounded-lg bg-gray-50 dark:bg-zinc-800">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center -ml-1">
            <span className="mr-1">
              <Image
                src="/images/logo.png"
                alt="Scurry Logo"
                width={36}
                height={36}
                style={{ display: 'inline', verticalAlign: 'middle', height: 36 }}
                priority
                unoptimized
              />
            </span>
            <span className="text-gray-800 dark:text-zinc-100">Scurry</span>
          </h1>
          <ThemeToggle />
        </div>
        <p className="mt-2 text-gray-500 dark:text-zinc-400">A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks books & audiobooks into qBittorrent</p>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowTokenManager(!showTokenManager)}
            className={`py-2 px-4 rounded font-semibold transition-colors cursor-pointer ${
              mamTokenExists 
                ? 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-400' 
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/40 dark:hover:bg-orange-900/60 dark:text-orange-400'
            }`}
            title={mamTokenExists ? 'Manage MAM Token' : 'MAM Token Missing - Click to Add'}
          >
            🔑 {mamTokenExists ? 'Token' : 'Add Token'}
          </button>
          
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200 font-semibold py-2 px-4 rounded cursor-pointer"
          >
            Logout
          </button>
        </div>

        {showTokenManager && (
          <div className="mt-6">
            <TokenManager onTokenUpdate={handleTokenUpdate} />
          </div>
        )}
      </div>
    </div>
  );
}
