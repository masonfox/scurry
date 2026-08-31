"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MessageBanner from './MessageBanner';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import SearchResultsList from './components/SearchResultsList';
import DualSearchResultsList from './components/DualSearchResultsList';
import SequentialSearchResults from './components/SequentialSearchResults';
import UserStatsBar from './components/UserStatsBar';
import DownloadReviewModal from './components/DownloadReviewModal';

const SUCCESS_MESSAGE_DURATION_MS = 5000;

function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  // search category: 'books' | 'audiobooks' | 'both'
  const [searchCategory, setSearchCategory] = useState("books");
  // message: { type: 'info' | 'error' | 'success', text: string }
  const [message, setMessage] = useState(null);
  const [mamTokenExists, setMamTokenExists] = useState(false); // default false until we check
  const [tokenLoading, setTokenLoading] = useState(true); // loading state for token check
  const searchParams = useSearchParams();
  
  // User stats state
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  
  // Dual-mode state
  const [audiobookResults, setAudiobookResults] = useState([]);
  const [bookResults, setBookResults] = useState([]);
  const [selectedAudiobook, setSelectedAudiobook] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [dualDownloadLoading, setDualDownloadLoading] = useState(false);

  // Settings state (fetched from /api/settings for tag/category config)
  const [appSettings, setAppSettings] = useState(null);

  // Review modal state
  const [reviewItems, setReviewItems] = useState(null); // array of { result, category, useWedge, onToggleWedge }
  const [reviewLoading, setReviewLoading] = useState(false);

  // Load saved category from localStorage on mount
  useEffect(() => {
    const savedCategory = localStorage.getItem('scurry_search_category');
    if (savedCategory && (savedCategory === 'books' || savedCategory === 'audiobooks' || savedCategory === 'both')) {
      setSearchCategory(savedCategory);
    }
  }, []);

  // Track current search to handle concurrency
  const currentSearchRef = useRef(null);

  // Pure search function with proper concurrency handling
  const performSearch = useCallback(async (searchQuery, searchCategory, options = {}) => {
    if (!searchQuery?.trim()) return;
    
    const { immediate = false } = options;
    
    // Cancel any ongoing search
    if (currentSearchRef.current) {
      currentSearchRef.current.cancel = true;
    }
    
    // Create new search context with unique ID for debugging
    const searchContext = { 
      cancel: false, 
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: searchQuery,
      category: searchCategory
    };
    currentSearchRef.current = searchContext;
    
    setLoading(true);
    setResults([]);
    setAudiobookResults([]);
    setBookResults([]);
    setSelectedAudiobook(null);
    setSelectedBook(null);
    setMessage(null);
    
    try {
      // Handle "both" mode with parallel searches
      if (searchCategory === 'both') {
        const [audiobookRes, bookRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&category=audiobooks`),
          fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&category=books`)
        ]);
        
        // Check if this search was cancelled
        if (searchContext.cancel) {
          console.log(`Dual search ${searchContext.id} was cancelled`);
          return;
        }
        
        const [audiobookData, bookData] = await Promise.all([
          audiobookRes.json(),
          bookRes.json()
        ]);
        
        // Check again after async operation
        if (searchContext.cancel) {
          console.log(`Dual search ${searchContext.id} was cancelled after fetch`);
          return;
        }
        
        // Handle errors - check for token expiration first
        if (!audiobookRes.ok && audiobookData.tokenExpired) {
          throw new Error(`🔑 ${audiobookData.error}`);
        }
        if (!bookRes.ok && bookData.tokenExpired) {
          throw new Error(`🔑 ${bookData.error}`);
        }
        
        // Handle other API errors
        if (!audiobookRes.ok && !bookRes.ok) {
          // Both failed
          throw new Error(`Both searches failed. Audiobooks: ${audiobookData.error || 'Unknown error'}. Books: ${bookData.error || 'Unknown error'}`);
        } else if (!audiobookRes.ok) {
          // Only audiobook failed
          console.error(`Audiobook search failed: ${audiobookRes.status} ${audiobookRes.statusText}`, audiobookData);
          setMessage({ type: "error", text: `Audiobook search failed: ${audiobookData.error || audiobookRes.statusText}. Showing book results only.` });
        } else if (!bookRes.ok) {
          // Only book failed
          console.error(`Book search failed: ${bookRes.status} ${bookRes.statusText}`, bookData);
          setMessage({ type: "error", text: `Book search failed: ${bookData.error || bookRes.statusText}. Showing audiobook results only.` });
        }
        
        const audiobookResults = (!audiobookRes.ok) ? [] : (audiobookData.results || []);
        const bookResults = (!bookRes.ok) ? [] : (bookData.results || []);
        
        if (audiobookResults.length === 0 && bookResults.length === 0) {
          setMessage({ type: "info", text: "No results found in either category... Try a different search" });
        } else if (audiobookResults.length === 0) {
          setMessage({ type: "info", text: `No audiobooks found, but found ${bookResults.length} book(s)` });
        } else if (bookResults.length === 0) {
          setMessage({ type: "info", text: `No books found, but found ${audiobookResults.length} audiobook(s)` });
        }
        
        setAudiobookResults(audiobookResults);
        setBookResults(bookResults);
        console.log(`Dual search ${searchContext.id} completed: ${audiobookResults.length} audiobooks, ${bookResults.length} books`);
        
      } else {
        // Single category search (existing behavior)
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(searchCategory)}`);
        
        // Check if this search was cancelled
        if (searchContext.cancel) {
          console.log(`Search ${searchContext.id} was cancelled`);
          return;
        }
        
        const data = await res.json();
        
        // Check again after async operation
        if (searchContext.cancel) {
          console.log(`Search ${searchContext.id} was cancelled after fetch`);
          return;
        }
        
        if (!res.ok) {
          if (data.tokenExpired) {
            throw new Error(`🔑 ${data.error}`);
          }
          throw new Error(data?.error || "Search failed");
        }
        
        if (data.results.length === 0) {
          setMessage({ type: "info", text: "No results found... Try a different search" });
        }
        
        setResults(data.results || []);
        console.log(`Search ${searchContext.id} completed successfully with ${data.results?.length || 0} results`);
      }
      
    } catch (err) {
      if (!searchContext.cancel) {
        console.error(`Search ${searchContext.id} failed:`, err.message);
        setMessage({ type: "error", text: err?.message || "Search failed" });
      }
    } finally {
      if (!searchContext.cancel) {
        setLoading(false);
      }
    }
  }, []);

  // Form submission handler
  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault();
    performSearch(q, searchCategory);
  }, [q, searchCategory, performSearch]);

  // Category change handler with automatic re-search
  const handleCategoryChange = useCallback((newCategory) => {
    setSearchCategory(newCategory);
    setResults([]);
    setAudiobookResults([]);
    setBookResults([]);
    setSelectedAudiobook(null);
    setSelectedBook(null);
    setMessage(null);
    localStorage.setItem('scurry_search_category', newCategory);
    
    // Re-search immediately if there's an active query
    if (q.trim()) {
      performSearch(q, newCategory);
    }
  }, [q, performSearch]);

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

  // Fetch user stats when token exists
  useEffect(() => {
    if (mamTokenExists) {
      fetchUserStats();
    }
  }, [mamTokenExists]);

  // Fetch app settings (tags/categories config)
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings) {
          setAppSettings(data.settings);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const fetchUserStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/user-stats');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch user stats');
      }
      
      setUserStats(data.stats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // Single-mode: open review modal instead of downloading directly
  const openSingleReview = useCallback((item) => {
    const qbCategory = searchCategory === "audiobooks" ? "audiobooks" : "books";
    setReviewItems([{
      result: item,
      category: qbCategory,
      useWedge: false,
      onToggleWedge: () => {
        setReviewItems((prev) => {
          if (!prev) return prev;
          return prev.map((ri) =>
            ri.result.id === item.id ? { ...ri, useWedge: !ri.useWedge } : ri
          );
        });
      },
    }]);
  }, [searchCategory]);

  const clearResults = useCallback(() => {
    setResults([]);
    setAudiobookResults([]);
    setBookResults([]);
    setSelectedAudiobook(null);
    setSelectedBook(null);
    setMessage(null);
  }, []);

  // Dual-mode selection handlers
  const handleSelectAudiobook = useCallback((item) => {
    if (item?.snatched) return;
    setSelectedAudiobook(prev => 
      prev?.id === item?.id ? null : item
    );
  }, []);

  const handleSelectBook = useCallback((item) => {
    if (item?.snatched) return;
    setSelectedBook(prev => 
      prev?.id === item?.id ? null : item
    );
  }, []);

  // Dual-mode: open review modal with both items
  const openDualReview = useCallback(() => {
    if (!selectedAudiobook || !selectedBook) return;
    setReviewItems([
      {
        result: selectedBook,
        category: 'books',
        useWedge: false,
        onToggleWedge: () => {
          setReviewItems((prev) => {
            if (!prev) return prev;
            return prev.map((ri) =>
              ri.category === 'books' ? { ...ri, useWedge: !ri.useWedge } : ri
            );
          });
        },
      },
      {
        result: selectedAudiobook,
        category: 'audiobooks',
        useWedge: false,
        onToggleWedge: () => {
          setReviewItems((prev) => {
            if (!prev) return prev;
            return prev.map((ri) =>
              ri.category === 'audiobooks' ? { ...ri, useWedge: !ri.useWedge } : ri
            );
          });
        },
      },
    ]);
  }, [selectedAudiobook, selectedBook]);

  // Review modal: confirm download(s)
  const handleReviewConfirm = useCallback(async (items, perItemTags) => {
    setReviewLoading(true);
    setMessage(null);

    try {
      const isDual = items.length > 1;

      // Download all items in parallel
      const fetchPromises = items.map((item, i) =>
        fetch('/api/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.result.title,
            downloadUrl: item.result.downloadUrl,
            category: item.category,
            useWedge: item.useWedge,
            tags: perItemTags[i] || [],
          }),
        })
      );

      const responses = await Promise.all(fetchPromises);
      const dataList = await Promise.all(responses.map((r) => r.json()));

      // Evaluate results
      const results = items.map((item, i) => ({
        item,
        success: responses[i].ok && dataList[i].ok,
        error: dataList[i].error,
        data: dataList[i],
      }));

      const allSuccess = results.every((r) => r.success);
      const anyWedgeUsed = results.some((r) => r.item.useWedge && r.success);

      // Refresh stats if any wedge was used
      if (anyWedgeUsed) fetchUserStats();

      if (allSuccess) {
        const wedgeInfo = results
          .filter((r) => r.item.useWedge)
          .map((r) => isDual ? `${r.item.category} FL` : 'FL Wedge');
        const wedgeText = wedgeInfo.length > 0 ? ` (${wedgeInfo.join(', ')} applied)` : '';
        const allTags = [...new Set(perItemTags.flat())];
        const tagText = allTags.length > 0 ? ` [${allTags.join(', ')}]` : '';

        if (isDual) {
          setMessage({
            type: 'success',
            text: `Queued ${items.length} items: ${items.map((i) => i.result.title).join(' + ')}${wedgeText}${tagText}`,
          });
        } else {
          setMessage({
            type: 'success',
            text: `Queued: ${items[0].result.title}${wedgeText}${tagText}`,
          });
        }

        // Clear search and reset
        setQ('');
        setResults([]);
        setAudiobookResults([]);
        setBookResults([]);
        setSelectedAudiobook(null);
        setSelectedBook(null);
        setReviewItems(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => setMessage(null), SUCCESS_MESSAGE_DURATION_MS);
      } else {
        // Partial or full failure
        const successes = results.filter((r) => r.success);
        const failures = results.filter((r) => !r.success);

        if (successes.length > 0 && failures.length > 0) {
          const successText = successes.map((r) => r.item.result.title).join(', ');
          const failText = failures.map((r) => `${r.item.result.title}: ${r.error || 'Unknown error'}`).join('; ');
          setMessage({ type: 'error', text: `Queued: ${successText}. Failed: ${failText}` });
        } else {
          const failText = failures.map((r) => r.error || 'Unknown error').join('; ');
          throw new Error(failText);
        }

        setReviewItems(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Download failed' });
      setReviewItems(null);
    } finally {
      setReviewLoading(false);
    }
  }, [fetchUserStats]);

  // Review modal: cancel
  const handleReviewCancel = useCallback(() => {
    if (!reviewLoading) {
      setReviewItems(null);
    }
  }, [reviewLoading]);

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
            <p className="text-gray-600 dark:text-zinc-400">Sniffing out the cheese... 🧀</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-4 p-4 w-full max-w-4xl mx-auto">
      <Header onTokenUpdate={handleTokenUpdate} mamTokenExists={mamTokenExists} />

      {!mamTokenExists ? (
        <div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">MAM Token Required</h3>
              <p className="text-yellow-700 dark:text-yellow-400">Please add your MAM session token using the &quot;Add Token&quot; button above to begin searching.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <UserStatsBar 
            stats={userStats} 
            loading={statsLoading} 
            error={statsError} 
          />
          
          <SearchForm
            q={q}
            setQ={setQ}
            searchCategory={searchCategory}
            onCategoryChange={handleCategoryChange}
            onSubmit={handleSearchSubmit}
            loading={loading}
            onClearResults={clearResults}
          />

          {message && (
            <MessageBanner type={message.type} text={message.text} />
          )}

          {searchCategory === 'both' ? (
            <>
              {/* Desktop: side-by-side */}
              <div className="hidden md:block">
                <DualSearchResultsList
                  audiobookResults={audiobookResults}
                  bookResults={bookResults}
                  selectedAudiobook={selectedAudiobook}
                  selectedBook={selectedBook}
                  onSelectAudiobook={handleSelectAudiobook}
                  onSelectBook={handleSelectBook}
                  loading={loading}
                  onDownload={openDualReview}
                  downloadLoading={dualDownloadLoading}
                />
              </div>
              
              {/* Mobile: sequential with unified bottom sheet */}
              <div className="block md:hidden">
                <SequentialSearchResults
                  audiobookResults={audiobookResults}
                  bookResults={bookResults}
                  selectedAudiobook={selectedAudiobook}
                  selectedBook={selectedBook}
                  onSelectAudiobook={handleSelectAudiobook}
                  onSelectBook={handleSelectBook}
                  loading={loading}
                  onDownload={openDualReview}
                  downloadLoading={dualDownloadLoading}
                  hideBottomSheet={!!reviewItems}
                />
              </div>
            </>
          ) : (
            <SearchResultsList
              results={results}
              onAddItem={openSingleReview}
              loading={loading}
            />
          )}

          {/* Download Review Modal */}
          {reviewItems && (
            <DownloadReviewModal
              items={reviewItems}
              userStats={userStats}
              settings={appSettings}
              onConfirm={handleReviewConfirm}
              onCancel={handleReviewCancel}
              loading={reviewLoading}
            />
          )}
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
          <div className="h-32 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}
