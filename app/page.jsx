"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MessageBanner from './MessageBanner';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import SearchResultsList from './components/SearchResultsList';

const DEFAULT_CATEGORY = process.env.NEXT_PUBLIC_DEFAULT_CATEGORY ?? "books";

function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  // search category: 'books' | 'audiobooks'
  const [searchCategory, setSearchCategory] = useState("books");
  // message: { type: 'info' | 'error' | 'success', text: string }
  const [message, setMessage] = useState(null);
  const [mamTokenExists, setMamTokenExists] = useState(false); // default false until we check
  const [tokenLoading, setTokenLoading] = useState(true); // loading state for token check
  const searchParams = useSearchParams();

  // Load saved category from localStorage on mount
  useEffect(() => {
    const savedCategory = localStorage.getItem('scurry_search_category');
    if (savedCategory && (savedCategory === 'books' || savedCategory === 'audiobooks')) {
      setSearchCategory(savedCategory);
    }
  }, []);

  const doSearch = useCallback(async (e) => {
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
  }, [q, searchCategory]); // Dependencies ensure fresh values

  // Save category to localStorage whenever it changes
  const handleCategoryChange = (newCategory) => {
    setSearchCategory(newCategory);
    setResults([]);
    setMessage(null);
    localStorage.setItem('scurry_search_category', newCategory);
  };

  // Auto-search when category changes (if there's a query)
  useEffect(() => {
    if (q.trim() && searchCategory) {
      doSearch();
    }
  }, [searchCategory, doSearch, q]); // Re-run when category

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
    checkTokenExists();
  }, []);

  const checkTokenExists = () => {
    setTokenLoading(true);
    fetch("/api/mam-token")
      .then((res) => res.json())
      .then((data) => setMamTokenExists(!!data.exists))
      .catch(() => setMamTokenExists(false))
      .finally(() => setTokenLoading(false));
  };

  const addItem = useCallback(async (item) => {
    setMessage(null);
    try {
      // Map search category to qBittorrent category
      const qbCategory = searchCategory === "audiobooks" ? "audiobooks" : "books";
      
      const res = await fetch(`/api/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          downloadUrl: item.downloadUrl,
          category: qbCategory
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Add failed");
      setMessage({ type: "success", text: `Queued: ${item.title}` });
      
      // Clear search and scroll to top
      setQ("");
      setResults([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Remove message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Add failed" });
    }
  }, [searchCategory]);

  const clearResults = useCallback(() => {
    setResults([]);
    setMessage(null);
  }, []);

  const handleTokenUpdate = (tokenExists) => {
    setMamTokenExists(tokenExists);
    // Clear any existing search results and messages when token changes
    if (tokenExists) {
      setResults([]);
      setMessage(null);
      setQ("");
    }
  };

  // Show loading spinner while checking token
  if (tokenLoading) {
    return (
      <main className="my-4 p-4 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Sniffing out the cheese... 🧀</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-4 p-4 w-full max-w-4xl mx-auto">
      <Header onTokenUpdate={handleTokenUpdate} mamTokenExists={mamTokenExists} />

      {!mamTokenExists ? (
        <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">MAM Token Required</h3>
              <p className="text-yellow-700">Please add your MAM session token using the &quot;Add Token&quot; button above to begin searching.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SearchForm
            q={q}
            setQ={setQ}
            searchCategory={searchCategory}
            onCategoryChange={handleCategoryChange}
            onSubmit={doSearch}
            loading={loading}
            onClearResults={clearResults}
          />

          {message && (
            <MessageBanner type={message.type} text={message.text} />
          )}

          <SearchResultsList
            results={results}
            onAddItem={addItem}
            loading={loading}
          />
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="my-4 p-4 w-full max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}

