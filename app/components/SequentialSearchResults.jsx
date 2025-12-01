import { useEffect, useRef } from 'react';
import SearchResultItem from './SearchResultItem';
import ProgressIndicator from './ProgressIndicator';
import PropTypes from 'prop-types';

export default function SequentialSearchResults({
  audiobookResults,
  bookResults,
  selectedAudiobook,
  selectedBook,
  onSelectAudiobook,
  onSelectBook,
  loading
}) {
  const bookSectionRef = useRef(null);

  // Auto-scroll to audiobook results when book is selected
  useEffect(() => {
    if (selectedBook && bookSectionRef.current) {
      setTimeout(() => {
        bookSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
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
          <p className="text-gray-600">Searching both categories...</p>
        </div>
      </div>
    );
  }

  const noResults = audiobookResults.length === 0 && bookResults.length === 0;
  const noAudiobooks = audiobookResults.length === 0;
  const noBooks = bookResults.length === 0;

  if (noResults) {
    return <p className="text-gray-500 mt-5">No results found for either category. Try a different search...</p>;
  }

  // Calculate progress
  const progress = selectedBook && selectedAudiobook ? 100 : selectedBook ? 50 : 0;
  const currentStep = selectedBook ? 2 : 1;

  return (
    <div className="mt-6 pb-32">
      {/* Progress Indicator - Fixed at bottom on mobile */}
      <ProgressIndicator 
        currentStep={currentStep}
        progress={progress}
        mobile={true}
      />

      {/* Step 1: Book Selection */}
      <div className={selectedBook ? 'mb-6' : ''}>
        {selectedBook ? (
          // Collapsed view showing selected book
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                📚 Selected Book
              </h3>
              <button 
                onClick={() => onSelectBook(null)}
                className="text-sm text-pink-400 hover:text-pink-500 font-medium"
              >
                Change
              </button>
            </div>
            <SearchResultItem
              result={selectedBook}
              selectable={true}
              selected={true}
              onSelect={onSelectBook}
            />
          </div>
        ) : (
          // Full book list
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              📚 Books
              <span className="text-sm font-normal text-gray-500">({bookResults.length})</span>
            </h3>
            {noBooks ? (
              <p className="text-gray-500 text-sm">No books found</p>
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
        <div ref={bookSectionRef}>
          <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            🎧 Audiobooks
            <span className="text-sm font-normal text-gray-500">({audiobookResults.length})</span>
          </h3>
          {noAudiobooks ? (
            <p className="text-gray-500 text-sm">No audiobooks found</p>
          ) : (
            <ul className="list-none p-0" role="list" aria-label="Audiobook results">
              {audiobookResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  selectable={true}
                  selected={selectedAudiobook?.id === result.id}
                  onSelect={onSelectAudiobook}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

SequentialSearchResults.propTypes = {
  audiobookResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  bookResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedAudiobook: PropTypes.object,
  selectedBook: PropTypes.object,
  onSelectAudiobook: PropTypes.func.isRequired,
  onSelectBook: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};
