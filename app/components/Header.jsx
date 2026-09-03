"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header({ onTokenUpdate, mamTokenExists }) {
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
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
            <a
              href={`https://github.com/masonfox/scurry/releases/tag/v${process.env.NEXT_PUBLIC_APP_VERSION ?? ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-normal text-gray-400 dark:text-zinc-500 ml-2.5 mt-2 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? '—'}
            </a>
          </h1>
          <ThemeToggle />
        </div>
        <p className="mt-2 text-gray-500 dark:text-zinc-400">A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks books & audiobooks into qBittorrent</p>
        
        <div className="mt-4 flex gap-3">
          <Link
            href={mamTokenExists ? "/settings" : "/settings?tab=token"}
            className={`py-2 px-4 rounded font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
              mamTokenExists 
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200' 
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/40 dark:hover:bg-orange-900/60 dark:text-orange-400'
            }`}
            title={mamTokenExists ? 'Settings' : 'MAM Token Missing - Click to configure'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            {mamTokenExists ? 'Settings' : 'Setup Required'}
          </Link>
          
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200 font-semibold py-2 px-4 rounded cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
