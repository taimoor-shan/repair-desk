import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    confirmVariant: 'red',
    onConfirm: null,
  });

  const confirm = useCallback((title, message, opts = {}) => {
    const { confirmLabel = 'Delete', confirmVariant = 'red' } = opts;
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        confirmVariant,
        onConfirm: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {state.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{state.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={state.onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={state.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  state.confirmVariant === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
