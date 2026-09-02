'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import JSON5 from 'json5';
import { BingoAlert } from './bingo/components/bingo-alert';
import { CardLoaderModal } from './bingo/components/card-loader-modal';
import { CardsPanel } from './bingo/components/cards-panel';
import { MarkerSidebar } from './bingo/components/marker-sidebar';
import { TopBar } from './bingo/components/top-bar';
import { getCards, hasBingo, isNumberOnCards } from './bingo/domain';
import { recognizeCardImage } from './bingo/ocr';
import { readSavedGame, readSavedLocale, saveGame, saveLocale } from './bingo/storage';
import { localeOrder, translations } from './bingo/translations';
import type { BingoCard, ImageDetection, LoadMode, Locale, Notice } from './bingo/types';

export default function BingoClient() {
  const [cards, setCards] = useState<BingoCard[] | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [numberInput, setNumberInput] = useState('');
  const [cardsJsonInput, setCardsJsonInput] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [showLoader, setShowLoader] = useState(false);
  const [loadMode, setLoadMode] = useState<LoadMode>('file');
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [imageDetection, setImageDetection] = useState<ImageDetection | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const t = translations[locale];
  const activeCards = cards ?? [];
  const canMark = activeCards.length > 0;
  const winners = activeCards.filter((card) => hasBingo(card, calledNumbers));
  const sortedCalledNumbers = Array.from(calledNumbers).reverse();
  const nextLocale = localeOrder[(localeOrder.indexOf(locale) + 1) % localeOrder.length];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLocale = readSavedLocale();
      if (savedLocale) setLocale(savedLocale);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    inputRef.current?.focus();
    let isCurrent = true;

    async function loadInitialGame() {
      const savedGame = readSavedGame();
      if (savedGame) {
        if (!isCurrent) return;
        setCards(savedGame.cards);
        setCalledNumbers(new Set(savedGame.calledNumbers));
        return;
      }

      try {
        const response = await fetch('./cartelas.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('cards-not-found');
        const sourceCards = getCards(await response.json());
        if (!sourceCards) throw new Error('invalid-cards');
        if (!isCurrent) return;
        setCards(sourceCards);
      } catch {
        if (!isCurrent) return;
        setCards([]);
        setShowLoader(true);
      }
    }

    void loadInitialGame();
    return () => {
      isCurrent = false;
    };
  }, []);

  function persistGame(cardsToSave: BingoCard[], numbersToSave: Set<number>) {
    try {
      saveGame(cardsToSave, numbersToSave);
    } catch {
      setNotice({ type: 'error', text: t.storageError });
    }
  }

  function changeLocale() {
    setLocale(nextLocale);
    try {
      saveLocale(nextLocale);
    } catch {
      // The interface still changes language when storage is unavailable.
    }
  }

  function openLoader(mode: LoadMode = 'file') {
    setLoadMode(mode);
    setImageDetection(null);
    setShowLoader(true);
  }

  function importCards(value: unknown) {
    const importedCards = getCards(value);
    if (!importedCards) throw new Error('invalid-cards');

    const emptyCalledNumbers = new Set<number>();
    setCards(importedCards);
    setCalledNumbers(emptyCalledNumbers);
    persistGame(importedCards, emptyCalledNumbers);
    setNotice({ type: 'info', text: t.importSuccess(importedCards.length) });
    setEditingHistory(false);
    setShowLoader(false);
  }

  function markNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMark) {
      setNotice({ type: 'error', text: t.loadBeforeMarking });
      return;
    }

    const parsed = Number(numberInput);
    if (!numberInput.trim() || !Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
      setNotice({ type: 'error', text: t.invalidNumber });
      inputRef.current?.focus();
      return;
    }

    const next = new Set(calledNumbers);
    next.add(parsed);
    setCalledNumbers(next);
    setNumberInput('');
    setNotice(
      isNumberOnCards(activeCards, parsed) ? null : { type: 'info', text: t.absentNumber(parsed) },
    );
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  function removeCalledNumber(number: number) {
    const next = new Set(calledNumbers);
    next.delete(number);
    setCalledNumbers(next);
    setNotice({ type: 'info', text: t.markRemoved(number) });
    persistGame(activeCards, next);
  }

  function undoLast() {
    if (!sortedCalledNumbers.length) return;
    removeCalledNumber(sortedCalledNumbers[0]);
    inputRef.current?.focus();
  }

  function clearMarks() {
    const next = new Set<number>();
    setCalledNumbers(next);
    setNotice(null);
    setEditingHistory(false);
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  async function loadJsonFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      importCards(JSON5.parse(await file.text()) as unknown);
    } catch {
      setNotice({ type: 'error', text: t.invalidJson });
    } finally {
      event.target.value = '';
      inputRef.current?.focus();
    }
  }

  function loadJsonText() {
    if (!cardsJsonInput.trim()) {
      setNotice({ type: 'error', text: t.emptyTextJson });
      return;
    }

    try {
      importCards(JSON5.parse(cardsJsonInput) as unknown);
      setCardsJsonInput('');
      setImageDetection(null);
    } catch {
      setNotice({ type: 'error', text: t.invalidJson });
    }
    inputRef.current?.focus();
  }

  async function loadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageProgress(0);
    setImageDetection(null);
    setNotice(null);

    try {
      const detected = await recognizeCardImage(file, setImageProgress);
      setCardsJsonInput(JSON.stringify({ cards: [detected.card] }, null, 2));
      setImageDetection({
        title: detected.card.title,
        rows: detected.rows,
        columns: detected.columns,
      });
      setLoadMode('json');
    } catch {
      setNotice({ type: 'error', text: t.imageError });
    } finally {
      setImageProgress(null);
      event.target.value = '';
    }
  }

  return (
    <main className="app-shell">
      <TopBar
        activeCardCount={activeCards.length}
        locale={locale}
        nextLocale={nextLocale}
        onChangeLocale={changeLocale}
        translation={t}
      />

      <BingoAlert winners={winners} translation={t} />

      <div className="workspace">
        <CardsPanel
          cards={cards}
          calledNumbers={calledNumbers}
          onOpenLoader={() => openLoader('file')}
          translation={t}
        />
        <MarkerSidebar
          canMark={canMark}
          calledNumberCount={calledNumbers.size}
          editingHistory={editingHistory}
          inputRef={inputRef}
          isNumberOnAnyCard={(number) => isNumberOnCards(activeCards, number)}
          notice={notice}
          numberInput={numberInput}
          onClearMarks={clearMarks}
          onInputChange={(value) => {
            setNumberInput(value);
            setNotice(null);
          }}
          onMarkNumber={markNumber}
          onOpenLoader={() => openLoader('file')}
          onRemoveCalledNumber={removeCalledNumber}
          onToggleEditing={() => {
            setEditingHistory((value) => !value);
            setShowHistory(true);
          }}
          onToggleHistory={() => setShowHistory((value) => !value)}
          onUndoLast={undoLast}
          showHistory={showHistory}
          sortedCalledNumbers={sortedCalledNumbers}
          translation={t}
        />
      </div>

      {showLoader && (
        <CardLoaderModal
          canClose={canMark}
          cardsJsonInput={cardsJsonInput}
          fileRef={fileRef}
          imageDetection={imageDetection}
          imageProgress={imageProgress}
          imageRef={imageRef}
          loadMode={loadMode}
          notice={notice}
          onCardsJsonChange={setCardsJsonInput}
          onClose={() => setShowLoader(false)}
          onLoadImage={loadImage}
          onLoadJsonFile={loadJsonFile}
          onLoadJsonText={loadJsonText}
          onModeChange={setLoadMode}
          translation={t}
        />
      )}
    </main>
  );
}
