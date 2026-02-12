import React from "react";
import ThemeProvider from "./components/ThemeProvider";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" }, // pink-500
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a0a" }, // zinc-950
  ],
};

export const metadata = {
  title: "Scurry",
  description: "A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // "default" | "black" | "black-translucent"
    title: "Scurry",
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/apple-icon.png',
    apple: '/apple-icon.png',
  }
};

import "./styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('scurry_theme');
                  var isDark = theme === 'dark' || ((!theme || theme === 'auto') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-zinc-900 transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
