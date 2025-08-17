"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Search', icon: '🔍' },
    { href: '/hardcover', label: 'Hardcover', icon: '📚' },
    { href: '/config', label: 'Config', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 mb-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="Scurry Logo"
              width={32}
              height={32}
              priority
              unoptimized
            />
            <span className="text-xl font-bold text-gray-800">Scurry</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Logout Button */}
          <button
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="hidden md:block bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm"
          >
            Logout
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {/* Hamburger icon */}
            <svg
              className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Close icon */}
            <svg
              className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            {/* Mobile Logout Button */}
            <button
              onClick={async () => {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
