import PropTypes from 'prop-types';

export default function ProgressIndicator({
  currentStep,
  totalSteps = 2,
  progress,
  mobile = false,
  actionButton = null
}) {
  const stepText = currentStep === 1 ? 'a Book' : 'an Audiobook';

  if (mobile) {
    return (
      <>
        {/* Bottom sheet backdrop */}
        <div className="fixed bottom-0 left-0 right-0 h-40 bg-gray-50 rounded-xl z-40 border-t border-gray-200"></div>

        {/* Progress indicator content */}
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">
              <span>Step {currentStep} of {totalSteps}:</span>
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
      </>
    );
  }

  // Desktop: Flatter design with panel - progress bar with inline text and button
  return (
    <div className="mb-6 flex flex-row gap-2">
      <div className="flex-1 flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
        <span className="text-sm text-gray-700 whitespace-nowrap">
          <span>Step {currentStep} of {totalSteps}:</span>
          <span className="ml-1 font-medium">Select {stepText}</span>
        </span>

        <div className="flex-1 relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-400 h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap min-w-[35px] text-right">{progress}%</span>
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
  actionButton: PropTypes.node
};
