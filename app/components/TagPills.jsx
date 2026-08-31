import PropTypes from 'prop-types';

/**
 * Tag pill selector for the download review step.
 * Renders available tags as toggleable pills. Supports multi-select.
 */
export default function TagPills({ availableTags, selectedTags, onToggleTag }) {
  if (!availableTags || availableTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer ${
              isSelected
                ? 'bg-pink-400 text-white border border-pink-400'
                : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-600'
            }`}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? 'Remove' : 'Add'} tag: ${tag}`}
          >
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

TagPills.propTypes = {
  availableTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleTag: PropTypes.func.isRequired,
};
