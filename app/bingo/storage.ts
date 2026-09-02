import { isValidCard, isValidMarkedNumber } from './domain';
import { localeOrder } from './translations';
import type { BingoCard, Locale } from './types';

type SavedGame = {
  expiresAt: number;
  cards: BingoCard[];
  calledNumbers: number[];
};

type SavedLocale = {
  expiresAt: number;
  locale: Locale;
};

const gameStorageKey = 'marca-bingo:game:v1';
const localeStorageKey = 'marca-bingo:locale:v1';
const storageDuration = 24 * 60 * 60 * 1000;

export function readSavedGame(): SavedGame | null {
  try {
    const raw = window.localStorage.getItem(gameStorageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedGame>;

    if (
      typeof saved.expiresAt !== 'number' ||
      saved.expiresAt <= Date.now() ||
      !Array.isArray(saved.cards) ||
      !saved.cards.every(isValidCard) ||
      !Array.isArray(saved.calledNumbers)
    ) {
      window.localStorage.removeItem(gameStorageKey);
      return null;
    }

    return {
      expiresAt: saved.expiresAt,
      cards: saved.cards,
      calledNumbers: saved.calledNumbers.filter(isValidMarkedNumber),
    };
  } catch {
    window.localStorage.removeItem(gameStorageKey);
    return null;
  }
}

export function saveGame(cards: BingoCard[], calledNumbers: Set<number>) {
  window.localStorage.setItem(
    gameStorageKey,
    JSON.stringify({
      expiresAt: Date.now() + storageDuration,
      cards,
      calledNumbers: Array.from(calledNumbers),
    }),
  );
}

export function readSavedLocale(): Locale | null {
  try {
    const raw = window.localStorage.getItem(localeStorageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedLocale>;

    if (
      typeof saved.expiresAt !== 'number' ||
      saved.expiresAt <= Date.now() ||
      !localeOrder.includes(saved.locale as Locale)
    ) {
      window.localStorage.removeItem(localeStorageKey);
      return null;
    }

    return saved.locale as Locale;
  } catch {
    window.localStorage.removeItem(localeStorageKey);
    return null;
  }
}

export function saveLocale(locale: Locale) {
  window.localStorage.setItem(
    localeStorageKey,
    JSON.stringify({ expiresAt: Date.now() + storageDuration, locale }),
  );
}
