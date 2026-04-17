'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const TOAST_DURATION = 4000;

function ToastContainer({
  toasts,
  exiting,
  removeToast,
}: {
  toasts: Toast[];
  exiting: Set<string>;
  removeToast: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const colorMap: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.35)',
      icon: '#22c55e',
    },
    error: {
      bg: 'rgba(226, 78, 89, 0.15)',
      border: 'rgba(226, 78, 89, 0.35)',
      icon: '#E24E59',
    },
    info: {
      bg: 'rgba(18, 112, 227, 0.15)',
      border: 'rgba(18, 112, 227, 0.35)',
      icon: '#1270E3',
    },
  };

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes toast-enter {
          0% { opacity: 0; transform: translateX(40px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toast-exit {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(40px) scale(0.95); }
        }
      `}</style>
      <div
        id="toast-container"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: 400,
          minWidth: 280,
        }}
      >
        {toasts.map((t) => {
          const colors = colorMap[t.type];
          const isExiting = exiting.has(t.id);

          return (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderRadius: 14,
                backgroundColor: colors.bg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                animation: isExiting
                  ? 'toast-exit 0.3s ease-in forwards'
                  : 'toast-enter 0.35s ease-out',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.icon,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: colors.bg,
                  flexShrink: 0,
                }}
              >
                {iconMap[t.type]}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#f1f5f9',
                  lineHeight: '1.4',
                }}
              >
                {t.message}
              </span>
            </div>
          );
        })}
      </div>
    </>,
    document.body
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} exiting={exiting} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
