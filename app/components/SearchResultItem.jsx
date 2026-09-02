import Image from 'next/image';
import PropTypes from 'prop-types';

export default function SearchResultItem({ result, onAddItem, selectable = false, selected = false, onSelect }) {
  const isSnatched = result.snatched;

  const handleClick = () => {
    if (selectable && onSelect && !isSnatched) {
      onSelect(result);
    } else if (!selectable && onAddItem && !result.snatched) {
      onAddItem(result);
    }
  };

  const borderClasses = result.snatched
    ? 'border-2 border-gray-100 dark:border-zinc-700 opacity-50 cursor-not-allowed'
    : selectable
      ? selected
        ? 'border-3 border-pink-300 dark:border-pink-600 cursor-pointer'
        : 'border-2 border-gray-100 dark:border-zinc-700 hover:border-pink-200 dark:hover:border-pink-700 cursor-pointer'
      : 'border-2 border-gray-100 dark:border-zinc-700 hover:border-pink-200 dark:hover:border-pink-700 cursor-pointer';

  return (
    <li 
      className={`px-4 py-3 rounded-md bg-gray-50 dark:bg-zinc-800 ${borderClasses} mb-4 transition-colors duration-200 relative`}
      onClick={!isSnatched ? handleClick : undefined}
      role={!isSnatched ? 'button' : undefined}
      tabIndex={!isSnatched ? 0 : undefined}
      onKeyDown={!isSnatched ? (e) => {
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
            <div className="font-semibold text-gray-900 dark:text-zinc-100 inline-flex items-center flex-wrap">
              {result.vip && (
                <span className="inline-flex mr-1 relative top-0.25">
                  <Image
                    src="/images/vip.png"
                    alt="VIP"
                    width={14}
                    height={14}
                    style={{ height: 14 }}
                    unoptimized
                  />
                </span>
              )}
              {result.freeleech && (
                <span className="inline-flex mr-1 relative top-0.25">
                  <Image
                    src="/images/freeleech.gif"
                    alt="Freeleech"
                    width={14}
                    height={14}
                    style={{ height: 14 }}
                    unoptimized
                  />
                </span>
              )}
              <span className="mr-1">{result.title}</span>
              <span className="text-gray-600 dark:text-zinc-400 font-normal">
                <span className="mr-1">by</span>
                <span>{result.author}</span>
                {result.narrator && <span> ({result.narrator})</span>}
              </span>
              <a
                href={result.torrentUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex ml-1.5 hover:text-pink-400 transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500 hover:text-pink-400 dark:hover:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
          {/* Torrent metadata */}
          <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {result.size} • {result.filetypes} • {result.seeders} seeders • {result.downloads} downloads
          </div>
          {/* Determine if torrent has already been snatched */}
          {result.snatched && (
            <div className="text-sm font-bold mt-2 text-[#bf6952]">
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
      </div>
    </li>
  );
}

SearchResultItem.propTypes = {
  result: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    narrator: PropTypes.string,
    size: PropTypes.string.isRequired,
    filetypes: PropTypes.string.isRequired,
    seeders: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    downloads: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    torrentUrl: PropTypes.string.isRequired,
    downloadUrl: PropTypes.string.isRequired,
    vip: PropTypes.bool,
    freeleech: PropTypes.bool,
    snatched: PropTypes.bool
  }).isRequired,
  onAddItem: PropTypes.func,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
  onSelect: PropTypes.func
};
