import { useEffect, useRef } from 'react';
import SearchResultItem from './SearchResultItem';
import MobileBottomSheet from './MobileBottomSheet';
import PropTypes from 'prop-types';

// Delay before auto-scrolling to next section (ms)
const AUTO_SCROLL_DELAY_MS = 100;

export default function SequentialSearchResults({
  audiobookResults,
  bookResults,
  selectedAudiobook,
  selectedBook,
  onSelectAudiobook,
  onSelectBook,
  loading,
  onDownload,
  downloadLoading,
  hideBottomSheet
}) {
  const bookSectionRef = useRef(null);
  const audiobookSectionRef = useRef(null);

  // Auto-scroll to books section when search results first load
  useEffect(() => {
    if (!loading && (bookResults.length > 0 || audiobookResults.length > 0) && bookSectionRef.current) {
      setTimeout(() => {
        bookSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, AUTO_SCROLL_DELAY_MS);
    }
  }, [loading, bookResults.length, audiobookResults.length]);

  // Auto-scroll to audiobook results when book is selected
  useEffect(() => {
    if (selectedBook && audiobookSectionRef.current) {
      setTimeout(() => {
        audiobookSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, AUTO_SCROLL_DELAY_MS);
    }
  }, [selectedBook]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-zinc-400">Searching both categories...</p>
        </div>
      </div>
    );
  }

  const noResults = audiobookResults.length === 0 && bookResults.length === 0;
  const noAudiobooks = audiobookResults.length === 0;
  const noBooks = bookResults.length === 0;

  if (noResults) {
    return <p className="text-gray-500 dark:text-zinc-400 mt-5">No results found for either category. Try a different search...</p>;
  }

  // Calculate progress
  const progress = selectedBook && selectedAudiobook ? 100 : selectedBook ? 50 : 0;
  const currentStep = selectedBook ? 2 : 1;

  return (
    <div className={`mt-6 ${selectedBook && selectedAudiobook ? 'pb-20' : 'pb-36'}`}>
      {/* Mobile bottom sheet with progress indicator and download button */}
      <MobileBottomSheet
        currentStep={currentStep}
        progress={progress}
        bothSelected={!!(selectedBook && selectedAudiobook)}
        onDownload={onDownload}
        loading={downloadLoading}
        hidden={hideBottomSheet}
      />

      {/* Step 1: Book Selection */}
      <div ref={bookSectionRef} className={selectedBook ? 'mb-6' : ''}>
        {selectedBook ? (
          // Collapsed view showing selected book
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                📚 Selected Book
              </h3>
              <button 
                onClick={() => onSelectBook(null)}
                className="text-sm text-pink-300 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
                aria-label="Change selected book"
              >
                Change
              </button>
            </div>
            <ul className="list-none p-0">
              <SearchResultItem
                result={selectedBook}
                selectable={true}
                selected={true}
                onSelect={onSelectBook}
              />
            </ul>
          </div>
        ) : (
          // Full book list
          <div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              📚 Books
              <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">({bookResults.length})</span>
            </h3>
            {noBooks ? (
              <p className="text-gray-500 dark:text-zinc-400 text-sm">No books found</p>
            ) : (
              <ul className="list-none p-0" role="list" aria-label="Book results">
                {bookResults.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    selectable={true}
                    selected={false}
                    onSelect={onSelectBook}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Audiobook Selection (only shown after book selected) */}
      {selectedBook && (
        <div ref={audiobookSectionRef}>
          {selectedAudiobook ? (
            // Collapsed view showing selected audiobook
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                  🎧 Selected Audiobook
                </h3>
                <button 
                  onClick={() => onSelectAudiobook(null)}
                  className="text-sm text-pink-300 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
                  aria-label="Change selected audiobook"
                >
                  Change
                </button>
              </div>
              <ul className="list-none p-0">
                <SearchResultItem
                  result={selectedAudiobook}
                  selectable={true}
                  selected={true}
                  onSelect={onSelectAudiobook}
                />
              </ul>
            </div>
          ) : (
            // Full audiobook list
            <div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                🎧 Audiobooks
                <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">({audiobookResults.length})</span>
              </h3>
              {noAudiobooks ? (
                <p className="text-gray-500 dark:text-zinc-400 text-sm">No audiobooks found</p>
              ) : (
                <ul className="list-none p-0" role="list" aria-label="Audiobook results">
                  {audiobookResults.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      selectable={true}
                      selected={false}
                      onSelect={onSelectAudiobook}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const resultShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  size: PropTypes.string.isRequired,
  filetypes: PropTypes.string.isRequired,
  seeders: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  downloads: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  torrentUrl: PropTypes.string.isRequired,
  downloadUrl: PropTypes.string.isRequired,
  vip: PropTypes.bool,
  freeleech: PropTypes.bool,
  snatched: PropTypes.bool
});

SequentialSearchResults.propTypes = {
  audiobookResults: PropTypes.arrayOf(resultShape).isRequired,
  bookResults: PropTypes.arrayOf(resultShape).isRequired,
  selectedAudiobook: resultShape,
  selectedBook: resultShape,
  onSelectAudiobook: PropTypes.func.isRequired,
  onSelectBook: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
  downloadLoading: PropTypes.bool.isRequired,
  hideBottomSheet: PropTypes.bool
};
