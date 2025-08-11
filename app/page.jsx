"use client";
import { useState } from "react";

const DEFAULT_CATEGORY = process.env.NEXT_PUBLIC_DEFAULT_CATEGORY ?? "books";

export default function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [message, setMessage] = useState(null);

  async function doSearch(e) {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setMessage(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      if (data.results.length === 0) {
        setMessage("No results found... Try a different search");
      }
      setResults(data.results || []);
    } catch (err) {
      setMessage(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function addItem(item) {
    setMessage(null);
    try {
      const res = await fetch(`/api/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl: item.downloadUrl,
          category
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Add failed");
      setMessage(`Queued: ${item.title}`);
      // clear search and scroll top
      setQ("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // remove message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setMessage(err?.message || "Add failed");
    }
  }

  // TODO: build a way to update the local token in secrets file for easy management

  return (
    <main className="my-5 p-4 w-full max-w-4xl mx-auto">
      <div className="p-8 bg-gray-100 rounded-lg">
        <h1 className="text-3xl font-bold" style={{ margin: 0, marginLeft: -8 }}> 
          <span className="mr-1">🐁</span>
          <span>Scurry</span>
        </h1>
        <p className="mt-2 text-gray-500">A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent</p>
      </div>
      <form onSubmit={doSearch} className="mt-5 flex gap-2">
        <input
          name="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search books..."
          className="block w-full rounded-md bg-white px-4 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 sm:text-sm/6"
        />
        <button className="rounded-md bg-pink-400 px-5 py-1.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 cursor-pointer" disabled={loading || !q.trim()}>{loading ? "Searching..." : "Search"}</button>
      </form>

      {message && <p className="my-5 p-4 bg-gray-100 rounded-md" style={{ border: "1px solid #eee" }} ><strong> {message}</strong></p>}

      {!loading && results.length === 0 && <p className="text-gray-500 mt-5">☝️ Try a search to see results...</p>}

      <ul className="list-none p-0 mt-6">
        {results.map((r) => (
          <li key={r.id} className="px-4 py-3 rounded-md border-2 border-gray-100 hover:border-pink-200 mb-4">
            <div className="flex justify-between items-center w-full gap-6">
              <div>
                {/* Basic torrent information */}
                <div>
                  <span style={{ fontWeight: '600' }}>{r.title}</span>
                  <span style={{ color: "#555" }}>
                    <span style={{ marginLeft: 4, marginRight: 4 }}>by</span>
                    <span>{r.author}</span>
                    {r.vip && <span style={{ marginLeft: 4 }}><img style={{ height: 14 }} src="https://cdn.myanonamouse.net/pic/vip.png" alt="VIP" /></span>}
                  </span>
                </div>
                {/* Torrent metadata */}
                <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
                  {r.size} • {r.filetypes} • {r.seeders} seeders • {r.downloads} downloads
                </div>
                {/* Determine if torrent has already been snatched */}
                {r.snatched && <div style={{ fontSize: 13, color: '#bf6952 ', fontWeight: '700', marginTop: 6 }}>
                   💩 Snatched Already!
                </div>}
              </div>
              {/* Torrent action buttons */}
              <div className="flex gap-4 items-center flex-col md:flex-row">
                <a className="text-pink-400 hover:text-pink-500" target="blank" href={ r.torrentUrl }>View</a>
                <button
                  className="rounded-md bg-pink-50 px-2.5 py-1.5 text-sm font-semibold text-pink-500 shadow-xs hover:bg-pink-100 cursor-pointer"
                  disabled={r.snatched}
                  onClick={() => addItem(r)}
                >
                  Download
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
