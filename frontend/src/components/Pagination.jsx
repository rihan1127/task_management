import Button from './Button';
import classNames from 'classnames';

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  isLoading = false
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisible = 7;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
      >
        ← Previous
      </Button>

      {startPage > 1 && (
        <>
          <PageNumber page={1} currentPage={page} onClick={() => onPageChange(1)} />
          {startPage > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {pageNumbers.map(num => (
        <PageNumber
          key={num}
          page={num}
          currentPage={page}
          onClick={() => onPageChange(num)}
        />
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
          <PageNumber page={totalPages} currentPage={page} onClick={() => onPageChange(totalPages)} />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={page === totalPages || isLoading}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </Button>
    </div>
  );
};

const PageNumber = ({ page, currentPage, onClick }) => (
  <button
    onClick={onClick}
    className={classNames(
      'w-10 h-10 rounded-lg font-medium transition-colors',
      page === currentPage
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    )}
  >
    {page}
  </button>
);

// Loading Skeleton
export const LoadingSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(columns)].map((_, j) => (
            <div
              key={j}
              className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative w-12 h-12">
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  );
};
