'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const PIN_KEY = 'cookcap-guest-pin';
const ACTIVE_KEY = 'cookcap-guest-active';

/** Sync read for write gates outside React tree. */
export function isGuestActive(): boolean {
  try {
    return localStorage.getItem(ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

type GuestState = {
  guestActive: boolean;
  hasPin: boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;
  enterGuest: (pin: string) => boolean;
  exitGuest: () => void;
};

const Ctx = createContext<GuestState | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [guestActive, setGuestActive] = useState(false);

  useEffect(() => {
    try {
      setPinHash(localStorage.getItem(PIN_KEY));
      setGuestActive(localStorage.getItem(ACTIVE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const setPin = useCallback((pin: string) => {
    const trimmed = pin.trim();
    if (trimmed.length < 4) return;
    // Light obfuscation — not cryptography; stops casual peek only.
    const hash = btoa(`cookcap:${trimmed}`);
    localStorage.setItem(PIN_KEY, hash);
    setPinHash(hash);
  }, []);

  const clearPin = useCallback(() => {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(ACTIVE_KEY);
    setPinHash(null);
    setGuestActive(false);
  }, []);

  const enterGuest = useCallback(
    (pin: string) => {
      if (!pinHash) return false;
      const ok = btoa(`cookcap:${pin.trim()}`) === pinHash;
      if (ok) {
        localStorage.setItem(ACTIVE_KEY, '1');
        setGuestActive(true);
      }
      return ok;
    },
    [pinHash],
  );

  const exitGuest = useCallback(() => {
    localStorage.removeItem(ACTIVE_KEY);
    setGuestActive(false);
  }, []);

  const value = useMemo(
    () => ({
      guestActive,
      hasPin: Boolean(pinHash),
      setPin,
      clearPin,
      enterGuest,
      exitGuest,
    }),
    [guestActive, pinHash, setPin, clearPin, enterGuest, exitGuest],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuest() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGuest outside GuestProvider');
  return ctx;
}
