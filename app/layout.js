export const metadata = {
  title: "Scurry",
  description: "A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent"
};

import "./styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
