import PropTypes from 'prop-types';
import WedgeToggleButton from './WedgeToggleButton';

export default function MobileBottomSheet({
  currentStep,
  progress,
  bothSelected,
  onDownload,
  loading,
  userStats,
  useAudiobookWedge,
  useBookWedge,
  onToggleAudiobookWedge,
  onToggleBookWedge,
  selectedBook,
  selectedAudiobook
}) {
  const disabled = !bothSelected || loading;
  const hasWedges = userStats?.flWedges > 0;
  const stepText = currentStep === 1 ? 'a Book' : 'an Audiobook';
  const showBookWedge = selectedBook && !selectedBook.freeleech;
  const showAudiobookWedge = selectedAudiobook && !selectedAudiobook.freeleech;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-gray-50 rounded-xl z-40 border-t border-gray-200"></div>

      {/* Content container - single fixed element */}
      <div className="fixed bottom-4 left-4 right-4 z-[100] pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {/* Progress indicator (only show when not both selected) */}
          {!bothSelected && (
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  <span>Step {currentStep} of 2:</span>
                  <span className="ml-1 font-medium">Select {stepText}</span>
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Wedge selector panel (only show when both selected and has wedges) */}
          {bothSelected && hasWedges && (showBookWedge || showAudiobookWedge) && (
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-700 font-medium">Use FL Wedge:</span>
                {showBookWedge && (
                  <WedgeToggleButton
                    active={useBookWedge}
                    onClick={onToggleBookWedge}
                    label="Book"
                    size="large"
                  />
                )}
                {showAudiobookWedge && (
                  <WedgeToggleButton
                    active={useAudiobookWedge}
                    onClick={onToggleAudiobookWedge}
                    label="Audiobook"
                    size="large"
                  />
                )}
              </div>
            </div>
          )}

          {/* Download button panel */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <button
              onClick={onDownload}
              disabled={disabled}
              className="w-full rounded-md bg-pink-400 px-5 py-3 text-base font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : bothSelected ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download</span>
                </>
              ) : (
                'Select one from each'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

MobileBottomSheet.propTypes = {
  currentStep: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
  bothSelected: PropTypes.bool.isRequired,
  onDownload: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  userStats: PropTypes.shape({
    uploaded: PropTypes.string,
    downloaded: PropTypes.string,
    ratio: PropTypes.string,
    flWedges: PropTypes.number
  }),
  useAudiobookWedge: PropTypes.bool,
  useBookWedge: PropTypes.bool,
  onToggleAudiobookWedge: PropTypes.func,
  onToggleBookWedge: PropTypes.func,
  selectedBook: PropTypes.object,
  selectedAudiobook: PropTypes.object
};
