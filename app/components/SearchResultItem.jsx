import Image from 'next/image';
import PropTypes from 'prop-types';

export default function SearchResultItem({ result, onAddItem, selectable = false, selected = false, onSelect }) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(result);
    }
  };

  const borderClasses = selectable
    ? selected
      ? 'border-3 border-pink-400 cursor-pointer'
      : 'border-2 border-gray-100 hover:border-pink-200 cursor-pointer'
    : 'border-2 border-gray-100 hover:border-pink-200';

  return (
    <li 
      className={`px-4 py-3 rounded-md ${borderClasses} mb-4 transition-colors duration-200 relative`}
      onClick={selectable ? handleClick : undefined}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <div className="flex justify-between items-center w-full gap-6">
        <div className="flex-1 min-w-0">
          {/* Basic torrent information */}
          <div className="mb-1">
            <span className="font-semibold text-gray-900">{result.title}</span>
            <span className="text-gray-600">
              <span className="mx-1">by</span>
              <span>{result.author}</span>
            </span>
            {result.vip && (
              <span className="inline-flex ml-1 relative top-0.25">
                <Image
                  src="https://cdn.myanonamouse.net/pic/vip.png"
                  alt="VIP"
                  width={14}
                  height={14}
                  style={{ height: 14 }}
                  unoptimized
                />
              </span>
            )}
          </div>
          {/* Torrent metadata */}
          <div className="text-sm text-gray-500 mt-1">
            {result.size} • {result.filetypes} • {result.seeders} seeders • {result.downloads} downloads
          </div>
          {/* Determine if torrent has already been snatched */}
          {result.snatched && (
            <div className="text-sm font-bold mt-2" style={{ color: '#bf6952' }}>
              💩 Snatched Already!
            </div>
          )}
        </div>
        {/* Checkmark for selected items */}
        {selectable && selected && (
          <div className="absolute top-3 right-3 bg-pink-400 rounded-full p-1 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
        {/* Torrent action buttons */}
        {!selectable && (
          <div className="flex gap-3 items-center flex-shrink-0">
            <a 
              className="text-pink-400 hover:text-pink-500 transition-colors duration-200 text-sm cursor-pointer" 
              target="_blank" 
              rel="noopener noreferrer"
              href={result.torrentUrl}
            >
              View
            </a>
            <button
              className="rounded-md bg-pink-400 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              disabled={result.snatched}
              onClick={() => onAddItem(result)}
              aria-label={`Download ${result.title}`}
            >
              Download
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

SearchResultItem.propTypes = {
  result: PropTypes.shape({
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
  }).isRequired,
  onAddItem: PropTypes.func,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
  onSelect: PropTypes.func
};