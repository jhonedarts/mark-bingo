import Image from 'next/image';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import './top-bar.css';
import {
  localeNames,
  localeOrder,
  localeShortNames,
  type Translation,
} from '../i18n';
import type { Locale } from '../types';

type TopBarProps = {
  activeCardCount: number;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  translation: Translation;
};

export function TopBar({
  activeCardCount,
  locale,
  onChangeLocale,
  translation: t,
}: TopBarProps) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languagePickerRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;

    const frame = window.requestAnimationFrame(() => {
      languageMenuRef.current
        ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ?.focus();
    });

    function closeOnOutsideClick(event: PointerEvent) {
      if (!languagePickerRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsLanguageMenuOpen(false);
      languageButtonRef.current?.focus();
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isLanguageMenuOpen]);

  function selectLocale(option: Locale) {
    onChangeLocale(option);
    setIsLanguageMenuOpen(false);
    languageButtonRef.current?.focus();
  }

  function navigateLanguageMenu(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const options = Array.from(
      languageMenuRef.current?.querySelectorAll<HTMLButtonElement>('.language-option') ?? [],
    );
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : event.key === 'ArrowDown'
            ? (currentIndex + 1) % options.length
            : (currentIndex - 1 + options.length) % options.length;

    options[nextIndex]?.focus();
  }

  return (
    <header className="topbar">
      <div className="brand" aria-label={t.BRAND_LABEL}>
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
          <span>{t.CARDS_IN_PLAY}</span>
          <strong>{activeCardCount.toString().padStart(2, '0')}</strong>
        </div>
        <div className="language-picker" ref={languagePickerRef}>
          <button
            ref={languageButtonRef}
            type="button"
            className="language-switch"
            onClick={() => setIsLanguageMenuOpen((isOpen) => !isOpen)}
            aria-label={t.SELECT_LANGUAGE}
            title={t.SELECT_LANGUAGE}
            aria-haspopup="menu"
            aria-expanded={isLanguageMenuOpen}
            aria-controls="language-menu"
          >
            <span aria-hidden="true">◎</span>
            <strong>{localeShortNames[locale]}</strong>
          </button>

          {isLanguageMenuOpen && (
            <div
              ref={languageMenuRef}
              id="language-menu"
              className="language-menu"
              role="menu"
              aria-label={t.SELECT_LANGUAGE}
              onKeyDown={navigateLanguageMenu}
            >
              {localeOrder.map((option) => {
                const isActive = option === locale;
                return (
                  <button
                    type="button"
                    className={'language-option' + (isActive ? ' active' : '')}
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => selectLocale(option)}
                    key={option}
                  >
                    <span>{localeShortNames[option]}</span>
                    <strong>{localeNames[option]}</strong>
                    <i aria-hidden="true">{isActive ? '✓' : ''}</i>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
