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
  const [mamTokenExists, setMamTokenExists] = useState(true); // default true for SSR hydration
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
  }, [searchCategory]); // Re-run when category

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

  // TODO: build a way to update the local token in secrets file for easy management

  return (
    <main className="my-4 p-4 w-full max-w-4xl mx-auto">
      <Header />

      {!mamTokenExists ? (
        <MessageBanner
          type="error"
          text={"Missing MAM API Token! Please add your MAM API token. See docs."}
        />
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

