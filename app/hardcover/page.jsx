"use client";
import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import MessageBanner from "../MessageBanner";

export default function HardcoverPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchResults, setSearchResults] = useState({});
  const [searchingBooks, setSearchingBooks] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter books based on selected status
  const filteredBooks = books.filter(book => {
    if (statusFilter === 'all') return true;
    
    // Handle special cases
    if (statusFilter === 'downloaded') {
      return book.status === 'downloaded' || book.isDownloaded;
    }
    
    return book.status === statusFilter;
  });

  // Get book counts by status
  const getBookCounts = () => {
    const counts = {
      all: books.length,
      wanted: 0,
      searching: 0,
      downloaded: 0,
      failed: 0
    };

    books.forEach(book => {
      if (book.status === 'downloaded' || book.isDownloaded) {
        counts.downloaded++;
      } else if (book.status === 'searching') {
        counts.searching++;
      } else if (book.status === 'failed') {
        counts.failed++;
      } else {
        counts.wanted++;
      }
    });

    return counts;
  };

  const bookCounts = getBookCounts();

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const res = await fetch('/api/hardcover/books');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load books');
      }
      
      setBooks(data.books || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function syncBooks() {
    try {
      setSyncing(true);
      setMessage(null);
      
      const res = await fetch('/api/hardcover/books', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync books');
      }
      
      setMessage({ type: 'success', text: data.message });
      await loadBooks();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSyncing(false);
    }
  }

  async function triggerAutoSync() {
    try {
      setMessage(null);
      const res = await fetch('/api/hardcover/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger sync');
      }
      
      setMessage({ type: 'success', text: data.message });
      await loadBooks();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function searchForBook(book) {
    try {
      setSearchingBooks(prev => new Set([...prev, book.hardcoverId]));
      
      const res = await fetch(
        `/api/hardcover/search?bookId=${book.hardcoverId}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || '')}`
      );
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search');
      }
      
      setSearchResults(prev => ({
        ...prev,
        [book.hardcoverId]: data.results
      }));
    } catch (error) {
      setMessage({ type: 'error', text: `Search failed for "${book.title}": ${error.message}` });
    } finally {
      setSearchingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.hardcoverId);
        return newSet;
      });
    }
  }

  async function downloadBook(book) {
    try {
      const res = await fetch('/api/hardcover/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hardcoverId: book.hardcoverId,
          title: book.title,
          author: book.author || ''
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to download');
      }
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully queued "${book.title}" (similarity: ${(data.similarity * 100).toFixed(1)}%)`
        });
        await loadBooks();
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to download "${book.title}": ${data.reason}`
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  function getStatusBadge(book) {
    const statusConfig = {
      'wanted': { color: 'bg-blue-100 text-blue-800', text: 'Wanted' },
      'searching': { color: 'bg-yellow-100 text-yellow-800', text: 'Searching' },
      'downloaded': { color: 'bg-green-100 text-green-800', text: 'Downloaded' },
      'failed': { color: 'bg-red-100 text-red-800', text: 'Failed' }
    };

    const config = statusConfig[book.status] || statusConfig['wanted'];
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
        {book.downloadAttempts > 0 && ` (${book.downloadAttempts})`}
      </span>
    );
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-4xl mx-auto p-4">
          <div className="text-center">⏳ Loading books...</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📚 Hardcover Books</h1>
            {statusFilter !== 'all' && (
              <p className="text-gray-600 text-sm mt-1">
                Showing {filteredBooks.length} of {books.length} books ({statusFilter})
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={syncBooks}
              disabled={syncing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded"
            >
              {syncing ? 'Syncing...' : 'Sync Hardcover'}
            </button>
            <button
              onClick={triggerAutoSync}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded"
            >
              🔄 Auto Download All
            </button>
          </div>
        </div>

        {message && (
          <MessageBanner type={message.type} text={message.text} />
        )}

        {/* Status Filter */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Filter by Status</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Books', color: 'bg-gray-100 text-gray-800' },
              { key: 'wanted', label: 'Wanted', color: 'bg-blue-100 text-blue-800' },
              { key: 'downloaded', label: 'Downloaded', color: 'bg-green-100 text-green-800' },
              { key: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  statusFilter === filter.key 
                    ? `${filter.color} ring-2 ring-offset-1 ring-gray-400` 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.label} ({bookCounts[filter.key]})
              </button>
            ))}
          </div>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No books found. Sync from Hardcover to get started.</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No books match the selected filter.</p>
            <button 
              onClick={() => setStatusFilter('all')}
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Show all books
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <div key={book._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
                    {book.author && (
                      <p className="text-gray-600 text-sm mt-1">by {book.author}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {getStatusBadge(book)}
                      {book.isDownloaded && (
                        <span className="text-green-600">✅ Downloaded</span>
                      )}
                      {book.lastSearched && (
                        <span>Last searched: {new Date(book.lastSearched).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => searchForBook(book)}
                      disabled={searchingBooks.has(book.hardcoverId)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1 px-3 rounded text-sm"
                    >
                      {searchingBooks.has(book.hardcoverId) ? 'Searching...' : 'Search'}
                    </button>
                    
                    <button
                      onClick={() => downloadBook(book)}
                      disabled={book.status === 'downloaded' || book.isDownloaded}
                      className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-medium py-1 px-3 rounded text-sm"
                    >
                      Auto Download
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults[book.hardcoverId] && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults[book.hardcoverId].map((result) => (
                        <div key={result.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{result.title}</div>
                              <div className="text-gray-500">
                                {result.author} • {result.size} • {result.seeders} seeders
                                {result.similarity && (
                                  <span className="ml-2 text-blue-600">
                                    {(result.similarity * 100).toFixed(1)}% match
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.snatched && (
                              <span className="text-red-600 text-xs">Snatched</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
