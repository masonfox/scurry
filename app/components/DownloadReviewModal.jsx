import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { HardDrive, FileType, Users, UserMinus, Download, Calendar, ExternalLink } from 'lucide-react';
import TagPills from './TagPills';
import WedgeToggleButton from './WedgeToggleButton';
import { parseSizeToBytes, calculateNewRatio, calculateRatioDiff } from '@/src/lib/utilities';

/**
 * Format a date string (e.g. "2025-09-25") into a readable date with relative time.
 * Returns something like "Sep 25, 2025 (3mo ago)" or null if the input is falsy/invalid.
 */
function formatAddedDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return null;

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relative;
  if (diffDays < 0) {
    relative = 'in the future';
  } else if (diffDays === 0) {
    relative = 'today';
  } else if (diffDays === 1) {
    relative = '1d ago';
  } else if (diffDays < 30) {
    relative = `${diffDays}d ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    relative = `${months}mo ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    relative = `${years}y ago`;
  }

  return `${formatted} (${relative})`;
}

/**
 * DownloadReviewModal — responsive download review step.
 * Desktop: centered modal with backdrop.
 * Mobile: slide-up bottomsheet.
 *
 * Supports single-item and dual-item (book + audiobook) downloads.
 *
 * Props:
 * - items: array of { result, category, useWedge, onToggleWedge } objects (1 or 2)
 * - userStats: user stats for ratio projection
 * - settings: tag/category settings from API
 * - onConfirm: (items, perItemTags) => void  — perItemTags is an array parallel to items
 * - onCancel: () => void
 * - loading: boolean (download in progress)
 */
export default function DownloadReviewModal({
  items,
  userStats,
  settings,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const tagsEnabled = settings?.tags?.enabled || false;
  const availableTags = settings?.tags?.available || [];

  // Determine default tags for a single item based on its category
  const [selectedTagsPerItem, setSelectedTagsPerItem] = useState(() => {
    if (!tagsEnabled || availableTags.length === 0) return items.map(() => []);
    const defaults = settings?.tags?.defaults || {};
    return items.map((item) => {
      const cat = item.category || '';
      const defs = defaults[cat] || [];
      return Array.isArray(defs) ? defs.filter((d) => d && availableTags.includes(d)) : [];
    });
  });
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading && !isClosing) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [loading, isClosing]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleToggleTag = (tag, itemIndex) => {
    setSelectedTagsPerItem((prev) =>
      prev.map((tags, i) =>
        i === itemIndex
          ? tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
          : tags
      )
    );
  };

  const handleConfirm = () => {
    onConfirm(items, selectedTagsPerItem);
  };

  const handleClose = () => {
    if (loading || isClosing) return;
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onCancel();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current && !loading && !isClosing) {
      handleClose();
    }
  };

  const isDual = items.length > 1;

  // Calculate projected ratio
  const computeRatioInfo = () => {
    if (!userStats) return null;
    const uploadedBytes = parseSizeToBytes(userStats.uploaded);
    const downloadedBytes = parseSizeToBytes(userStats.downloaded);
    if (uploadedBytes === null || downloadedBytes === null) return null;

    let bytesForRatio = 0;
    for (const item of items) {
      const sizeBytes = parseSizeToBytes(item.result.size);
      if (!sizeBytes) continue;
      const isFL = item.useWedge || item.result.freeleech;
      if (!isFL) bytesForRatio += sizeBytes;
    }

    if (bytesForRatio === 0) return { display: 'No Change', newRatio: null, diff: null };

    const newRatio = calculateNewRatio(uploadedBytes, downloadedBytes, bytesForRatio);
    const diff = calculateRatioDiff(uploadedBytes, downloadedBytes, bytesForRatio);
    return { newRatio, diff };
  };

  const ratioInfo = computeRatioInfo();
  const hasWedges = userStats?.flWedges > 0;

  return (
    <>
      {/* Backdrop + container: modal on md+, bottomsheet on mobile */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm ${
          isClosing ? 'animate-[backdrop-fade-out_0.2s_ease-out_forwards]' : 'animate-[backdrop-fade-in_0.2s_ease-out_forwards]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Download review"
      >
        {/* Panel */}
        <div 
          ref={panelRef}
          onAnimationEnd={handleAnimationEnd}
          className={`w-full md:w-auto md:min-w-[480px] md:max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl md:rounded-xl shadow-xl max-h-[85vh] md:max-h-[80vh] overflow-y-auto ${
            isClosing
              ? 'animate-[modal-slide-down_0.25s_ease-out_forwards] md:animate-[modal-fade-scale-out_0.2s_ease-out_forwards]'
              : 'animate-[modal-slide-up_0.25s_ease-out_forwards] md:animate-[modal-fade-scale-in_0.2s_ease-out_forwards]'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-zinc-800 p-4 pb-3 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between z-10">
            {/* Drag handle on mobile */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full md:hidden" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mt-2 md:mt-0">
              Review Download
            </h2>
            <button
              onClick={handleClose}
              disabled={loading || isClosing}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Close review"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-zinc-400">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Item cards */}
            {items.map((item, idx) => (
              <ItemCard
                key={item.result.id}
                item={item}
                userStats={userStats}
                hasWedges={hasWedges}
                isDual={isDual}
                label={isDual ? (item.category === 'audiobooks' ? 'Audiobook' : 'Book') : null}
                tagsEnabled={isDual ? tagsEnabled : false}
                availableTags={availableTags}
                selectedTags={selectedTagsPerItem[idx]}
                onToggleTag={(tag) => handleToggleTag(tag, idx)}
              />
            ))}

            {/* Tag selection — single download only (dual renders tags inside each card) */}
            {!isDual && tagsEnabled && availableTags.length > 0 && (
              <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-100 dark:border-zinc-600">
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-300 mb-2">Tags</label>
                <TagPills
                  availableTags={availableTags}
                  selectedTags={selectedTagsPerItem[0]}
                  onToggleTag={(tag) => handleToggleTag(tag, 0)}
                />
              </div>
            )}

            {/* Ratio impact */}
            {ratioInfo && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-100 dark:border-zinc-600 text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Ratio Impact</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  {ratioInfo.display === 'No Change' ? <span className="text-green-600 dark:text-green-400">{ratioInfo.display}</span> : (
                    <>{ratioInfo.newRatio} <span className="text-red-500 dark:text-red-400">({ratioInfo.diff})</span></>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-zinc-800 p-4 pt-3 border-t border-gray-100 dark:border-zinc-700 flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading || isClosing}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold bg-pink-400 text-white rounded-md hover:bg-pink-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Individual item card within the review modal.
 */
function ItemCard({ item, userStats, hasWedges, isDual, label, tagsEnabled, availableTags, selectedTags, onToggleTag }) {
  const { result, useWedge, onToggleWedge } = item;
  const showWedgeToggle = hasWedges && !result.snatched && !result.freeleech && !result.vip;
  const addedDateDisplay = formatAddedDate(result.addedDate);

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-100 dark:border-zinc-600">
      {/* Category label for dual mode */}
      {label && (
        <div className="text-xs font-medium text-pink-500 dark:text-pink-400 uppercase tracking-wide mb-1.5">
          {label}
        </div>
      )}

      {/* Title row with FL Wedge toggle aligned right */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-zinc-100 text-base">
            {result.vip && (
              <span className="inline-flex align-middle mr-1">
                <Image src="/images/vip.png" alt="VIP" width={14} height={14} style={{ height: 14 }} unoptimized />
              </span>
            )}
            {result.freeleech && (
              <span className="inline-flex align-middle mr-1">
                <Image src="/images/freeleech.gif" alt="Freeleech" width={14} height={14} style={{ height: 14 }} unoptimized />
              </span>
            )}
            <span>{result.title}</span>
            {result.torrentUrl && (
              <a
                href={result.torrentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex align-start ml-1 hover:text-pink-400 transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
                aria-label="View on MAM"
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500 hover:text-pink-400 dark:hover:text-pink-400" />
              </a>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            by {result.author}
          </div>
        </div>

        {/* FL Wedge toggle — top-right of card */}
        {showWedgeToggle && (
          <div className="flex-shrink-0">
            <WedgeToggleButton
              active={useWedge}
              onClick={(e) => { e.stopPropagation(); onToggleWedge(); }}
              size={isDual ? 'large' : 'small'}
            />
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        <div className="flex items-center gap-1.5 text-xs">
          <HardDrive className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-medium text-gray-600 dark:text-zinc-300">{result.size}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-medium text-gray-600 dark:text-zinc-300">{result.seeders} seeders</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-medium text-gray-600 dark:text-zinc-300">{result.downloads} downloads</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <UserMinus className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-medium text-gray-600 dark:text-zinc-300">{result.leechers} leechers</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <FileType className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-medium text-gray-600 dark:text-zinc-300">{result.filetypes}</span>
        </div>
        {addedDateDisplay && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
            <span className="font-medium text-gray-600 dark:text-zinc-300">{addedDateDisplay}</span>
          </div>
        )}
      </div>

      {/* Per-item tag selection */}
      {tagsEnabled && availableTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-600">
          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-300 mb-2">Tags</label>
          <TagPills
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={onToggleTag}
          />
        </div>
      )}
    </div>
  );
}

ItemCard.propTypes = {
  item: PropTypes.shape({
    result: PropTypes.object.isRequired,
    category: PropTypes.string,
    useWedge: PropTypes.bool,
    onToggleWedge: PropTypes.func,
  }).isRequired,
  userStats: PropTypes.object,
  hasWedges: PropTypes.bool,
  isDual: PropTypes.bool,
  label: PropTypes.string,
  tagsEnabled: PropTypes.bool,
  availableTags: PropTypes.arrayOf(PropTypes.string),
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  onToggleTag: PropTypes.func,
};

DownloadReviewModal.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      result: PropTypes.object.isRequired,
      category: PropTypes.string,
      useWedge: PropTypes.bool,
      onToggleWedge: PropTypes.func,
    })
  ).isRequired,
  userStats: PropTypes.object,
  settings: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
