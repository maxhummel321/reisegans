"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "info" | "error";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast: () => {} };
  }
  return ctx;
}

let nextId = 1;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timersRef.current[id];
    if (handle) {
      clearTimeout(handle);
      delete timersRef.current[id];
    }
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, tone }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={
              "pointer-events-auto rounded-full px-4 py-2 text-sm shadow-sticker float-in " +
              toneClass(t.tone)
            }
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function toneClass(tone: ToastTone): string {
  switch (tone) {
    case "success":
      return "bg-ink text-cream";
    case "info":
      return "bg-paper text-ink border border-ink/15";
    case "error":
      return "bg-rose text-cream";
  }
}
