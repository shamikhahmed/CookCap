'use client';

import { useCallback, useState } from 'react';
import { useApp } from '@/components/app/AppStore';
import { markOnboardingDone, sanitizeOwnerName } from '@/lib/edition';
import { makeProfile } from '@/lib/profiles/types';
import type { ModeId } from '@/lib/profiles/types';

export type OnboardStep = 'welcome' | 'name' | 'profile' | 'mode' | 'reveal';

export const QUICK_MODES: { id: ModeId; label: string; blurb: string }[] = [
  { id: 'reader', label: 'Reader', blurb: 'Pure book — no scoring.' },
  { id: 'plate', label: 'My Plate', blurb: 'Macros & goal-fit picks.' },
  { id: 'mother', label: 'Mother', blurb: 'Cook for others safely.' },
];

const ORDER: OnboardStep[] = ['welcome', 'name', 'profile', 'mode', 'reveal'];

export function useOnboardingSteps(onComplete: (name: string) => void) {
  const { upsertProfile, setMode, setActiveProfileId, soundOn, reportStorageError } = useApp();
  const [step, setStep] = useState<OnboardStep>('welcome');
  const [ownerName, setOwnerName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [pickedMode, setPickedMode] = useState<ModeId | null>(null);
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [busy, setBusy] = useState(false);

  const stepIndex = ORDER.indexOf(step);
  const progressLabel =
    step === 'reveal' ? 'Opening your book' : `Step ${Math.min(stepIndex + 1, 4)} of 4`;

  const goBack = useCallback(() => {
    setError('');
    setProfileError('');
    if (step === 'name') setStep('welcome');
    else if (step === 'profile') setStep('name');
    else if (step === 'mode') setStep('profile');
  }, [step]);

  const finish = useCallback(
    (modeId?: ModeId | null) => {
      const bookName = sanitizeOwnerName(ownerName);
      if (!bookName) return;
      if (modeId) setMode(modeId);
      markOnboardingDone();
      onComplete(bookName);
    },
    [ownerName, onComplete, setMode],
  );

  /** Welcome "Set up later" — unnamed edition (Our Family Cookbook), never Family Cooks. */
  const setupLater = useCallback(() => {
    setMode('reader');
    markOnboardingDone();
    onComplete('');
  }, [onComplete, setMode]);

  const skipAll = useCallback(() => {
    const bookName = sanitizeOwnerName(ownerName);
    if (!bookName) {
      setupLater();
      return;
    }
    setMode('reader');
    markOnboardingDone();
    onComplete(bookName);
  }, [ownerName, onComplete, setMode, setupLater]);

  const submitWelcome = useCallback(() => setStep('name'), []);

  const submitName = useCallback(() => {
    const name = sanitizeOwnerName(ownerName);
    if (!name) {
      setError('Enter a first name (or nickname).');
      return false;
    }
    setProfileName((p) => p || name);
    setError('');
    setStep('profile');
    return true;
  }, [ownerName]);

  const createProfile = useCallback(async () => {
    const name = profileName.trim();
    if (!name) {
      setProfileError('Enter a name for this eater.');
      return false;
    }
    setBusy(true);
    try {
      const profile = makeProfile({ name });
      await upsertProfile(profile);
      setActiveProfileId(profile.id);
      setProfileError('');
      setStep('mode');
      return true;
    } catch {
      setProfileError('Could not save profile on this device.');
      reportStorageError('Could not save profile on this device.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [profileName, upsertProfile, setActiveProfileId, reportStorageError]);

  const skipProfile = useCallback(() => {
    setProfileError('');
    setStep('mode');
  }, []);

  const pickMode = useCallback(
    (id: ModeId) => {
      setPickedMode(id);
      setStep('reveal');
    },
    [],
  );

  const skipMode = useCallback(() => {
    setPickedMode('reader');
    setStep('reveal');
  }, []);

  /** Call when reveal animation completes (or immediately in Simple). */
  const completeReveal = useCallback(() => {
    finish(pickedMode ?? 'reader');
  }, [finish, pickedMode]);

  const previewName = sanitizeOwnerName(ownerName);

  return {
    step,
    setStep,
    ownerName,
    setOwnerName,
    profileName,
    setProfileName,
    pickedMode,
    error,
    setError,
    profileError,
    setProfileError,
    busy,
    soundOn,
    progressLabel,
    stepIndex,
    previewName,
    goBack,
    submitWelcome,
    submitName,
    createProfile,
    skipProfile,
    pickMode,
    skipMode,
    skipAll,
    setupLater,
    completeReveal,
    finish,
  };
}

export type OnboardingApi = ReturnType<typeof useOnboardingSteps>;
