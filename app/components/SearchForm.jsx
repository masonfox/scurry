import { useRef } from 'react';
import PropTypes from 'prop-types';

export default function SearchForm({ 
  q, 
  setQ, 
  searchCategory, 
  onCategoryChange, 
  onSubmit, 
  loading,
  onClearResults 
}) {
  const searchInputRef = useRef(null);

  const handleClearSearch = () => {
    setQ("");
    if (onClearResults) {
      onClearResults();
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && q) {
      e.preventDefault();
      handleClearSearch();
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 relative">
      <div className="relative w-full flex flex-col sm:flex-row">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            name="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${searchCategory}...`}
            className="block w-full rounded-md sm:rounded-l-md sm:rounded-r-none bg-white px-4 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 sm:text-sm/6 pr-10"
            autoComplete="off"
            spellCheck="false"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 focus:outline-none"
              style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <select
          value={searchCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
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
      <button 
        className="rounded-md bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 cursor-pointer min-w-[100px] flex items-center justify-center" 
        disabled={loading || !q.trim()}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}

SearchForm.propTypes = {
  q: PropTypes.string.isRequired,
  setQ: PropTypes.func.isRequired,
  searchCategory: PropTypes.oneOf(['books', 'audiobooks']).isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  onClearResults: PropTypes.func
};