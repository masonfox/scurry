import SearchResultItem from './SearchResultItem';
import PropTypes from 'prop-types';

export default function SearchResultsList({ results, onAddItem, loading, userStats }) {
  if (!loading && results.length === 0) {
    return <p className="text-gray-500 mt-5">☝️ Try a search to see results...</p>;
  }

  return (
    <ul className="list-none p-0 mt-6" role="list" aria-label="Search results">
      {results.map((result) => (
        <SearchResultItem 
          key={result.id} 
          result={result} 
          onAddItem={onAddItem}
          userStats={userStats}
        />
      ))}
    </ul>
  );
}

SearchResultsList.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddItem: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  userStats: PropTypes.shape({
    uploaded: PropTypes.string,
    downloaded: PropTypes.string,
    ratio: PropTypes.string
  })
};