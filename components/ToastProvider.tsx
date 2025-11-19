"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; title?: string; description: string; type?: "success" | "error" | "info" };

type ToastCtx = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: number) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, ...t } as Toast;
    setToasts((ts) => [...ts, toast]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);
  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-3 right-3 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded shadow px-3 py-2 text-sm max-w-sm border bg-white ${
              t.type === "error" ? "border-red-300" : t.type === "success" ? "border-green-300" : "border-neutral-200"
            }`}
          >
            {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
            <div>{t.description}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

