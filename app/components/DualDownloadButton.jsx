import PropTypes from 'prop-types';

export default function DualDownloadButton({ 
  audiobookSelected, 
  bookSelected, 
  onDownload, 
  loading 
}) {
  const bothSelected = audiobookSelected && bookSelected;
  const disabled = !bothSelected || loading;

  return (
    <div className="mb-6 mt-6">
      {/* Desktop: Fixed at top */}
      <div className="hidden md:block">
        <button
          onClick={onDownload}
          disabled={disabled}
          className="w-full rounded-md bg-pink-400 px-5 py-3 text-base font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </>
          ) : bothSelected ? (
            'Download Both'
          ) : (
            'Select one audiobook and one book to continue'
          )}
        </button>
      </div>

      {/* Mobile: Sticky at bottom */}
      <div className="block md:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
        <button
          onClick={onDownload}
          disabled={disabled}
          className="w-full rounded-md bg-pink-400 px-5 py-3 text-base font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </>
          ) : bothSelected ? (
            'Download Both'
          ) : (
            'Select one from each'
          )}
        </button>
      </div>
    </div>
  );
}

DualDownloadButton.propTypes = {
  audiobookSelected: PropTypes.bool.isRequired,
  bookSelected: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};
