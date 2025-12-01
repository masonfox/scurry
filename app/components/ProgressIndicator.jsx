import PropTypes from 'prop-types';

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps = 2, 
  progress,
  mobile = false 
}) {
  const stepText = currentStep === 1 ? 'a Book' : 'an Audiobook';
  
  const containerClasses = mobile
    ? 'fixed bottom-20 left-4 right-4 z-40 bg-white p-3 rounded-lg shadow-lg border border-gray-200'
    : 'mb-6 p-3 bg-white rounded-lg border border-gray-200';

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}: Select {stepText}
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
  );
}

ProgressIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number,
  progress: PropTypes.number.isRequired,
  mobile: PropTypes.bool
};
