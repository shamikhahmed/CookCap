'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BookController, useBook } from './BookController';
import { Book } from './Book';
import { FavoritesDrawer } from './FavoritesDrawer';
import { ShoppingDrawer } from './ShoppingDrawer';
import { MealPlannerDrawer } from './MealPlannerDrawer';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { ImportModal } from '@/components/app/ImportModal';
import { InstallBanner } from '@/components/app/InstallBanner';
import { AssetPreloader } from '@/components/app/AssetPreloader';
import { NameGate } from '@/components/app/NameGate';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { DresserOnboarding } from '@/components/app/DresserOnboarding';
import { Splash } from '@/components/app/Splash';
import { AboutModal } from '@/components/app/AboutModal';
import { useApp } from '@/components/app/AppStore';
import {
  AppearanceButton,
  skinSupportsThemeToggle,
  useAppearance,
} from '@/components/app/Appearance';
import { ProfilesDrawer } from '@/components/profiles/ProfilesDrawer';
import { ModeChooser } from '@/components/profiles/ModeChooser';
import { CalendarDrawer } from '@/components/profiles/CalendarDrawer';
import { PantryDrawer } from '@/components/profiles/PantryDrawer';
import { Icon } from '@/components/ui/Icon';
import { PRODUCT_NAME, kitchenLine } from '@/lib/edition';
import { getMode } from '@/lib/modes/registry';
import { TopChapterBar } from './BookmarkRail';

/**
 * Application frame — Claude chrome: slim top bar, book + ribbon rail,
 * bottom progress. Heirloom extras live in a quiet overflow menu.
 */
export function Shell() {
  return (
    <BookController>
      <Frame />
    </BookController>
  );
}

function Frame() {
  const { needsName, setOwnerName, storageError, dismissStorageError } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  /** First-run: book paints first, then onboarding. */
  const [welcomeReady, setWelcomeReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState(false);
  /** Gate / QA: localStorage cookcap-force-dresser=1 keeps 3D dresser on low-CPU CI. */
  const [forceDresser, setForceDresser] = useState(false);

  useEffect(() => {
    if (!needsName) {
      setWelcomeReady(false);
      return;
    }
    const t = window.setTimeout(() => setWelcomeReady(true), 480);
    return () => window.clearTimeout(t);
  }, [needsName]);

  useEffect(() => {
    try {
      setLowPower(typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4);
      setForceDresser(localStorage.getItem('cookcap-force-dresser') === '1');
    } catch {
      setLowPower(false);
    }
  }, []);

  const firstRunOpen = Boolean(needsName && welcomeReady);
  const useSimpleOnboard = Boolean(!forceDresser && (reduceMotion || lowPower));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Block book chrome until first-run name path resolves (splash → onboard). */
  const firstRunGate = needsName;

  return (
    <div className="journal-desk flex h-[100dvh] flex-col">
      {storageError && (
        <div
          role="alert"
          className="relative z-[55] shrink-0 border-b border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
        >
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-[color:var(--color-ink-soft)]">{storageError}</p>
            <button
              type="button"
              onClick={dismissStorageError}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div
        className={`flex min-h-0 flex-1 flex-col${firstRunGate ? ' pointer-events-none select-none' : ''}`}
        aria-hidden={firstRunGate || undefined}
      >
        <TopBar
          onSearch={() => setSearchOpen(true)}
          onFavorites={() => setFavOpen(true)}
          onShop={() => setShopOpen(true)}
          onImport={() => setImportOpen(true)}
          onPlan={() => setPlanOpen(true)}
          onRename={() => setRenameOpen(true)}
          onProfiles={() => setProfilesOpen(true)}
          onMode={() => setModeOpen(true)}
          onCalendar={() => setCalendarOpen(true)}
          onPantry={() => setPantryOpen(true)}
          onAbout={() => setAboutOpen(true)}
        />

        <main className="journal-stage relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-0 pt-0 sm:overflow-visible sm:px-6 sm:pr-44 sm:pt-1 md:pr-48 lg:pr-56">
          <TopChapterBar />
          {/* Pure CSS grounding — size from vh on first paint (no parent-% / resize). */}
          <div className="book-stage">
            <div className="book-table">
              <div className="book-contact-shadow" aria-hidden />
              <div className="book-frame">
                <Book />
              </div>
            </div>
          </div>
        </main>

        <BottomBar />
      </div>

      <SearchOverlay
        open={searchOpen && !firstRunGate}
        onClose={() => setSearchOpen(false)}
        onShop={() => setShopOpen(true)}
        onPlan={() => setPlanOpen(true)}
      />
      <FavoritesDrawer open={favOpen && !firstRunGate} onClose={() => setFavOpen(false)} />
      <ShoppingDrawer open={shopOpen && !firstRunGate} onClose={() => setShopOpen(false)} />
      <MealPlannerDrawer
        open={planOpen && !firstRunGate}
        onClose={() => setPlanOpen(false)}
        onShop={() => setShopOpen(true)}
      />
      <ImportModal open={importOpen && !firstRunGate} onClose={() => setImportOpen(false)} />
      <ProfilesDrawer open={profilesOpen && !firstRunGate} onClose={() => setProfilesOpen(false)} />
      <ModeChooser open={modeOpen && !firstRunGate} onClose={() => setModeOpen(false)} />
      <CalendarDrawer open={calendarOpen && !firstRunGate} onClose={() => setCalendarOpen(false)} />
      <PantryDrawer open={pantryOpen && !firstRunGate} onClose={() => setPantryOpen(false)} />
      <AboutModal open={aboutOpen && !firstRunGate} onClose={() => setAboutOpen(false)} />
      <InstallBanner />
      <AssetPreloader />
      <Splash />
      <NameGate
        open={renameOpen && !needsName}
        dismissible
        onDismiss={() => setRenameOpen(false)}
        onSubmit={(name) => {
          setOwnerName(name);
          setRenameOpen(false);
        }}
      />
      {useSimpleOnboard ? (
        <OnboardingFlow
          open={firstRunOpen}
          onComplete={(name) => {
            setOwnerName(name);
          }}
        />
      ) : (
        <DresserOnboarding
          open={firstRunOpen}
          onComplete={(name) => {
            setOwnerName(name);
          }}
        />
      )}
    </div>
  );
}

function TopBar({
  onSearch,
  onFavorites,
  onShop,
  onImport,
  onPlan,
  onRename,
  onProfiles,
  onMode,
  onCalendar,
  onPantry,
  onAbout,
}: {
  onSearch: () => void;
  onFavorites: () => void;
  onShop: () => void;
  onImport: () => void;
  onPlan: () => void;
  onRename: () => void;
  onProfiles: () => void;
  onMode: () => void;
  onCalendar: () => void;
  onPantry: () => void;
  onAbout: () => void;
}) {
  const {
    theme,
    setTheme,
    edition,
    soundOn,
    setSoundOn,
    shoppingCount,
    mode,
    activeProfile,
  } = useApp();
  const { skin } = useAppearance();
  const dark = theme === 'dark';
  const showThemeToggle = skinSupportsThemeToggle(skin);
  const kitchen = kitchenLine(edition);
  const reduce = useReducedMotion();
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const modeDef = getMode(mode);
  const modeLetter = modeDef.label.trim().charAt(0).toUpperCase() || 'R';

  useEffect(() => {
    if (!more) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMore(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [more]);

  return (
    <header className="app-header relative z-50 flex shrink-0 items-center justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 text-[color:var(--color-ink)]">
        <Icon name="book" size={20} />
        <div className="min-w-0 leading-tight">
          <span className="block truncate font-serif text-base font-semibold italic tracking-tight sm:text-lg">
            {PRODUCT_NAME}
          </span>
          {kitchen && (
            <span
              suppressHydrationWarning
              className="block truncate text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)] sm:text-[10px] sm:tracking-[0.2em]"
            >
              {kitchen}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {mode !== 'reader' && (
          <button
            type="button"
            onClick={onProfiles}
            aria-label={
              activeProfile
                ? `Profiles — ${activeProfile.name}`
                : 'Open profiles'
            }
            title={activeProfile?.name ?? 'Profiles'}
            className="grid size-11 place-items-center rounded-full text-[0.7rem] font-semibold text-white transition-transform active:scale-90"
            style={{
              background: activeProfile?.color ?? 'var(--color-accent)',
            }}
          >
            {(activeProfile?.name?.trim().charAt(0) ?? '?').toUpperCase()}
          </button>
        )}
        <button
          type="button"
          onClick={onMode}
          aria-label={`Mode — ${modeDef.label}`}
          title={modeDef.label}
          className="grid size-11 place-items-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)] text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] transition-transform hover:border-[color:var(--color-accent)] active:scale-90"
          style={{ color: modeDef.color }}
        >
          {modeLetter}
        </button>
        <IconBtn label="Search recipes" onClick={onSearch}>
          <Icon name="search" size={20} />
        </IconBtn>
        <AppearanceButton />
        <span className="hidden sm:contents">
          <IconBtn label="Favorites and history" onClick={onFavorites}>
            <Icon name="bookmark" size={20} />
          </IconBtn>
          {showThemeToggle && (
            <IconBtn
              label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              <Icon name={dark ? 'sun-toggle' : 'moon-toggle'} size={20} />
            </IconBtn>
          )}
        </span>

        <div className="relative" ref={moreRef}>
          <IconBtn label="More" onClick={() => setMore((v) => !v)} ariaExpanded={more}>
            <span className="text-lg leading-none" aria-hidden>
              ···
            </span>
          </IconBtn>
          <AnimatePresence>
            {more && (
              <motion.div
                role="menu"
                aria-label="More actions"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: reduce ? 0 : 0.15 }}
                className="absolute right-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] py-1 shadow-[var(--shadow-lg)]"
              >
                {/* Order = IA-RATIONALE: daily tools → lens → authoring → identity → sound → legal */}
                <span className="sm:hidden">
                  <MenuItem
                    label="Favorites & history"
                    onClick={() => {
                      onFavorites();
                      setMore(false);
                    }}
                  />
                  {showThemeToggle && (
                    <MenuItem
                      label={dark ? 'Light mode' : 'Dark mode'}
                      onClick={() => {
                        setTheme(dark ? 'light' : 'dark');
                        setMore(false);
                      }}
                    />
                  )}
                </span>
                <MenuItem
                  label={soundOn ? 'Mute page sound' : 'Page sound on'}
                  onClick={() => {
                    setSoundOn(!soundOn);
                    setMore(false);
                  }}
                />
                <MenuItem
                  label={
                    shoppingCount > 0 ? `Shopping list (${shoppingCount})` : 'Shopping list'
                  }
                  onClick={() => {
                    onShop();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="This week’s meals"
                  onClick={() => {
                    onPlan();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="Profiles"
                  onClick={() => {
                    onProfiles();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="Mode"
                  onClick={() => {
                    onMode();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="Calendar"
                  onClick={() => {
                    onCalendar();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="Pantry & budget"
                  onClick={() => {
                    onPantry();
                    setMore(false);
                  }}
                />
                {mode === 'mother' && (
                  <p className="px-3.5 py-1.5 text-[0.7rem] leading-snug text-[color:var(--color-ink-soft)]">
                    Cooking-for list lives in Profiles.
                  </p>
                )}
                <MenuItem
                  label="Import WhatsApp recipe"
                  onClick={() => {
                    onImport();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="Change book name"
                  onClick={() => {
                    onRename();
                    setMore(false);
                  }}
                />
                <MenuItem
                  label="About & data"
                  onClick={() => {
                    onAbout();
                    setMore(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block min-h-11 w-full px-3.5 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-sunk)]"
    >
      {label}
    </button>
  );
}

function BottomBar() {
  const { index, total, next, prev, atStart, atEnd, locked, turning } = useBook();
  const { ready, customs } = useApp();
  const reduce = useReducedMotion();
  const progress = total > 1 ? index / (total - 1) : 0;
  const busy = locked || turning;
  const extras = customs.length;
  return (
    <footer className="app-footer relative z-30 flex shrink-0 items-center gap-2 sm:gap-4">
      <IconBtn label="Previous page" onClick={prev} disabled={atStart || busy}>
        <Icon name="arrow-left" size={20} />
      </IconBtn>

      <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[color:var(--color-line)]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'var(--color-accent)' }}
          animate={{ width: `${progress * 100}%` }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: 'spring', stiffness: 200, damping: 30 }
          }
        />
      </div>

      <span
        className="min-w-12 text-center text-[11px] tabular-nums text-[color:var(--color-ink-faint)] sm:min-w-14 sm:text-xs"
        title={
          extras > 0
            ? `This edition: ${total} pages (includes ${extras} imported recipe${extras === 1 ? '' : 's'} on this device). Modes that add a For You leaf also change the total.`
            : 'Page in this edition of the book. Total can grow with imported recipes or a For You leaf.'
        }
        aria-live="polite"
      >
        {ready ? `${index + 1} / ${total}` : '…'}
      </span>

      <button
        type="button"
        className="min-h-11 rounded-full px-3 py-2.5 font-serif text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)] sm:hidden disabled:opacity-30"
        aria-label="Open chapter tabs"
        disabled={busy}
        onClick={() => window.dispatchEvent(new Event('cookcap-open-chapters'))}
      >
        Tabs
      </button>

      <IconBtn label="Next page" onClick={next} disabled={atEnd || busy}>
        <Icon name="arrow-right" size={20} />
      </IconBtn>
    </footer>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  ariaExpanded,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-expanded={ariaExpanded}
      title={label}
      className="grid size-11 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-all hover:bg-[color:var(--color-paper-sunk)] hover:text-[color:var(--color-ink)] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
