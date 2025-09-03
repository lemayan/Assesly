import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; title?: string; type?: ToastType; timeout?: number };

type ToastCtx = {
  push: (t: Omit<ToastItem, 'id'>) => void;
  remove: (id: number) => void;
};

const ToastContext = createContext<ToastCtx | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const remove = useCallback((id: number) => setItems((it) => it.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = idRef.current++;
    const item: ToastItem = { id, timeout: 3500, ...t };
    setItems((it) => [...it, item]);
    const to = setTimeout(() => remove(id), item.timeout);
    // Safety: clear on unmount via GC of timeout ref; fine for app lifetime
    return () => clearTimeout(to);
  }, [remove]);

  const value = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster items={items} remove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function Toaster({ items, remove }: { items: ToastItem[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`min-w-[240px] max-w-sm rounded shadow-lg px-3 py-2 text-sm border backdrop-blur bg-white/90 dark:bg-gray-900/90 ${
          t.type === 'success' ? 'border-green-500' : t.type === 'error' ? 'border-red-500' : 'border-blue-500'
        }`}>
          {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 inline-block w-2 h-2 rounded-full ${
              t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1">{t.message}</div>
            <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => remove(t.id)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastProvider;
