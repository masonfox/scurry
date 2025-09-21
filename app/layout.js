import React from "react";
export const metadata = {
  title: "Scurry",
  description: "A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" }, // pink-500
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a0a" }, // zinc-950
  ],
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
