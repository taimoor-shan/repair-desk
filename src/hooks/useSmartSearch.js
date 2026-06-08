import { useState, useEffect, useMemo, useRef } from 'react';
import useDebounce from './useDebounce';

/**
 * Prefetch + smart search hook for instant client-side filtering.
 *
 * @param {Function} fetchFn       async function returning all items
 * @param {string[]} searchFields   field names to search (e.g. ['name', 'phone'])
 * @param {number}   debounceMs     debounce delay (default 300)
 * @returns {{ query, setQuery, debouncedQuery, results, isLoading, hasResults }}
 */
export default function useSmartSearch(fetchFn, searchFields, debounceMs = 300) {
  const [allItems, setAllItems] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const debouncedQuery = useDebounce(query, debounceMs);
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  // Prefetch all data on mount
  useEffect(() => {
    let cancelled = false;
    fetchRef.current().then((items) => {
      if (!cancelled) {
        setAllItems(items || []);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchFieldsKey = JSON.stringify(searchFields);

  // Filter + rank results when debouncedQuery or allItems change
  const { results, hasResults } = useMemo(() => (
    rankItems(allItems, JSON.parse(searchFieldsKey), debouncedQuery)
  ), [allItems, searchFieldsKey, debouncedQuery]);

  return { query, setQuery, debouncedQuery, results, isLoading, hasResults };
}

function rankItems(items, fields, query) {
  if (!query || !query.trim()) {
    // On empty query: return full dataset, sorted alphabetically by first field
    const sorted = sortAlphabetically(items, fields[0]);
    return { results: sorted, hasResults: items.length > 0 };
  }

  const lower = query.toLowerCase().trim();
  const prefix = [];
  const contains = [];

  items.forEach((item) => {
    const fieldValues = fields.map((f) => (item[f] || '').toLowerCase());
    const isPrefix = fieldValues.some((f) => f.startsWith(lower));
    const isContains = fieldValues.some((f) => f.includes(lower));

    if (isPrefix) {
      prefix.push(item);
    } else if (isContains) {
      contains.push(item);
    }
  });

  const ranked = [
    ...sortAlphabetically(prefix, fields[0]),
    ...sortAlphabetically(contains, fields[0]),
  ];

  return { results: ranked, hasResults: ranked.length > 0 };
}

function sortAlphabetically(arr, field) {
  return [...arr].sort((a, b) =>
    (a[field] || '').localeCompare(b[field] || '')
  );
}
