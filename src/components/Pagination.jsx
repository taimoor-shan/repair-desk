export default function Pagination({ pagination, label }) {
  if (pagination.totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
      <span className="text-xs text-gray-500">
        Showing {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} {label || 'items'}
      </span>
      <div className="flex items-center gap-2">
        <select
          value={pagination.pageSize}
          onChange={(e) => pagination.changePageSize(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {pagination.pageSizes.map((size) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500 px-2">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
