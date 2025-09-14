"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from 'next/image'
import MessageBanner from './MessageBanner'

const DEFAULT_CATEGORY = process.env.NEXT_PUBLIC_DEFAULT_CATEGORY ?? "books";

function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  // search category: 'books' | 'audiobooks'
  const [searchCategory, setSearchCategory] = useState("books");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  // message: { type: 'info' | 'error' | 'success', text: string }
  const [message, setMessage] = useState(null);
  const [mamTokenExists, setMamTokenExists] = useState(true); // default true for SSR hydration
  const searchInputRef = useRef(null);
  const searchParams = useSearchParams();

  // Load saved category from localStorage on mount
  useEffect(() => {
    const savedCategory = localStorage.getItem('scurry_search_category');
    if (savedCategory && (savedCategory === 'books' || savedCategory === 'audiobooks')) {
      setSearchCategory(savedCategory);
    }
  }, []);

  // Save category to localStorage whenever it changes
  const handleCategoryChange = (newCategory) => {
    setSearchCategory(newCategory);
    setResults([]);
    setMessage(null);
    localStorage.setItem('scurry_search_category', newCategory);
    
    // If there's a search query, automatically trigger a search with the new category change
    if (q.trim()) {
      doSearch();
    }
  };

  // Check for query parameter and auto-fill search field
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setQ(queryParam);
      // Remove the query parameter from URL after setting the search field
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams]);

  // Check if MAM token file exists on mount
  useEffect(() => {
    fetch("/api/mam-token-exists")
      .then((res) => res.json())
      .then((data) => setMamTokenExists(!!data.exists))
      .catch(() => setMamTokenExists(false));
  }, []);

  async function doSearch(e) {
    e?.preventDefault();
    setLoading(true);
    setResults([]);
    setMessage(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(searchCategory)}`);
      const data = await res.json();
      if (!res.ok) {
        // Handle specific token expiration error with dynamic message
        if (data.tokenExpired) {
          throw new Error(`🔑 ${data.error}`);
        }
        throw new Error(data?.error || "Search failed");
      }
      if (data.results.length === 0) {
        setMessage({ type: "info", text: "No results found... Try a different search" });
      }
      setResults(data.results || []);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Search failed" });
    } finally {
      setLoading(false);
    }
  }

  async function addItem(item) {
    setMessage(null);
    try {
      // Map search category to qBittorrent category
      const qbCategory = searchCategory === "audiobooks" ? "audiobooks" : "books";
      
      const res = await fetch(`/api/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl: item.downloadUrl,
          category: qbCategory
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Add failed");
      setMessage({ type: "success", text: `Queued: ${item.title}` });
      // clear search and scroll top
      setQ("");
      setResults([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      // remove message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Add failed" });
    }
  }

  // TODO: build a way to update the local token in secrets file for easy management

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <main className="my-4 p-4 w-full max-w-4xl mx-auto">
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
          <button
            onClick={handleLogout}
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded cursor-pointer"
          >
          Logout
        </button>
        </div>
      </div>

      {!mamTokenExists ? (
        <MessageBanner
          type="error"
          text={"Missing MAM API Token! Please add your MAM API token. See docs."}
        />
      ) : (
        <>
          <form onSubmit={doSearch} className="mt-5 flex flex-col sm:flex-row gap-2 relative">
            <div className="relative w-full flex flex-col sm:flex-row">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  name="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${searchCategory}...`}
                  className="block w-full rounded-md sm:rounded-l-md sm:rounded-r-none bg-white px-4 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 sm:text-sm/6 pr-10"
                />
                {q && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQ("");
                      setResults([]);
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 focus:outline-none"
                    style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <select
                value={searchCategory}
                onChange={(e) => {
                  handleCategoryChange(e.target.value);
                }}
                className="bg-gray-100 border-t border-gray-200 sm:border-t-0 sm:border-l px-3 py-2.5 mt-2 sm:mt-0 text-sm text-gray-700 rounded-md sm:rounded-l-none sm:rounded-r-md outline-1 -outline-offset-1 outline-gray-200 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 cursor-pointer w-full sm:w-auto sm:min-w-36 appearance-none bg-no-repeat bg-right bg-[length:16px_16px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="books">📚 Books</option>
                <option value="audiobooks">🎧 Audiobooks</option>
              </select>
            </div>
            <button className="rounded-md bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 cursor-pointer" disabled={loading || !q.trim()}>{loading ? "Searching..." : "Search"}</button>
          </form>

          {message && (
            <MessageBanner type={message.type} text={message.text} />
          )}

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
                        <span className="mx-1">by</span>
                        <span>{r.author}</span>
                      </span>
                      {r.vip && (
                          <span className="inline-flex ml-1 relative top-0.25">
                            <Image
                              src="https://cdn.myanonamouse.net/pic/vip.png"
                              alt="VIP"
                              width={14}
                              height={14}
                              style={{ height: 14 }}
                              unoptimized
                            />
                          </span>
                       )}
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
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}

