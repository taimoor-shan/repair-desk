// ─── Currency ──────────────────────────────────────────────────────

const CURRENCY_LOCALE_MAP = {
  PKR: 'en-PK',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  INR: 'en-IN',
  AED: 'en-AE',
  SAR: 'en-SA',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'en-JP',
  CNY: 'en-CN',
  KRW: 'en-KR',
  MYR: 'en-MY',
  SGD: 'en-SG',
  LKR: 'en-LK',
  BDT: 'en-BD',
  NPR: 'en-NP',
};

const CURRENCY_DECIMALS = {
  JPY: 0,
  KRW: 0,
  PKR: 0,
};

let _currencyCode = 'EUR';

export function setCurrency(code) {
  if (CURRENCY_LOCALE_MAP[code]) {
    _currencyCode = code;
  }
}

export function getCurrency() {
  return _currencyCode;
}

export function formatCurrency(amount, currencyCode) {
  if (amount == null) return '—';
  const code = currencyCode || _currencyCode;
  const locale = CURRENCY_LOCALE_MAP[code] || 'en-IE';
  const decimals = code in CURRENCY_DECIMALS ? CURRENCY_DECIMALS[code] : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Local calendar date as YYYY-MM-DD.
 * `toISOString()` converts to UTC first, which rolls over at the wrong time
 * for shops in timezones ahead of UTC — daily records must use local dates.
 */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ─── Smart Search ──────────────────────────────────────────────────

/**
 * Rank items by prefix-first matching.
 * Items where any field startsWith(query) come first (A-Z),
 * then items where any field contains(query) but not startsWith (A-Z).
 *
 * @param {Array}  items  - array of objects
 * @param {string} query  - search query
 * @param {string[]} fields - field names to search (null/undefined values treated as '')
 * @returns {Array} ranked results
 */
export function rankPrefixFirst(items, query, fields = ['name']) {
  if (!query || !query.trim()) {
    return [...items].sort((a, b) =>
      (a[fields[0]] || '').localeCompare(b[fields[0]] || '')
    );
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

  const sortFn = (a, b) =>
    (a[fields[0]] || '').localeCompare(b[fields[0]] || '');

  return [...prefix.sort(sortFn), ...contains.sort(sortFn)];
}
