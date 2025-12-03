'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-good/90 border-good text-white',
  error: 'bg-evil/90 border-evil text-white',
  info: 'bg-avalon-navy border-avalon-gold text-avalon-parchment',
  warning: 'bg-yellow-500/90 border-yellow-400 text-avalon-midnight',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

/**
 * Toast notification component
 */
export function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        max-w-sm w-[calc(100%-2rem)] sm:w-auto
        flex items-center gap-3 px-4 py-3
        rounded-lg border shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out
        ${typeStyles[type]}
        ${isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
        }
      `}
      role="alert"
    >
      <span className="text-lg font-bold">{typeIcons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-lg opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Toast container for managing multiple toasts
 */
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
