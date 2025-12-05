'use client';

/**
 * Heartbeat hook for player activity tracking
 * Phase 6: Player Recovery & Reconnection
 *
 * Sends periodic heartbeat requests to update player's last_activity_at.
 * Pauses when tab is hidden, resumes immediately on tab focus.
 */

import { useEffect, useRef, useCallback } from 'react';
import { getPlayerId, hasPlayerId } from '@/lib/utils/player-id';
import { HEARTBEAT_INTERVAL_SECONDS } from '@/lib/domain/connection-status';

interface UseHeartbeatOptions {
  /** Whether heartbeat is enabled (default: true) */
  enabled?: boolean;
  /** Callback when heartbeat fails */
  onError?: (error: Error) => void;
  /** Callback when heartbeat succeeds */
  onSuccess?: () => void;
}

/**
 * Hook that sends heartbeat to server every 30 seconds
 *
 * @param options Configuration options
 *
 * @example
 * // In a room or game page
 * useHeartbeat({
 *   enabled: true,
 *   onError: (err) => console.error('Heartbeat failed:', err),
 * });
 */
export function useHeartbeat(options: UseHeartbeatOptions = {}) {
  const { enabled = true, onError, onSuccess } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const lastHeartbeatRef = useRef<number>(0);

  /**
   * Send a heartbeat request to the server
   */
  const sendHeartbeat = useCallback(async () => {
    if (!hasPlayerId()) {
      return;
    }

    try {
      const playerId = getPlayerId();

      const response = await fetch('/api/players/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': playerId,
        },
      });

      if (!response.ok) {
        throw new Error(`Heartbeat failed: ${response.status}`);
      }

      lastHeartbeatRef.current = Date.now();
      onSuccess?.();
    } catch (error) {
      console.error('Heartbeat error:', error);
      onError?.(error instanceof Error ? error : new Error('Heartbeat failed'));
    }
  }, [onError, onSuccess]);

  /**
   * Start the heartbeat interval
   */
  const startHeartbeat = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Send immediate heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_SECONDS * 1000);
  }, [sendHeartbeat]);

  /**
   * Stop the heartbeat interval
   */
  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Handle tab visibility changes
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (!document.hidden) {
        // Tab became visible - send immediate heartbeat
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, sendHeartbeat]);

  /**
   * Start/stop heartbeat based on enabled state
   */
  useEffect(() => {
    if (enabled) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    return () => {
      stopHeartbeat();
    };
  }, [enabled, startHeartbeat, stopHeartbeat]);

  return {
    /** Send a heartbeat immediately */
    sendHeartbeat,
    /** Last successful heartbeat timestamp */
    lastHeartbeat: lastHeartbeatRef.current,
  };
}
