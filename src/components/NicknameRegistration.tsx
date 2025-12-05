'use client';

/**
 * NicknameRegistration Component
 * Phase 6: Player Recovery & Reconnection
 *
 * Modal for registering a new player with a globally unique nickname.
 */

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  validateNickname,
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH
} from '@/lib/domain/nickname-validation';
import { getPlayerId, setStoredNickname } from '@/lib/utils/player-id';
import type { CheckNicknameResponse, RegisterResponse, RegisterErrorResponse } from '@/types/player';

interface NicknameRegistrationProps {
  isOpen: boolean;
  onRegistered: (nickname: string) => void;
}

export function NicknameRegistration({ isOpen, onRegistered }: NicknameRegistrationProps) {
  const [nickname, setNickname] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<'unknown' | 'available' | 'taken'>('unknown');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounced nickname check
  const checkAvailability = useCallback(async (nicknameToCheck: string) => {
    if (!nicknameToCheck || nicknameToCheck.length < NICKNAME_MIN_LENGTH) {
      setAvailability('unknown');
      return;
    }

    // Validate locally first
    const validation = validateNickname(nicknameToCheck);
    if (!validation.valid) {
      setValidationError(validation.errors[0]);
      setAvailability('unknown');
      return;
    }

    setValidationError(null);
    setIsChecking(true);

    try {
      const response = await fetch(
        `/api/players/check-nickname?nickname=${encodeURIComponent(nicknameToCheck)}`
      );
      const data: CheckNicknameResponse = await response.json();

      // Only update if nickname hasn't changed
      setAvailability(data.available ? 'available' : 'taken');
      if (!data.available && data.message) {
        setValidationError(data.message);
      }
    } catch {
      console.error('Error checking nickname availability');
      setAvailability('unknown');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Debounce the availability check
  useEffect(() => {
    const trimmed = nickname.trim();

    // Reset state when nickname changes
    setAvailability('unknown');
    setSubmitError(null);

    // Quick local validation
    if (trimmed.length > 0 && trimmed.length < NICKNAME_MIN_LENGTH) {
      setValidationError(`Nickname must be at least ${NICKNAME_MIN_LENGTH} characters`);
      return;
    }

    if (trimmed.length > NICKNAME_MAX_LENGTH) {
      setValidationError(`Nickname must be at most ${NICKNAME_MAX_LENGTH} characters`);
      return;
    }

    setValidationError(null);

    // Debounce API call
    const timer = setTimeout(() => {
      if (trimmed.length >= NICKNAME_MIN_LENGTH) {
        checkAvailability(trimmed);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nickname, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = nickname.trim();

    // Final validation
    const validation = validateNickname(trimmed);
    if (!validation.valid) {
      setValidationError(validation.errors[0]);
      return;
    }

    if (availability !== 'available') {
      setValidationError('Please choose an available nickname');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const playerId = getPlayerId();

      const response = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: trimmed,
          player_id: playerId,
        }),
      });

      const data = await response.json() as RegisterResponse | RegisterErrorResponse;

      if (data.success) {
        // Store nickname in localStorage
        setStoredNickname(trimmed);
        onRegistered(trimmed);
      } else {
        const errorData = data as RegisterErrorResponse;
        setSubmitError(errorData.message);
        if (errorData.error === 'NICKNAME_TAKEN') {
          setAvailability('taken');
        }
      }
    } catch {
      setSubmitError('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    nickname.trim().length >= NICKNAME_MIN_LENGTH &&
    availability === 'available' &&
    !validationError &&
    !isChecking &&
    !isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot close - must register
      title="Welcome to Avalon Online"
      showCloseButton={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-avalon-text-secondary">
          Choose a unique nickname to identify yourself. This nickname will be used to
          recover your game session if you switch devices or browsers.
        </p>

        <div className="space-y-2">
          <label htmlFor="nickname" className="block text-sm font-medium text-avalon-text">
            Nickname
          </label>
          <div className="relative">
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={NICKNAME_MAX_LENGTH}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-avalon-dark-lighter border-2
                text-avalon-text placeholder-avalon-text-muted
                focus:outline-none focus:ring-2 focus:ring-avalon-accent
                transition-colors
                ${validationError || availability === 'taken'
                  ? 'border-red-500'
                  : availability === 'available'
                    ? 'border-green-500'
                    : 'border-avalon-dark-border'
                }
              `}
              disabled={isSubmitting}
              autoFocus
            />

            {/* Status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking && (
                <svg className="animate-spin h-5 w-5 text-avalon-text-muted" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {!isChecking && availability === 'available' && (
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!isChecking && availability === 'taken' && (
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>

          {/* Character count */}
          <div className="flex justify-between text-xs text-avalon-text-muted">
            <span>Letters, numbers, underscores, and hyphens only</span>
            <span>{nickname.length}/{NICKNAME_MAX_LENGTH}</span>
          </div>

          {/* Validation/availability message */}
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}
          {!validationError && availability === 'available' && (
            <p className="text-sm text-green-400">Nickname is available!</p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`
            w-full py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${canSubmit
              ? 'bg-avalon-accent hover:bg-avalon-accent-hover text-white'
              : 'bg-avalon-dark-lighter text-avalon-text-muted cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? 'Registering...' : 'Continue'}
        </button>

        <p className="text-xs text-center text-avalon-text-muted">
          By continuing, you agree to use a respectful nickname.
          Your nickname cannot be changed later.
        </p>
      </form>
    </Modal>
  );
}
