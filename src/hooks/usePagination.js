import { useState, useMemo } from 'react';

export default function usePagination(items, options = {}) {
  const {
    defaultPageSize = 10,
    pageSizes = [5, 10, 20, 50],
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return items.slice(startIdx, startIdx + pageSize);
  }, [items, currentPage, pageSize]);

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const totalItems = items.length;

  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const changePageSize = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    items: paginatedItems,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageSizes,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
  };
}
