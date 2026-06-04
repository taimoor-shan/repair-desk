import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProducts } from '../lib/api';

const NotificationContext = createContext();

const STORAGE_KEY = 'rd_notifications';

export function useNotifications() {
  return useContext(NotificationContext);
}

let nextId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        nextId = Math.max(nextId, ...parsed.map((n) => n.id || 0));
        return parsed;
      }
    } catch { /* corrupt data, start fresh */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((productId, message, type = 'info') => {
    setNotifications((prev) => {
      const already = prev.some((n) => n.productId === productId && n.type === type && !n.read);
      if (already) return prev;
      const id = ++nextId;
      return [{ id, productId, message, type, read: false, createdAt: Date.now() }, ...prev];
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Low-stock scan on mount
  useEffect(() => {
    getProducts()
      .then((products) => {
        setNotifications((prev) => {
          let next = [...prev];
          const lowStockProductIds = new Set();

          for (const p of products) {
            const threshold = p.lowStockThreshold || 5;
            if (p.stock <= threshold) {
              lowStockProductIds.add(p.id);
              const exists = next.some((n) => n.productId === p.id && n.type === 'low_stock' && !n.read);
              if (!exists) {
                const msg = p.stock === 0
                  ? `${p.name} is out of stock`
                  : `${p.name} is low on stock (${p.stock} left)`;
                next.unshift({
                  id: ++nextId,
                  productId: p.id,
                  message: msg,
                  type: 'low_stock',
                  read: false,
                  createdAt: Date.now(),
                });
              }
            }
          }

          // Auto-dismiss notifications for products no longer low on stock
          next = next.filter((n) => {
            if (n.type !== 'low_stock') return true;
            if (n.productId == null) return true;
            if (!lowStockProductIds.has(n.productId)) return false;
            return true;
          });

          return next;
        });
      })
      .catch((err) => {
        console.error('Notification scan failed:', err);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, dismissNotification, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
