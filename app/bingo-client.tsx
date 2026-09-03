'use client';

import './bingo-client.css';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import JSON5 from 'json5';
import { AuthorWatermark } from './src/components/author-watermark';
import { BingoAlert } from './src/components/bingo-alert';
import { CardLoaderModal } from './src/components/card-loader-modal';
import { CardsPanel } from './src/components/cards-panel';
import { MarkerSidebar } from './src/components/marker-sidebar';
import { TopBar } from './src/components/top-bar';
import { formatCardsJson } from './src/card-json';
import { getCards, hasBingo, isNumberOnCards } from './src/domain';
import { recognizeCardImage } from './src/ocr';
import { readSavedGame, readSavedLocale, saveGame, saveLocale } from './src/storage';
import { localeOrder, translations } from './src/translations';
import type {
  BingoCard,
  ImageDetection,
  JsonLoadMode,
  LoadMode,
  Locale,
  Notice,
} from './src/types';

export default function BingoClient() {
  const [cards, setCards] = useState<BingoCard[] | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [numberInput, setNumberInput] = useState('');
  const [cardsJsonInput, setCardsJsonInput] = useState('');
  const [markerNotice, setMarkerNotice] = useState<Notice>(null);
  const [loaderNotice, setLoaderNotice] = useState<Notice>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [showLoader, setShowLoader] = useState(false);
  const [loadMode, setLoadMode] = useState<LoadMode>('image');
  const [jsonLoadMode, setJsonLoadMode] = useState<JsonLoadMode>('text');
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
      setMarkerNotice({ type: 'error', text: t.storageError });
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

  function openLoader(mode: LoadMode = 'image') {
    setLoadMode(mode);
    setJsonLoadMode('text');
    setImageDetection(null);
    setLoaderNotice(null);
    setShowLoader(true);
  }

  function importCards(value: unknown) {
    const importedCards = getCards(value);
    if (!importedCards) throw new Error('invalid-cards');

    const emptyCalledNumbers = new Set<number>();
    setCards(importedCards);
    setCalledNumbers(emptyCalledNumbers);
    persistGame(importedCards, emptyCalledNumbers);
    setMarkerNotice({ type: 'info', text: t.importSuccess(importedCards.length) });
    setLoaderNotice(null);
    setEditingHistory(false);
    setShowLoader(false);
  }

  function markNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMark) {
      setMarkerNotice({ type: 'error', text: t.loadBeforeMarking });
      return;
    }

    const parsed = Number(numberInput);
    if (!numberInput.trim() || !Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
      setMarkerNotice({ type: 'error', text: t.invalidNumber });
      inputRef.current?.focus();
      return;
    }

    const next = new Set(calledNumbers);
    next.add(parsed);
    setCalledNumbers(next);
    setNumberInput('');
    setMarkerNotice(
      isNumberOnCards(activeCards, parsed) ? null : { type: 'info', text: t.absentNumber(parsed) },
    );
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  function removeCalledNumber(number: number) {
    const next = new Set(calledNumbers);
    next.delete(number);
    setCalledNumbers(next);
    setMarkerNotice({ type: 'info', text: t.markRemoved(number) });
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
    setMarkerNotice(null);
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
      setLoaderNotice({ type: 'error', text: t.invalidJson });
    } finally {
      event.target.value = '';
      inputRef.current?.focus();
    }
  }

  function loadJsonText() {
    if (!cardsJsonInput.trim()) {
      setLoaderNotice({ type: 'error', text: t.emptyTextJson });
      return;
    }

    try {
      importCards(JSON5.parse(cardsJsonInput) as unknown);
      setCardsJsonInput('');
      setImageDetection(null);
    } catch {
      setLoaderNotice({ type: 'error', text: t.invalidJson });
    }
    inputRef.current?.focus();
  }

  async function loadImage(file: File) {
    setImageProgress(0);
    setImageDetection(null);
    setLoaderNotice(null);

    try {
      const detected = await recognizeCardImage(file, setImageProgress);
      setCardsJsonInput(formatCardsJson([detected.card]));
      setImageDetection({
        title: detected.card.title,
        rows: detected.rows,
        columns: detected.columns,
      });
      setLoadMode('json');
      setJsonLoadMode('text');
    } catch {
      setLoaderNotice({ type: 'error', text: t.imageError });
    } finally {
      setImageProgress(null);
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

      <div className={'workspace' + (activeCards.length <= 1 ? ' compact-workspace' : '')}>
        <CardsPanel
          cards={cards}
          calledNumbers={calledNumbers}
          onOpenLoader={() => openLoader('image')}
          translation={t}
        />
        <div className="sidebar-column">
          <div className="sidebar-summary">
            <span>{t.calledCount(calledNumbers.size)}</span>
          </div>
          <MarkerSidebar
            canMark={canMark}
            calledNumberCount={calledNumbers.size}
            editingHistory={editingHistory}
            inputRef={inputRef}
            isNumberOnAnyCard={(number) => isNumberOnCards(activeCards, number)}
            notice={markerNotice}
            numberInput={numberInput}
            onClearMarks={clearMarks}
            onInputChange={(value) => {
              setNumberInput(value);
              setMarkerNotice(null);
            }}
            onMarkNumber={markNumber}
            onOpenLoader={() => openLoader('image')}
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
      </div>

      <AuthorWatermark />

      {showLoader && (
        <CardLoaderModal
          canClose={canMark}
          cardsJsonInput={cardsJsonInput}
          fileRef={fileRef}
          imageDetection={imageDetection}
          imageProgress={imageProgress}
          imageRef={imageRef}
          jsonLoadMode={jsonLoadMode}
          loadMode={loadMode}
          notice={loaderNotice}
          onCardsJsonChange={(value) => {
            setCardsJsonInput(value);
            setLoaderNotice(null);
          }}
          onClose={() => setShowLoader(false)}
          onLoadImageFile={loadImage}
          onLoadJsonFile={loadJsonFile}
          onLoadJsonText={loadJsonText}
          onJsonModeChange={setJsonLoadMode}
          onModeChange={setLoadMode}
          translation={t}
        />
      )}
    </main>
  );
}
