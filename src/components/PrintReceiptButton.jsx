import { useEffect, useRef, useState } from 'react';

const VARIANTS = {
  default: {
    button: 'text-gray-700 bg-white hover:bg-gray-50',
    container: 'border border-gray-300',
    divider: 'border-gray-300',
  },
  muted: {
    button: 'text-gray-700 bg-gray-100 hover:bg-gray-200',
    container: '',
    divider: 'border-gray-300/60',
  },
  success: {
    button: 'text-gray-700 bg-green-50 hover:bg-green-100',
    container: '',
    divider: 'border-green-200',
  },
};

export default function PrintReceiptButton({
  label = 'Print Receipt',
  onPrint,
  variant = 'default',
  fullWidth = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const styles = VARIANTS[variant] || VARIANTS.default;
  const widthClass = fullWidth ? 'w-full' : '';

  useEffect(() => {
    if (!open) return;

    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handlePrint(layout) {
    onPrint(layout);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${widthClass} ${className}`.trim()}
    >
      <div className={`inline-flex overflow-hidden rounded-lg ${fullWidth ? 'w-full' : ''} ${styles.container}`}>
        <button
          type="button"
          onClick={() => handlePrint('a4')}
          className={`flex-1 px-4 text-sm font-medium ${styles.button} ${fullWidth ? 'py-2.5' : 'py-2'}`}
        >
          {label}
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More print options"
          onClick={() => setOpen((prev) => !prev)}
          className={`border-l px-2 ${styles.button} ${styles.divider} ${fullWidth ? 'py-2.5' : 'py-2'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handlePrint('thermal')}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Thermal 80mm
          </button>
        </div>
      )}
    </div>
  );
}
