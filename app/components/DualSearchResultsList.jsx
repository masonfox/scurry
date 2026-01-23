import SearchResultItem from './SearchResultItem';
import ProgressIndicator from './ProgressIndicator';
import WedgeToggleButton from './WedgeToggleButton';
import PropTypes from 'prop-types';
import { parseSizeToBytes, calculateNewRatio, calculateRatioDiff, formatBytesToSize } from '@/src/lib/utilities';

export default function DualSearchResultsList({
  audiobookResults,
  bookResults,
  selectedAudiobook,
  selectedBook,
  onSelectAudiobook,
  onSelectBook,
  loading,
  onDownload,
  downloadLoading,
  userStats,
  useAudiobookWedge,
  useBookWedge,
  onToggleAudiobookWedge,
  onToggleBookWedge
}) {
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

  // Calculate progress for desktop
  const progress = selectedBook && selectedAudiobook ? 100 : selectedBook ? 50 : 0;
  const currentStep = selectedBook ? 2 : 1;
  const bothSelected = selectedAudiobook && selectedBook;
  const disabled = !bothSelected || downloadLoading;

  // Calculate combined size and projected ratio when both are selected
  let combinedInfo = null;
  if (bothSelected && userStats) {
    const audiobookBytes = parseSizeToBytes(selectedAudiobook.size);
    const bookBytes = parseSizeToBytes(selectedBook.size);
    const uploadedBytes = parseSizeToBytes(userStats.uploaded);
    const downloadedBytes = parseSizeToBytes(userStats.downloaded);
    
    if (audiobookBytes && bookBytes && uploadedBytes !== null && downloadedBytes !== null) {
      const totalBytes = audiobookBytes + bookBytes;
      
      // Calculate bytes that will affect ratio (exclude items with FL wedge or already freeleech)
      let bytesForRatio = 0;
      const isBookFreeleech = useBookWedge || selectedBook.freeleech;
      const isAudiobookFreeleech = useAudiobookWedge || selectedAudiobook.freeleech;
      
      if (!isBookFreeleech) bytesForRatio += bookBytes;
      if (!isAudiobookFreeleech) bytesForRatio += audiobookBytes;
      
      // If both are freeleech, show "Same" as ratio doesn't change
      if (bytesForRatio === 0) {
        combinedInfo = {
          totalSize: formatBytesToSize(totalBytes),
          projectedRatio: 'Same',
          diff: null
        };
      } else {
        const projectedRatio = calculateNewRatio(uploadedBytes, downloadedBytes, bytesForRatio);
        const diff = calculateRatioDiff(uploadedBytes, downloadedBytes, bytesForRatio);
        combinedInfo = {
          totalSize: formatBytesToSize(totalBytes),
          projectedRatio,
          diff
        };
      }
    }
  }

  // Download button component - matching search button style with icon
  const downloadButton = (
    <button
      onClick={onDownload}
      disabled={disabled}
      className="rounded-md bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed cursor-pointer min-w-[100px] flex items-center justify-center gap-2 h-full"
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download</span>
        </>
      )}
    </button>
  );

  return (
    <div className="mt-6">
      {/* Progress Indicator for Desktop with inline button */}
      <ProgressIndicator 
        currentStep={currentStep}
        progress={progress}
        mobile={false}
        actionButton={downloadButton}
      />
      
      {/* Combined info display when both selected */}
      {combinedInfo && (
        <div className="mb-4 px-4 py-2 bg-pink-50 border border-pink-200 rounded-lg text-center text-sm">
          <span className="text-gray-700">Combined: </span>
          <span className="font-semibold text-gray-900">{combinedInfo.totalSize}</span>
          <span className="text-gray-500 mx-2">•</span>
          <span className="text-gray-700">New ratio: </span>
          <span className="font-semibold text-gray-900">
            {combinedInfo.diff ? `${combinedInfo.projectedRatio} (${combinedInfo.diff})` : combinedInfo.projectedRatio}
          </span>
        </div>
      )}
      
      {/* Wedge toggles when both are selected */}
      {bothSelected && userStats?.flWedges > 0 && (selectedBook?.freeleech === false || selectedAudiobook?.freeleech === false) && (
        <div className="mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">Use FL Wedge:</span>
              {!selectedBook?.freeleech && (
                <WedgeToggleButton
                  active={useBookWedge}
                  onClick={onToggleBookWedge}
                  label="Book"
                  size="large"
                />
              )}
              {!selectedAudiobook?.freeleech && (
                <WedgeToggleButton
                  active={useAudiobookWedge}
                  onClick={onToggleAudiobookWedge}
                  label="Audiobook"
                  size="large"
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6">
      {/* Left Column: Books */}
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
                selected={selectedBook?.id === result.id}
                onSelect={onSelectBook}
                userStats={userStats}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Right Column: Audiobooks */}
      <div>
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
                userStats={userStats}
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
  downloadLoading: PropTypes.bool.isRequired,
  userStats: PropTypes.shape({
    uploaded: PropTypes.string,
    downloaded: PropTypes.string,
    ratio: PropTypes.string,
    flWedges: PropTypes.number
  }),
  useAudiobookWedge: PropTypes.bool,
  useBookWedge: PropTypes.bool,
  onToggleAudiobookWedge: PropTypes.func,
  onToggleBookWedge: PropTypes.func
};
