'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';

type CellValue = number | null;
type BingoCard = { title: string; numbers: CellValue[][] };
type Notice = { type: 'error' | 'info'; text: string } | null;
type SavedGame = { expiresAt: number; cards: BingoCard[]; calledNumbers: number[] };
type Locale = 'pt-BR' | 'es' | 'en';
type SavedLocale = { expiresAt: number; locale: Locale };

type Translation = {
  brandLabel: string;
  cardsInPlay: string;
  changeLanguage: (language: string) => string;
  cardComplete: (title: string) => string;
  cardsComplete: (count: number) => string;
  cardsPanelLabel: string;
  liveTracking: string;
  yourCards: string;
  markedCount: (count: number) => string;
  loadingCards: string;
  noCards: string;
  noCardsHint: string;
  loadJson: string;
  card: string;
  freeSpace: string;
  numberCell: (number: number, marked: boolean) => string;
  controlPanelLabel: string;
  marker: string;
  whichNumber: string;
  markInstruction: string;
  loadInstruction: string;
  calledNumber: string;
  confirmNumber: string;
  mark: string;
  marked: string;
  collapse: string;
  showAll: string;
  noMarkedNumbers: string;
  undoLast: string;
  clearMarks: string;
  otherCards: string;
  letsStart: string;
  savedForOneDay: string;
  downloadDefault: string;
  uploadCardsHint: string;
  storageError: string;
  missingCardsError: string;
  loadBeforeMarking: string;
  invalidNumber: string;
  absentNumber: (number: number) => string;
  markRemoved: (number: number) => string;
  importSuccess: (count: number) => string;
  invalidJson: string;
  pasteJsonLabel: string;
  pasteJsonHint: string;
  loadTextJson: string;
  emptyTextJson: string;
};

const columns = ['B', 'I', 'N', 'G', 'O'];
const storageKey = 'marca-bingo:game:v1';
const localeStorageKey = 'marca-bingo:locale:v1';
const storageDuration = 24 * 60 * 60 * 1000;
const localeOrder: Locale[] = ['pt-BR', 'es', 'en'];
const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português',
  es: 'Español',
  en: 'English',
};
const localeShortNames: Record<Locale, string> = {
  'pt-BR': 'PT',
  es: 'ES',
  en: 'EN',
};

const translations: Record<Locale, Translation> = {
  'pt-BR': {
    brandLabel: 'Marcador de bingo',
    cardsInPlay: 'Cartelas em jogo',
    changeLanguage: (language) => `Alterar idioma para ${language}`,
    cardComplete: (title) => `Cartela ${title} completa`,
    cardsComplete: (count) => `${count} cartelas completas`,
    cardsPanelLabel: 'Cartelas de bingo',
    liveTracking: 'ACOMPANHAMENTO AO VIVO',
    yourCards: 'Suas cartelas',
    markedCount: (count) => `${count} números marcados`,
    loadingCards: 'Carregando cartelas…',
    noCards: 'Nenhuma cartela encontrada',
    noCardsHint: 'Adicione public/cartelas.json ao projeto ou carregue um arquivo JSON abaixo.',
    loadJson: 'Carregar JSON',
    card: 'CARTELA',
    freeSpace: 'Espaço livre',
    numberCell: (number, marked) => `Número ${number}${marked ? ', marcado' : ''}`,
    controlPanelLabel: 'Painel de marcação',
    marker: 'MARCADOR',
    whichNumber: 'Qual número saiu?',
    markInstruction: 'Digite o número e pressione Enter.',
    loadInstruction: 'Carregue uma cartela para habilitar a marcação.',
    calledNumber: 'Número sorteado',
    confirmNumber: 'Confirmar número',
    mark: 'Marcar',
    marked: 'Sorteados',
    collapse: 'Recolher',
    showAll: 'Ver todos',
    noMarkedNumbers: 'Nenhum número marcado ainda.',
    undoLast: 'Desfazer último',
    clearMarks: 'Limpar marcações',
    otherCards: 'Outras cartelas?',
    letsStart: 'Vamos começar?',
    savedForOneDay: 'Dados salvos por 24 horas.',
    downloadDefault: 'Baixar padrão',
    uploadCardsHint: 'Carregue um JSON com até 4 cartelas.',
    storageError: 'Não foi possível salvar os dados neste navegador.',
    missingCardsError: 'Nenhuma cartela foi encontrada em public/cartelas.json. Carregue um JSON para começar.',
    loadBeforeMarking: 'Carregue as cartelas antes de marcar números.',
    invalidNumber: 'Digite um número inteiro de 1 a 75.',
    absentNumber: (number) => `O número ${number} não está nestas cartelas.`,
    markRemoved: (number) => `Marcação do número ${number} removida.`,
    importSuccess: (count) => `${count} ${count === 1 ? 'cartela carregada' : 'cartelas carregadas'} e salvas neste navegador por 24 horas.`,
    invalidJson: 'JSON inválido. Use de 1 a 4 cartelas no formato esperado.',
    pasteJsonLabel: 'Cole ou digite as cartelas em JSON',
    pasteJsonHint: 'Use o exemplo exibido no campo. Você pode carregar até 4 cartelas.',
    loadTextJson: 'Carregar texto',
    emptyTextJson: 'Cole ou digite um JSON antes de carregar.',
  },
  es: {
    brandLabel: 'Marcador de bingo',
    cardsInPlay: 'Cartones en juego',
    changeLanguage: (language) => `Cambiar idioma a ${language}`,
    cardComplete: (title) => `Cartón ${title} completo`,
    cardsComplete: (count) => `${count} cartones completos`,
    cardsPanelLabel: 'Cartones de bingo',
    liveTracking: 'SEGUIMIENTO EN VIVO',
    yourCards: 'Tus cartones',
    markedCount: (count) => `${count} números marcados`,
    loadingCards: 'Cargando cartones…',
    noCards: 'No se encontraron cartones',
    noCardsHint: 'Añade public/cartelas.json al proyecto o carga un archivo JSON a continuación.',
    loadJson: 'Cargar JSON',
    card: 'CARTÓN',
    freeSpace: 'Espacio libre',
    numberCell: (number, marked) => `Número ${number}${marked ? ', marcado' : ''}`,
    controlPanelLabel: 'Panel de marcado',
    marker: 'MARCADOR',
    whichNumber: '¿Qué número salió?',
    markInstruction: 'Escribe el número y presiona Enter.',
    loadInstruction: 'Carga un cartón para habilitar el marcado.',
    calledNumber: 'Número sorteado',
    confirmNumber: 'Confirmar número',
    mark: 'Marcar',
    marked: 'Sorteados',
    collapse: 'Ocultar',
    showAll: 'Ver todos',
    noMarkedNumbers: 'Todavía no hay números marcados.',
    undoLast: 'Deshacer último',
    clearMarks: 'Borrar marcas',
    otherCards: '¿Otros cartones?',
    letsStart: '¿Empezamos?',
    savedForOneDay: 'Datos guardados durante 24 horas.',
    downloadDefault: 'Descargar predeterminado',
    uploadCardsHint: 'Carga un JSON con hasta 4 cartones.',
    storageError: 'No fue posible guardar los datos en este navegador.',
    missingCardsError: 'No se encontró ningún cartón en public/cartelas.json. Carga un JSON para empezar.',
    loadBeforeMarking: 'Carga los cartones antes de marcar números.',
    invalidNumber: 'Escribe un número entero del 1 al 75.',
    absentNumber: (number) => `El número ${number} no está en estos cartones.`,
    markRemoved: (number) => `Se eliminó la marca del número ${number}.`,
    importSuccess: (count) => `${count} ${count === 1 ? 'cartón cargado' : 'cartones cargados'} y guardados en este navegador durante 24 horas.`,
    invalidJson: 'JSON no válido. Usa de 1 a 4 cartones con el formato esperado.',
    pasteJsonLabel: 'Pega o escribe los cartones en JSON',
    pasteJsonHint: 'Usa el ejemplo mostrado en el campo. Puedes cargar hasta 4 cartones.',
    loadTextJson: 'Cargar texto',
    emptyTextJson: 'Pega o escribe un JSON antes de cargarlo.',
  },
  en: {
    brandLabel: 'Bingo marker',
    cardsInPlay: 'Cards in play',
    changeLanguage: (language) => `Change language to ${language}`,
    cardComplete: (title) => `Card ${title} complete`,
    cardsComplete: (count) => `${count} cards complete`,
    cardsPanelLabel: 'Bingo cards',
    liveTracking: 'LIVE TRACKING',
    yourCards: 'Your cards',
    markedCount: (count) => `${count} numbers marked`,
    loadingCards: 'Loading cards…',
    noCards: 'No cards found',
    noCardsHint: 'Add public/cartelas.json to the project or upload a JSON file below.',
    loadJson: 'Load JSON',
    card: 'CARD',
    freeSpace: 'Free space',
    numberCell: (number, marked) => `Number ${number}${marked ? ', marked' : ''}`,
    controlPanelLabel: 'Marking panel',
    marker: 'MARKER',
    whichNumber: 'What number was called?',
    markInstruction: 'Enter the number and press Enter.',
    loadInstruction: 'Load a card to enable marking.',
    calledNumber: 'Called number',
    confirmNumber: 'Confirm number',
    mark: 'Mark',
    marked: 'Called',
    collapse: 'Collapse',
    showAll: 'Show all',
    noMarkedNumbers: 'No numbers marked yet.',
    undoLast: 'Undo last',
    clearMarks: 'Clear marks',
    otherCards: 'Other cards?',
    letsStart: 'Ready to start?',
    savedForOneDay: 'Data saved for 24 hours.',
    downloadDefault: 'Download default',
    uploadCardsHint: 'Load a JSON with up to 4 cards.',
    storageError: 'Unable to save data in this browser.',
    missingCardsError: 'No cards were found in public/cartelas.json. Load a JSON file to get started.',
    loadBeforeMarking: 'Load cards before marking numbers.',
    invalidNumber: 'Enter a whole number from 1 to 75.',
    absentNumber: (number) => `Number ${number} is not on these cards.`,
    markRemoved: (number) => `Mark for number ${number} removed.`,
    importSuccess: (count) => `${count} ${count === 1 ? 'card' : 'cards'} loaded and saved in this browser for 24 hours.`,
    invalidJson: 'Invalid JSON. Use 1 to 4 cards in the expected format.',
    pasteJsonLabel: 'Paste or type cards as JSON',
    pasteJsonHint: 'Use the example shown in the field. You can load up to 4 cards.',
    loadTextJson: 'Load text',
    emptyTextJson: 'Paste or type JSON before loading.',
  },
};

const cardsJsonExample = `{
  "cards": [
    {
      "title": "037",
      "numbers": [
        [1, 17, 41, 54, 64],
        [15, 25, 35, 56, 74],
        [11, 20, null, 60, 75],
        [4, 21, 36, 49, 65],
        [7, 26, 44, 53, 63]
      ]
    },
    {
      "title": "056",
      "numbers": [
        [14, 26, 39, 58, 64],
        [15, 20, 44, 55, 69],
        [9, 30, null, 47, 68],
        [10, 16, 42, 59, 73],
        [1, 24, 33, 51, 72]
      ]
    }
  ]
}`;

function isValidCard(value: unknown): value is BingoCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<BingoCard>;
  return (
    typeof card.title === 'string' &&
    card.title.trim().length > 0 &&
    Array.isArray(card.numbers) &&
    card.numbers.length === 5 &&
    card.numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5 &&
        row.every(
          (cell) =>
            cell === null ||
            (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 75),
        ),
    )
  );
}

function isValidMarkedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 75;
}

function getCards(value: unknown): BingoCard[] | null {
  const cards = Array.isArray(value) ? value : (value as { cards?: unknown })?.cards;
  return Array.isArray(cards) && cards.length > 0 && cards.length <= 4 && cards.every(isValidCard)
    ? cards
    : null;
}

function hasBingo(card: BingoCard, calledNumbers: Set<number>) {
  return card.numbers.every((row) =>
    row.every((number) => number === null || calledNumbers.has(number)),
  );
}

function readSavedGame(): SavedGame | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedGame>;
    if (
      typeof saved.expiresAt !== 'number' ||
      saved.expiresAt <= Date.now() ||
      !Array.isArray(saved.cards) ||
      !saved.cards.every(isValidCard) ||
      !Array.isArray(saved.calledNumbers)
    ) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return {
      expiresAt: saved.expiresAt,
      cards: saved.cards,
      calledNumbers: saved.calledNumbers.filter(isValidMarkedNumber),
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function readSavedLocale(): Locale | null {
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

export default function Home() {
  const [cards, setCards] = useState<BingoCard[] | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [numberInput, setNumberInput] = useState('');
  const [cardsJsonInput, setCardsJsonInput] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const t = translations[locale];
  const activeCards = cards ?? [];
  const canMark = activeCards.length > 0;
  const winners = activeCards.filter((card) => hasBingo(card, calledNumbers));
  const sortedCalledNumbers = Array.from(calledNumbers).reverse();
  const nextLocale = localeOrder[(localeOrder.indexOf(locale) + 1) % localeOrder.length];

  function persistGame(cardsToSave: BingoCard[], numbersToSave: Set<number>) {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          expiresAt: Date.now() + storageDuration,
          cards: cardsToSave,
          calledNumbers: Array.from(numbersToSave),
        }),
      );
    } catch {
      setNotice({ type: 'error', text: t.storageError });
    }
  }

  function changeLocale() {
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(
        localeStorageKey,
        JSON.stringify({ expiresAt: Date.now() + storageDuration, locale: nextLocale }),
      );
    } catch {
      // The interface still changes language when storage is unavailable.
    }
  }

  useEffect(() => {
    const savedLocale = readSavedLocale();
    if (savedLocale) setLocale(savedLocale);
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
        setNotice({ type: 'error', text: translations['pt-BR'].missingCardsError });
      }
    }

    void loadInitialGame();
    return () => { isCurrent = false; };
  }, []);

  function markNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMark) {
      setNotice({ type: 'error', text: t.loadBeforeMarking });
      return;
    }
    const parsed = Number(numberInput);
    if (!numberInput.trim() || !Number.isInteger(parsed) || parsed < 1 || parsed > 75) {
      setNotice({ type: 'error', text: t.invalidNumber });
      inputRef.current?.focus();
      return;
    }
    const appearsOnCard = activeCards.some((card) => card.numbers.some((row) => row.includes(parsed)));
    const next = new Set(calledNumbers);
    next.add(parsed);
    setCalledNumbers(next);
    setNumberInput('');
    setNotice(appearsOnCard ? null : { type: 'info', text: t.absentNumber(parsed) });
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  function undoLast() {
    if (!sortedCalledNumbers.length) return;
    const lastCalled = sortedCalledNumbers[0];
    const next = new Set(calledNumbers);
    next.delete(lastCalled);
    setCalledNumbers(next);
    setNotice({ type: 'info', text: t.markRemoved(lastCalled) });
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  function clearMarks() {
    const next = new Set<number>();
    setCalledNumbers(next);
    setNotice(null);
    persistGame(activeCards, next);
    inputRef.current?.focus();
  }

  async function loadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const importedCards = getCards(JSON.parse(await file.text()) as unknown);
      if (!importedCards) throw new Error('invalid-cards');
      const next = new Set<number>();
      setCards(importedCards);
      setCalledNumbers(next);
      persistGame(importedCards, next);
      setNotice({ type: 'info', text: t.importSuccess(importedCards.length) });
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
      const importedCards = getCards(JSON.parse(cardsJsonInput) as unknown);
      if (!importedCards) throw new Error('invalid-cards');
      const next = new Set<number>();
      setCards(importedCards);
      setCalledNumbers(next);
      persistGame(importedCards, next);
      setNotice({ type: 'info', text: t.importSuccess(importedCards.length) });
      setCardsJsonInput('');
    } catch {
      setNotice({ type: 'error', text: t.invalidJson });
    }
    inputRef.current?.focus();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label={t.brandLabel}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span className="brand-name">MARCA BINGO</span>
        </div>
        <div className="topbar-actions">
          <div className="topbar-meta"><span className="live-dot" aria-hidden="true" /><span>{t.cardsInPlay}</span><strong>{activeCards.length.toString().padStart(2, '0')}</strong></div>
          <button type="button" className="language-switch" onClick={changeLocale} aria-label={t.changeLanguage(localeNames[nextLocale])} title={t.changeLanguage(localeNames[nextLocale])}>
            <span aria-hidden="true">◎</span><strong>{localeShortNames[locale]}</strong>
          </button>
        </div>
      </header>

      {winners.length > 0 && (
        <section className="bingo-alert" role="alert" aria-live="assertive">
          <span aria-hidden="true">★</span>
          <div><strong>BINGO!</strong><small>{winners.length === 1 ? t.cardComplete(winners[0].title) : t.cardsComplete(winners.length)}</small></div>
          <span aria-hidden="true">★</span>
        </section>
      )}

      <div className="workspace">
        <section className="cards-panel" aria-label={t.cardsPanelLabel}>
          <div className="section-heading"><div><p>{t.liveTracking}</p><h1>{t.yourCards}</h1></div><span>{t.markedCount(calledNumbers.size)}</span></div>
          {cards === null ? (
            <section className="empty-cards" aria-live="polite"><strong>{t.loadingCards}</strong></section>
          ) : activeCards.length === 0 ? (
            <section className="empty-cards" aria-live="polite">
              <span aria-hidden="true">↥</span><h2>{t.noCards}</h2>
              <p>{t.noCardsHint}</p>
              <button type="button" onClick={() => fileRef.current?.click()}>{t.loadJson}</button>
            </section>
          ) : (
            <div className={`cards-grid cards-${activeCards.length}`}>
              {activeCards.map((card, cardIndex) => {
                const winner = hasBingo(card, calledNumbers);
                return (
                  <article className={`bingo-card${winner ? ' is-winner' : ''}`} key={`${card.title}-${cardIndex}`}>
                    <div className="card-topline"><div className="mini-brand" aria-hidden="true"><span className="mini-mark">•••</span><span>BINGO</span></div><div className="card-title"><small>{t.card}</small><strong>{card.title}</strong></div></div>
                    {winner && <div className="winner-ribbon">BINGO!</div>}
                    <div className="bingo-table" role="table" aria-label={`${t.card} ${card.title}`}>
                      <div className="bingo-row bingo-header" role="row">{columns.map((column) => <div role="columnheader" key={column}>{column}</div>)}</div>
                      {card.numbers.map((row, rowIndex) => (
                        <div className="bingo-row" role="row" key={rowIndex}>
                          {row.map((number, columnIndex) => {
                            const marked = number === null || calledNumbers.has(number);
                            return <div role="cell" className={`${marked ? 'marked' : ''}${number === null ? ' free' : ''}`} key={`${rowIndex}-${columnIndex}`} aria-label={number === null ? t.freeSpace : t.numberCell(number, marked)}>{number === null ? <span aria-hidden="true">★</span> : number}</div>;
                          })}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="control-panel" aria-label={t.controlPanelLabel}>
          <div className="control-title"><span>{t.marker}</span><h2>{t.whichNumber}</h2><p>{canMark ? t.markInstruction : t.loadInstruction}</p></div>
          <form onSubmit={markNumber} className="number-form">
            <label htmlFor="bingo-number">{t.calledNumber}</label>
            <div className="input-row"><input ref={inputRef} id="bingo-number" type="number" inputMode="numeric" min="1" max="75" autoComplete="off" placeholder="00" value={numberInput} disabled={!canMark} onChange={(event) => { setNumberInput(event.target.value); setNotice(null); }} /><button type="submit" className="confirm-button" aria-label={t.confirmNumber} disabled={!canMark}><span>{t.mark}</span><b aria-hidden="true">→</b></button></div>
          </form>
          {notice && <p className={`notice ${notice.type}`} role="status">{notice.text}</p>}
          <div className="recent-section"><div className="recent-heading"><h3>{t.marked}</h3><button type="button" onClick={() => setShowHistory((value) => !value)} disabled={!sortedCalledNumbers.length}>{showHistory ? t.collapse : t.showAll}</button></div>{sortedCalledNumbers.length ? <div className={`number-history${showHistory ? ' expanded' : ''}`}>{sortedCalledNumbers.map((number, index) => <span className={index === 0 ? 'latest' : ''} key={number}>{number}</span>)}</div> : <p className="empty-history">{t.noMarkedNumbers}</p>}</div>
          <div className="panel-actions"><button type="button" onClick={undoLast} disabled={!calledNumbers.size}>{t.undoLast}</button><button type="button" onClick={clearMarks} disabled={!calledNumbers.size}>{t.clearMarks}</button></div>
          <div className="json-loader"><div><strong>{canMark ? t.otherCards : t.letsStart}</strong><span>{canMark ? <>{t.savedForOneDay} <a href="./cartelas.json" download>{t.downloadDefault}</a></> : t.uploadCardsHint}</span></div><button type="button" onClick={() => fileRef.current?.click()}>{t.loadJson}</button><input ref={fileRef} type="file" accept="application/json,.json" onChange={loadJson} hidden /></div>
          <section className="json-text-loader">
            <label htmlFor="cards-json-text">{t.pasteJsonLabel}</label>
            <textarea id="cards-json-text" value={cardsJsonInput} onChange={(event) => setCardsJsonInput(event.target.value)} placeholder={cardsJsonExample} aria-describedby="cards-json-hint" spellCheck="false" />
            <div className="json-text-actions">
              <span id="cards-json-hint">{t.pasteJsonHint}</span>
              <button type="button" onClick={loadJsonText}>{t.loadTextJson}</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
