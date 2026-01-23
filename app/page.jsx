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

const DEFAULT_CATEGORY = process.env.NEXT_PUBLIC_DEFAULT_CATEGORY ?? "books";
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
  
  // FL Wedge state
  const [singleModeWedges, setSingleModeWedges] = useState({}); // { torrentId: boolean }
  const [useAudiobookWedge, setUseAudiobookWedge] = useState(false);
  const [useBookWedge, setUseBookWedge] = useState(false);

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
    setSingleModeWedges({});
    setUseAudiobookWedge(false);
    setUseBookWedge(false);
    
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

  const addItem = useCallback(async (item) => {
    setMessage(null);
    try {
      // Map search category to qBittorrent category
      const qbCategory = searchCategory === "audiobooks" ? "audiobooks" : "books";
      
      // Check if wedge should be used for this item
      const useWedge = singleModeWedges[item.id] || false;
      
      const res = await fetch(`/api/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          downloadUrl: item.downloadUrl,
          category: qbCategory,
          useWedge
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Add failed");
      
      setMessage({ 
        type: "success", 
        text: `Queued: ${item.title}${useWedge ? ' (FL Wedge applied)' : ''}` 
      });
      
      // Refresh user stats if wedge was used
      if (useWedge && data.wedgeUsed) {
        fetchUserStats();
      }
      
      // Clear search and scroll to top
      setQ("");
      setResults([]);
      setSingleModeWedges({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Remove message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Add failed" });
    }
  }, [searchCategory, singleModeWedges, fetchUserStats]);

  const clearResults = useCallback(() => {
    setResults([]);
    setAudiobookResults([]);
    setBookResults([]);
    setSelectedAudiobook(null);
    setSelectedBook(null);
    setMessage(null);
    setSingleModeWedges({});
    setUseAudiobookWedge(false);
    setUseBookWedge(false);
  }, []);

  // Dual-mode selection handlers
  const handleSelectAudiobook = useCallback((item) => {
    setSelectedAudiobook(prev => 
      prev?.id === item?.id ? null : item
    );
  }, []);

  const handleSelectBook = useCallback((item) => {
    setSelectedBook(prev => 
      prev?.id === item?.id ? null : item
    );
  }, []);

  // Dual download handler
  const handleDualDownload = useCallback(async () => {
    if (!selectedAudiobook || !selectedBook) return;
    
    setDualDownloadLoading(true);
    setMessage(null);
    
    try {
      // Download audiobook and book in parallel
      const [audiobookRes, bookRes] = await Promise.all([
        fetch('/api/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedAudiobook.title,
            downloadUrl: selectedAudiobook.downloadUrl,
            category: 'audiobooks',
            useWedge: useAudiobookWedge
          })
        }),
        fetch('/api/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedBook.title,
            downloadUrl: selectedBook.downloadUrl,
            category: 'books',
            useWedge: useBookWedge
          })
        })
      ]);
      
      // Check results
      const [audiobookData, bookData] = await Promise.all([
        audiobookRes.json(),
        bookRes.json()
      ]);
      
      const audiobookSuccess = audiobookRes.ok && audiobookData.ok;
      const bookSuccess = bookRes.ok && bookData.ok;
      
      // Refresh stats if any wedge was used
      if ((useAudiobookWedge && audiobookSuccess) || (useBookWedge && bookSuccess)) {
        fetchUserStats();
      }
      
      if (audiobookSuccess && bookSuccess) {
        // Both succeeded
        const wedgeInfo = [];
        if (useAudiobookWedge) wedgeInfo.push('audiobook FL');
        if (useBookWedge) wedgeInfo.push('book FL');
        const wedgeText = wedgeInfo.length > 0 ? ` (${wedgeInfo.join(', ')} applied)` : '';
        
        setMessage({ 
          type: 'success', 
          text: `✓ Queued 2 items: ${selectedBook.title} + ${selectedAudiobook.title}${wedgeText}` 
        });
        
        // Clear and reset
        setQ('');
        setAudiobookResults([]);
        setBookResults([]);
        setSelectedAudiobook(null);
        setSelectedBook(null);
        setUseAudiobookWedge(false);
        setUseBookWedge(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => setMessage(null), SUCCESS_MESSAGE_DURATION_MS);
        
      } else if (audiobookSuccess && !bookSuccess) {
        // Partial success: audiobook ok, book failed
        setMessage({ 
          type: 'error', 
          text: `✓ Audiobook queued successfully. ✗ Book failed: ${bookData.error || 'Unknown error'}` 
        });
        // Keep book selection so user can retry
        setSelectedBook(selectedBook);
        
      } else if (!audiobookSuccess && bookSuccess) {
        // Partial success: book ok, audiobook failed
        setMessage({ 
          type: 'error', 
          text: `✓ Book queued successfully. ✗ Audiobook failed: ${audiobookData.error || 'Unknown error'}` 
        });
        // Keep audiobook selection so user can retry
        setSelectedAudiobook(selectedAudiobook);
        
      } else {
        // Both failed
        throw new Error(`Audiobook: ${audiobookData.error || 'Unknown error'}. Book: ${bookData.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err?.message || 'Dual download failed' 
      });
    } finally {
      setDualDownloadLoading(false);
    }
  }, [selectedAudiobook, selectedBook, useAudiobookWedge, useBookWedge, fetchUserStats]);

  // Wedge toggle handlers
  const handleToggleSingleWedge = useCallback((torrentId) => {
    setSingleModeWedges(prev => ({
      ...prev,
      [torrentId]: !prev[torrentId]
    }));
  }, []);

  const handleToggleAudiobookWedge = useCallback(() => {
    setUseAudiobookWedge(prev => !prev);
  }, []);

  const handleToggleBookWedge = useCallback(() => {
    setUseBookWedge(prev => !prev);
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
                  onDownload={handleDualDownload}
                  downloadLoading={dualDownloadLoading}
                  userStats={userStats}
                  useAudiobookWedge={useAudiobookWedge}
                  useBookWedge={useBookWedge}
                  onToggleAudiobookWedge={handleToggleAudiobookWedge}
                  onToggleBookWedge={handleToggleBookWedge}
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
                  userStats={userStats}
                  onDownload={handleDualDownload}
                  downloadLoading={dualDownloadLoading}
                  useAudiobookWedge={useAudiobookWedge}
                  useBookWedge={useBookWedge}
                  onToggleAudiobookWedge={handleToggleAudiobookWedge}
                  onToggleBookWedge={handleToggleBookWedge}
                />
              </div>
            </>
          ) : (
            <SearchResultsList
              results={results}
              onAddItem={addItem}
              loading={loading}
              userStats={userStats}
              singleModeWedges={singleModeWedges}
              onToggleWedge={handleToggleSingleWedge}
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
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}

