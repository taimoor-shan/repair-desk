import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function BellIcon({ direction = 'down' }) {
  const { notifications, unreadCount, dismissNotification, markAllRead, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!bellRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 flex flex-col ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => { markAllRead(); setOpen(false); }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => { clearAll(); setOpen(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => dismissNotification(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.createdAt)}
                    {!n.read && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
