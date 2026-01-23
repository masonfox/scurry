import PropTypes from 'prop-types';

export default function UserStatsBar({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="mt-4 mb-4 px-4 py-3 bg-pink-50 border border-pink-200 rounded-lg">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 text-pink-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">Failed to load user stats: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="mt-4 mb-4 px-4 py-3 bg-pink-50 border border-pink-200 rounded-lg">
      {/* Mobile: 2x2 grid layout with vertical divider */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 text-sm sm:hidden justify-items-center items-center">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">U:</span>
          <span className="text-gray-900 font-semibold">{stats.uploaded}</span>
        </div>
        <div className="row-span-2 border-l border-pink-200 h-full"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">D:</span>
          <span className="text-gray-900 font-semibold">{stats.downloaded}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">R:</span>
          <span className="text-gray-900 font-semibold">{stats.ratio}</span>
        </div>
        {/* Vertical divider spans both rows */}
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">FL:</span>
          <span className="text-gray-900 font-semibold">{stats.flWedges || 0}</span>
        </div>
      </div>

      {/* Desktop: horizontal layout with dots */}
      <div className="hidden sm:flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">Upload:</span>
          <span className="text-gray-900 font-semibold">{stats.uploaded}</span>
        </div>
        <span className="text-gray-400">•</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">Download:</span>
          <span className="text-gray-900 font-semibold">{stats.downloaded}</span>
        </div>
        <span className="text-gray-400">•</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">Ratio:</span>
          <span className="text-gray-900 font-semibold">{stats.ratio}</span>
        </div>
        <span className="text-gray-400">•</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">FL Wedges:</span>
          <span className="text-gray-900 font-semibold">{stats.flWedges || 0}</span>
        </div>
      </div>
    </div>
  );
}

UserStatsBar.propTypes = {
  stats: PropTypes.shape({
    uploaded: PropTypes.string.isRequired,
    downloaded: PropTypes.string.isRequired,
    ratio: PropTypes.string.isRequired,
    username: PropTypes.string,
    flWedges: PropTypes.number
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
};
