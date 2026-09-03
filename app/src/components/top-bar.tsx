import Image from 'next/image';
import './top-bar.css';
import { localeNames, localeShortNames } from '../translations';
import type { Locale, Translation } from '../types';

type TopBarProps = {
  activeCardCount: number;
  locale: Locale;
  nextLocale: Locale;
  onChangeLocale: () => void;
  translation: Translation;
};

export function TopBar({
  activeCardCount,
  locale,
  nextLocale,
  onChangeLocale,
  translation: t,
}: TopBarProps) {
  const changeLanguageLabel = t.changeLanguage(localeNames[nextLocale]);

  return (
    <header className="topbar">
      <div className="brand" aria-label={t.brandLabel}>
        <Image
          className="brand-mark"
          src="/favicon.svg?v=2"
          alt=""
          width={25}
          height={25}
          aria-hidden="true"
        />
        <span className="brand-name">MARCA BINGO</span>
      </div>
      <div className="topbar-actions">
        <div className="topbar-meta">
          <span className="live-dot" aria-hidden="true" />
          <span>{t.cardsInPlay}</span>
          <strong>{activeCardCount.toString().padStart(2, '0')}</strong>
        </div>
        <button
          type="button"
          className="language-switch"
          onClick={onChangeLocale}
          aria-label={changeLanguageLabel}
          title={changeLanguageLabel}
        >
          <span aria-hidden="true">◎</span>
          <strong>{localeShortNames[locale]}</strong>
        </button>
      </div>
    </header>
  );
}
