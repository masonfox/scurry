import PropTypes from 'prop-types';

export default function WedgeToggleButton({ 
  active, 
  onClick, 
  label,
  size = 'small' // 'small' for icon-only, 'large' for icon + text
}) {
  const sizeClasses = size === 'small' 
    ? 'p-1.5' 
    : 'px-3 py-1.5';
  
  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-4 h-4';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${sizeClasses} rounded transition-colors duration-200 cursor-pointer ${
        active 
          ? 'bg-amber-400 text-white hover:bg-amber-500' 
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      }`}
      title={active ? `Freeleech Wedge will be used${label ? ` for ${label}` : ''}` : `Use Freeleech Wedge${label ? ` for ${label}` : ''}`}
      aria-label={active ? `Remove Freeleech Wedge${label ? ` from ${label}` : ''}` : `Use Freeleech Wedge${label ? ` for ${label}` : ''}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
      </svg>
      {size === 'large' && label && <span>{label}</span>}
    </button>
  );
}

WedgeToggleButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string,
  size: PropTypes.oneOf(['small', 'large'])
};
