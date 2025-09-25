"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TokenManager from './TokenManager';

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
    <div className="p-7 rounded-lg bg-gray-50">
      <div>
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
          <span className="text-gray-800">Scurry</span>
        </h1>
        <p className="mt-2 text-gray-500">A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks books & audiobooks into qBittorrent</p>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowTokenManager(!showTokenManager)}
            className={`py-2 px-4 rounded font-semibold transition-colors cursor-pointer ${
              mamTokenExists 
                ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
            }`}
            title={mamTokenExists ? 'Manage MAM Token' : 'MAM Token Missing - Click to Add'}
          >
            🔑 {mamTokenExists ? 'Token' : 'Add Token'}
          </button>
          
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded cursor-pointer"
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