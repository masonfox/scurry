import SearchResultItem from './SearchResultItem';
import ProgressIndicator from './ProgressIndicator';
import PropTypes from 'prop-types';

export default function DualSearchResultsList({
  audiobookResults,
  bookResults,
  selectedAudiobook,
  selectedBook,
  onSelectAudiobook,
  onSelectBook,
  loading,
  onDownload,
  downloadLoading
}) {
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

  // Calculate progress for desktop
  const progress = selectedBook && selectedAudiobook ? 100 : selectedBook ? 50 : 0;
  const currentStep = selectedBook ? 2 : 1;
  const bothSelected = selectedAudiobook && selectedBook;
  const disabled = !bothSelected || downloadLoading;

  // Download button component - matching search button style with icon
  const hasWedges = userStats?.flWedges > 0;
  const showBookWedge = hasWedges && selectedBook?.freeleech === false && !selectedBook?.vip && !selectedBook?.snatched;
  const showAudiobookWedge = hasWedges && selectedAudiobook?.freeleech === false && !selectedAudiobook?.vip && !selectedAudiobook?.snatched;
  const showWedges = showBookWedge || showAudiobookWedge;

  const downloadButton = (
    <button
      onClick={onDownload}
      disabled={disabled}
      className="rounded-md bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-zinc-600 dark:disabled:text-zinc-400 disabled:cursor-not-allowed cursor-pointer min-w-[100px] flex items-center justify-center gap-2 h-full"
      aria-label="Download selected book and audiobook"
    >
      {downloadLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Downloading...</span>
        </>
      ) : (
        <>
          <span>Review</span>
        </>
      )}
    </button>
  );

  return (
    <div className="mt-6">
      {/* Integrated Header: Progress + Download Button */}
      <div className="mb-8 p-5 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-6">
          <ProgressIndicator 
            currentStep={currentStep}
            progress={progress}
            mobile={false}
            compact={true}
          />
          
          {/* Download Button - always visible, disabled until both selected */}
          <div className="flex-shrink-0 ml-auto">
            {downloadButton}
          </div>
        </div>
        </div>
      </div>
      
      {/* Two-column grid for results */}
      <div className="grid grid-cols-2 gap-6">
      {/* Left Column: Books */}
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
                selected={selectedBook?.id === result.id}
                onSelect={onSelectBook}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Right Column: Audiobooks */}
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
                selected={selectedAudiobook?.id === result.id}
                onSelect={onSelectAudiobook}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
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

DualSearchResultsList.propTypes = {
  audiobookResults: PropTypes.arrayOf(resultShape).isRequired,
  bookResults: PropTypes.arrayOf(resultShape).isRequired,
  selectedAudiobook: resultShape,
  selectedBook: resultShape,
  onSelectAudiobook: PropTypes.func.isRequired,
  onSelectBook: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
  downloadLoading: PropTypes.bool.isRequired
};
