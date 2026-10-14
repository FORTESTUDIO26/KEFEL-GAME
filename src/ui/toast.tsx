import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Notify = (text: string) => void;
const Ctx = createContext<Notify>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  const notify = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): Notify {
  return useContext(Ctx);
}
