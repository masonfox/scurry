import PropTypes from 'prop-types';

export default function ProgressIndicator({
  currentStep,
  totalSteps = 2,
  progress,
  mobile = false,
  compact = false,
  actionButton = null
}) {
  const stepText = progress === 100 ? 'Done' : (currentStep === 1 ? 'a Book' : 'an Audiobook');

  if (mobile) {
    return (
      <>
        {/* Bottom sheet backdrop */}
        <div className="fixed bottom-0 left-0 right-0 h-40 bg-gray-50 dark:bg-zinc-900 rounded-xl z-40 border-t border-gray-200 dark:border-zinc-700"></div>

        {/* Progress indicator content */}
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
              <span>Step {currentStep} of {totalSteps}:</span>
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
      </>
    );
  }

  // Compact mode: For integrated header layout (no container, just progress elements)
  if (compact) {
    return (
      <div className="flex items-center gap-4 flex-1">
        <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap font-medium">
          <span>Step {currentStep} of {totalSteps}:</span>
          <span className="ml-1">Select {stepText}</span>
        </span>
        <div className="flex-1 max-w-md">
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5">
            <div
              className="bg-pink-400 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[45px] text-right">{progress}%</span>
      </div>
    );
  }

  // Desktop: Flatter design with panel - progress bar with inline text and button
  return (
    <div className="mb-6 flex flex-row gap-2">
      <div className="flex-1 flex items-center gap-4 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
          <span>Step {currentStep} of {totalSteps}:</span>
          <span className="ml-1 font-medium">Select {stepText}</span>
        </span>

        <div className="flex-1 relative">
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-pink-400 h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap min-w-[35px] text-right">{progress}%</span>
      </div>
      {actionButton && (
        <div className="flex-shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );
}

ProgressIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number,
  progress: PropTypes.number.isRequired,
  mobile: PropTypes.bool,
  compact: PropTypes.bool,
  actionButton: PropTypes.node
};
