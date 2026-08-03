/** Minimal UI strings — English + Roman Urdu. Not full i18n; RTL via dir. */

export type Locale = 'en' | 'ur';

const EN = {
  search: 'Search recipes',
  more: 'More',
  contents: 'Contents',
  chapters: 'The Chapters',
  todaysKitchen: "Today’s kitchen",
  startCooking: 'Start cooking',
  shopping: 'Shopping list',
  about: 'About & data',
  guestReadonly: 'Guest view — edits locked',
} as const;

const UR: Record<keyof typeof EN, string> = {
  search: 'Recipe dhoondo',
  more: 'Aur',
  contents: 'Fihrist',
  chapters: 'Chapters',
  todaysKitchen: 'Aaj ki kitchen',
  startCooking: 'Cooking shuru',
  shopping: 'Shopping list',
  about: 'About & data',
  guestReadonly: 'Guest view — edits band',
};

export function t(locale: Locale, key: keyof typeof EN): string {
  return locale === 'ur' ? UR[key] : EN[key];
}

export function localeDir(_locale: Locale): 'ltr' | 'rtl' {
  // Roman Urdu stays LTR; true Urdu script later → rtl
  return 'ltr';
}
