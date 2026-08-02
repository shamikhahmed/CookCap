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
import { useApp } from '@/components/app/AppStore';
import { Icon } from '@/components/ui/Icon';
import { PRODUCT_NAME } from '@/lib/edition';

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
  const { needsName, setOwnerName } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

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

  return (
    <div className="journal-desk flex h-[100dvh] flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <TopBar
        onSearch={() => setSearchOpen(true)}
        onFavorites={() => setFavOpen(true)}
        onShop={() => setShopOpen(true)}
        onImport={() => setImportOpen(true)}
        onPlan={() => setPlanOpen(true)}
        onRename={() => setRenameOpen(true)}
      />

      <main className="journal-stage relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pr-36 md:pr-40 lg:pr-48">
        <div className="book-stage relative mx-auto flex h-full min-h-0 w-full max-w-full items-center justify-center py-1 sm:max-w-[min(720px,calc(100%-9rem))] md:py-2">
          <div className="relative aspect-[5/7] h-[min(100%,calc(100dvh-7.5rem))] w-auto max-w-full min-w-0">
            <Book />
          </div>
        </div>
      </main>

      <BottomBar />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onShop={() => setShopOpen(true)}
        onPlan={() => setPlanOpen(true)}
      />
      <FavoritesDrawer open={favOpen} onClose={() => setFavOpen(false)} />
      <ShoppingDrawer open={shopOpen} onClose={() => setShopOpen(false)} />
      <MealPlannerDrawer
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        onShop={() => setShopOpen(true)}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <InstallBanner />
      <AssetPreloader />
      <NameGate
        open={needsName || renameOpen}
        dismissible={renameOpen && !needsName}
        onDismiss={() => setRenameOpen(false)}
        onSubmit={(name) => {
          setOwnerName(name);
          setRenameOpen(false);
        }}
      />
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
}: {
  onSearch: () => void;
  onFavorites: () => void;
  onShop: () => void;
  onImport: () => void;
  onPlan: () => void;
  onRename: () => void;
}) {
  const {
    theme,
    setTheme,
    edition,
    soundOn,
    setSoundOn,
    shoppingCount,
  } = useApp();
  const dark = theme === 'dark';
  const reduce = useReducedMotion();
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!more) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMore(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [more]);

  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-2.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[color:var(--color-ink)]">
        <Icon name="book" size={20} />
        <div className="min-w-0 leading-tight">
          <span className="block truncate font-serif text-lg font-semibold italic tracking-tight">
            {PRODUCT_NAME}
          </span>
          <span
            suppressHydrationWarning
            className="block truncate text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]"
          >
            {edition.bookTitle}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn label="Search recipes" onClick={onSearch}>
          <Icon name="search" size={20} />
        </IconBtn>
        <IconBtn label="Favorites and history" onClick={onFavorites}>
          <Icon name="bookmark" size={20} />
        </IconBtn>
        <IconBtn
          label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
          <Icon name={dark ? 'sun-toggle' : 'moon-toggle'} size={20} />
        </IconBtn>

        <div className="relative" ref={moreRef}>
          <IconBtn label="More" onClick={() => setMore((v) => !v)} ariaExpanded={more}>
            <span className="text-lg leading-none" aria-hidden>
              ···
            </span>
          </IconBtn>
          <AnimatePresence>
            {more && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: reduce ? 0 : 0.15 }}
                className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] py-1 shadow-[var(--shadow-lg)]"
              >
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
      onClick={onClick}
      className="block w-full px-3.5 py-2 text-left text-sm text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)] hover:text-[color:var(--color-ink)]"
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
    <footer className="flex shrink-0 items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
        className="min-w-14 text-center text-xs tabular-nums text-[color:var(--color-ink-faint)]"
        title={
          extras > 0
            ? `Includes ${extras} imported custom recipes (this device only)`
            : 'Page in this edition of the book'
        }
        aria-live="polite"
      >
        {ready ? `${index + 1} / ${total}` : '…'}
      </span>

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
      className="grid size-10 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-all hover:bg-[color:var(--color-paper-sunk)] hover:text-[color:var(--color-ink)] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
