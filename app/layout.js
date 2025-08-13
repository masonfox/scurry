import React from "react";
export const metadata = {
  title: "Scurry",
  description: "A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent",
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
