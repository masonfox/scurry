import PropTypes from 'prop-types';

export default function MobileBottomSheet({
  currentStep,
  progress,
  bothSelected,
  onDownload,
  loading,
  hidden = false
}) {
  const disabled = !bothSelected || loading;
  const stepText = currentStep === 1 ? 'a Book' : 'an Audiobook';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed bottom-0 left-0 right-0 ${bothSelected ? 'h-20' : 'h-36'} bg-white dark:bg-zinc-900 rounded-xl z-40 border-t border-gray-200 dark:border-zinc-700 transition-all duration-300 ease-out ${
          hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      ></div>

      {/* Content container - single fixed element */}
      <div className={`fixed bottom-3 left-4 right-4 z-[100] transition-all duration-300 ease-out ${
        hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-none'
      }`}>
        <div className="pointer-events-auto space-y-2">
          {/* Progress indicator (only show when not both selected) */}
          {!bothSelected && (
            <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                  <span>Step {currentStep} of 2:</span>
                  <span className="ml-1 font-medium">Select {stepText}</span>
                </span>
                <span className="text-sm text-gray-500 dark:text-zinc-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-pink-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download button */}
          <button
            onClick={onDownload}
            disabled={disabled}
            className="w-full rounded-md bg-pink-400 px-5 py-3 text-base font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-zinc-600 dark:disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
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
                <span>Review</span>
              </>
            ) : (
              'Select one from each'
            )}
          </button>
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
  hidden: PropTypes.bool
};
