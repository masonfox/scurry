import Image from 'next/image';
import PropTypes from 'prop-types';
import { parseSizeToBytes, calculateNewRatio, calculateRatioDiff } from '@/src/lib/utilities';
import WedgeToggleButton from './WedgeToggleButton';

export default function SearchResultItem({ result, onAddItem, selectable = false, selected = false, onSelect, userStats, useWedge = false, onToggleWedge }) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(result);
    }
  };

  const handleToggleWedge = (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    if (onToggleWedge) {
      onToggleWedge(result.id);
    }
  };

  const hasWedges = userStats?.flWedges > 0;

  // Calculate projected ratio if user stats are available
  let projectedRatioDisplay = null;
  if (userStats && result.size) {
    const sizeBytes = parseSizeToBytes(result.size);
    const uploadedBytes = parseSizeToBytes(userStats.uploaded);
    const downloadedBytes = parseSizeToBytes(userStats.downloaded);
    
    if (sizeBytes && uploadedBytes !== null && downloadedBytes !== null) {
      const newRatio = calculateNewRatio(uploadedBytes, downloadedBytes, sizeBytes);
      const diff = calculateRatioDiff(uploadedBytes, downloadedBytes, sizeBytes);
      projectedRatioDisplay = `${newRatio} (${diff})`;
    }
  }

  const borderClasses = selectable
    ? selected
      ? 'border-3 border-pink-300 cursor-pointer'
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
          {/* Basic torrent information */}
          <div className="mb-1">
            <a 
              href={result.torrentUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-pink-400 transition-colors duration-200"
            >
              {result.title}
            </a>
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
          <div className="flex flex-col gap-2 items-end flex-shrink-0 mt-1 md:mt-0">
            <div className="flex gap-2 items-center justify-end w-full md:w-auto">
              {projectedRatioDisplay && !result.snatched && (
                <div className="text-xs text-gray-400 cursor-default md:hidden" title="New ratio after download">
                  {projectedRatioDisplay}
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* FL Wedge toggle button */}
                {hasWedges && !result.snatched && (
                  <WedgeToggleButton
                    active={useWedge}
                    onClick={handleToggleWedge}
                    size="small"
                  />
                )}
                <button
                  className="rounded-md bg-pink-400 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                  disabled={result.snatched}
                  onClick={() => onAddItem(result)}
                  aria-label={`Download ${result.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            </div>
            {projectedRatioDisplay && !result.snatched && (
              <div className="text-xs text-gray-400 cursor-default hidden md:block" title="New ratio after download">
                {projectedRatioDisplay}
              </div>
            )}
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
  onSelect: PropTypes.func,
  userStats: PropTypes.shape({
    uploaded: PropTypes.string,
    downloaded: PropTypes.string,
    ratio: PropTypes.string,
    flWedges: PropTypes.number
  }),
  useWedge: PropTypes.bool,
  onToggleWedge: PropTypes.func
};