'use client';

import { useState, useCallback } from 'react';
import type { ToastType } from '@/components/ui/Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /**
   * Show a toast notification
   */
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Convenience methods for different toast types
   */
  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning,
  };
}
