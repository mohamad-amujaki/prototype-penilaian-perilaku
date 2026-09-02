import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "error";
type Item = { id: number; message: string; tone: Tone };

const Ctx = createContext<{
  push: (message: string, tone?: Tone) => void;
}>({ push: () => {} });

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = ++seq;
    setItems((list) => [...list.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="ui-toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`ui-toast ${t.tone === "error" ? "ui-toast-error" : "ui-toast-ok"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
