"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

const modes = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    ),
  },
  {
    value: "auto",
    label: "Auto",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ),
  },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const current = modes.find((m) => m.value === theme) || modes[0];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
        aria-label="Change theme"
        aria-expanded={open}
      >
        {current.icon}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 py-1 z-50">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => {
                setTheme(mode.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                theme === mode.value
                  ? "bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
