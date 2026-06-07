import { useEffect, useRef, useState } from 'react';

/**
 * Reusable search dropdown overlay.
 *
 * Props:
 * @param {Array}    results      - matched items
 * @param {Function} onSelect     - called with item on click/Enter
 * @param {Function} renderItem   - (item) => JSX for each row
 * @param {boolean}  isLoading    - show spinner
 * @param {string}   emptyMessage - text when no results (default: "No results")
 * @param {number}   maxItems     - visible limit (default 8)
 * @param {Function} onClose      - close callback
 */
export default function SearchDropdown({
  results = [],
  onSelect,
  renderItem,
  isLoading = false,
  emptyMessage = 'No results',
  maxItems = 8,
  onClose,
}) {
  const [cursor, setCursor] = useState(-1);
  const listRef = useRef(null);

  const visible = results.slice(0, maxItems);
  const hasMore = results.length > maxItems;

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (listRef.current && !listRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        setCursor((prev) => Math.min(prev + 1, visible.length - 1));
      } else if (e.key === 'ArrowUp') {
        setCursor((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && cursor >= 0 && visible[cursor]) {
        onSelect(visible[cursor]);
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, cursor, onSelect, onClose]);

  // Reset cursor when results change
  useEffect(() => {
    setCursor(-1);
  }, [results]);

  if (isLoading) {
    return (
      <div
        ref={listRef}
        className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Searching...
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        ref={listRef}
        className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg animate-fade-in"
    >
      <div className="max-h-60 overflow-auto">
        {visible.map((item, idx) => (
          <button
            key={item.id ?? idx}
            type="button"
            className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 transition-colors ${
              idx === cursor
                ? 'bg-blue-50 text-blue-900'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setCursor(idx)}
          >
            {renderItem(item)}
          </button>
        ))}
      </div>
      {hasMore && (
        <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          Showing {maxItems} of {results.length} matches
        </div>
      )}
    </div>
  );
}
