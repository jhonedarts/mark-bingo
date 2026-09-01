'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import JSON5 from 'json5';

type CellValue = number | null;
type BingoCard = { title: string; numbers: CellValue[][] };
type Notice = { type: 'error' | 'info'; text: string } | null;
type SavedGame = { expiresAt: number; cards: BingoCard[]; calledNumbers: number[] };
type Locale = 'pt-BR' | 'es' | 'en';
type SavedLocale = { expiresAt: number; locale: Locale };
type LoadMode = 'file' | 'image' | 'json';
type ImageDetection = { title: string; rows: number; columns: number };
type OcrWord = {
  text: string;
  value: number;
  x: number;
  y: number;
  height: number;
};

type Translation = {
  brandLabel: string;
  cardsInPlay: string;
  changeLanguage: (language: string) => string;
  cardComplete: (title: string) => string;
  cardsComplete: (count: number) => string;
  cardsPanelLabel: string;
  liveTracking: string;
  yourCards: string;
  calledCount: (count: number) => string;
  loadingCards: string;
  noCards: string;
  noCardsHint: string;
  openLoader: string;
  card: string;
  cardProgress: (marked: number, total: number) => string;
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
  called: string;
  collapse: string;
  showAll: string;
  noCalledNumbers: string;
  edit: string;
  finishEditing: string;
  removeCalledNumber: (number: number) => string;
  undoLast: string;
  clearMarks: string;
  otherCards: string;
  letsStart: string;
  savedForOneDay: string;
  storageError: string;
  loadBeforeMarking: string;
  invalidNumber: string;
  absentNumber: (number: number) => string;
  markRemoved: (number: number) => string;
  importSuccess: (count: number) => string;
  invalidJson: string;
  emptyTextJson: string;
  loaderTitle: string;
  loaderDescription: string;
  loadFromFile: string;
  loadFromImage: string;
  loadFromJson: string;
  chooseJsonFile: string;
  chooseJsonFileHint: string;
  chooseImage: string;
  chooseImageHint: string;
  pasteJsonLabel: string;
  pasteJsonHint: string;
  jsonExampleLabel: string;
  loadTextJson: string;
  back: string;
  close: string;
  imageProcessing: (progress: number) => string;
  imageDetected: (rows: number, columns: number) => string;
  imageDetectedHint: string;
  imageError: string;
};

const bingoColumns = ['B', 'I', 'N', 'G', 'O'];
function getColumnLabels(count: number) {
  return count === bingoColumns.length
    ? bingoColumns
    : Array.from({ length: count }, (_, index) => String(index + 1));
}

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

const cardsJsonExample = `{
  cards: [
    {
      title: '037',
      numbers: [
        [1, 17, 41, 54, 64],
        [15, 25, 35, 56, 74],
        [11, 20, null, 60, 75],
        [4, 21, 36, 49, 65],
        [7, 26, 44, 53, 63],
      ],
    },
  ],
}`;

const translations: Record<Locale, Translation> = {
  'pt-BR': {
    brandLabel: 'Marcador de bingo',
    cardsInPlay: 'Cartelas em jogo',
    changeLanguage: (language) => 'Alterar idioma para ' + language,
    cardComplete: (title) => 'Cartela ' + title + ' completa',
    cardsComplete: (count) => count + ' cartelas completas',
    cardsPanelLabel: 'Cartelas de bingo',
    liveTracking: 'ACOMPANHAMENTO AO VIVO',
    yourCards: 'Suas cartelas',
    calledCount: (count) => count + ' números sorteados',
    loadingCards: 'Carregando cartelas…',
    noCards: 'Nenhuma cartela carregada',
    noCardsHint: 'Carregue um arquivo, cole um JSON ou use uma imagem da cartela para começar.',
    openLoader: 'Carregar cartelas',
    card: 'CARTELA',
    cardProgress: (marked, total) => marked + ' de ' + total + ' marcados',
    freeSpace: 'Espaço livre',
    numberCell: (number, marked) => 'Número ' + number + (marked ? ', marcado' : ''),
    controlPanelLabel: 'Painel de marcação',
    marker: 'MARCADOR',
    whichNumber: 'Qual número saiu?',
    markInstruction: 'Digite o número e pressione Enter.',
    loadInstruction: 'Carregue uma cartela para habilitar a marcação.',
    calledNumber: 'Número sorteado',
    confirmNumber: 'Confirmar número',
    mark: 'Marcar',
    called: 'Sorteados',
    collapse: 'Recolher',
    showAll: 'Ver todos',
    noCalledNumbers: 'Nenhum número sorteado ainda.',
    edit: 'Editar',
    finishEditing: 'Concluir',
    removeCalledNumber: (number) => 'Remover o número sorteado ' + number,
    undoLast: 'Desfazer último',
    clearMarks: 'Limpar sorteados',
    otherCards: 'Outras cartelas?',
    letsStart: 'Vamos começar?',
    savedForOneDay: 'Dados salvos por 24 horas.',
    storageError: 'Não foi possível salvar os dados neste navegador.',
    loadBeforeMarking: 'Carregue as cartelas antes de marcar números.',
    invalidNumber: 'Digite um número inteiro positivo.',
    absentNumber: (number) => 'O número ' + number + ' não está nestas cartelas.',
    markRemoved: (number) => 'Número sorteado ' + number + ' removido.',
    importSuccess: (count) => count + (count === 1 ? ' cartela carregada' : ' cartelas carregadas') + ' e salvas neste navegador por 24 horas.',
    invalidJson: 'Estrutura inválida. Use de 1 a 4 cartelas e mantenha a mesma quantidade de colunas em todas as linhas de cada cartela.',
    emptyTextJson: 'Cole ou digite um JSON antes de carregar.',
    loaderTitle: 'Carregar cartelas',
    loaderDescription: 'Escolha uma origem e revise os dados antes de começar.',
    loadFromFile: 'Arquivo JSON',
    loadFromImage: 'Imagem',
    loadFromJson: 'Digitar JSON',
    chooseJsonFile: 'Selecionar arquivo JSON',
    chooseJsonFileHint: 'Aceita arquivos .json com até 4 cartelas.',
    chooseImage: 'Selecionar imagem da cartela',
    chooseImageHint: 'Use uma foto reta e nítida. O sistema detectará as linhas e colunas.',
    pasteJsonLabel: 'Cole ou digite as cartelas em JSON',
    pasteJsonHint: 'Aceita JSON e JSON5: aspas simples, chaves sem aspas e vírgulas finais.',
    jsonExampleLabel: 'Exemplo de estrutura',
    loadTextJson: 'Carregar JSON digitado',
    back: 'Voltar para as cartelas',
    close: 'Fechar',
    imageProcessing: (progress) => 'Lendo imagem… ' + progress + '%',
    imageDetected: (rows, columnsCount) => rows + ' linhas × ' + columnsCount + ' colunas detectadas',
    imageDetectedHint: 'Revise o JSON extraído e faça ajustes antes de carregar.',
    imageError: 'Não foi possível reconhecer uma grade numérica nesta imagem. Tente uma foto mais reta e nítida.',
  },
  es: {
    brandLabel: 'Marcador de bingo',
    cardsInPlay: 'Cartones en juego',
    changeLanguage: (language) => 'Cambiar idioma a ' + language,
    cardComplete: (title) => 'Cartón ' + title + ' completo',
    cardsComplete: (count) => count + ' cartones completos',
    cardsPanelLabel: 'Cartones de bingo',
    liveTracking: 'SEGUIMIENTO EN VIVO',
    yourCards: 'Tus cartones',
    calledCount: (count) => count + ' números sorteados',
    loadingCards: 'Cargando cartones…',
    noCards: 'No hay cartones cargados',
    noCardsHint: 'Carga un archivo, pega un JSON o usa una imagen del cartón para empezar.',
    openLoader: 'Cargar cartones',
    card: 'CARTÓN',
    cardProgress: (marked, total) => marked + ' de ' + total + ' marcados',
    freeSpace: 'Espacio libre',
    numberCell: (number, marked) => 'Número ' + number + (marked ? ', marcado' : ''),
    controlPanelLabel: 'Panel de marcado',
    marker: 'MARCADOR',
    whichNumber: '¿Qué número salió?',
    markInstruction: 'Escribe el número y presiona Enter.',
    loadInstruction: 'Carga un cartón para habilitar el marcado.',
    calledNumber: 'Número sorteado',
    confirmNumber: 'Confirmar número',
    mark: 'Marcar',
    called: 'Sorteados',
    collapse: 'Ocultar',
    showAll: 'Ver todos',
    noCalledNumbers: 'Todavía no hay números sorteados.',
    edit: 'Editar',
    finishEditing: 'Finalizar',
    removeCalledNumber: (number) => 'Eliminar el número sorteado ' + number,
    undoLast: 'Deshacer último',
    clearMarks: 'Borrar sorteados',
    otherCards: '¿Otros cartones?',
    letsStart: '¿Empezamos?',
    savedForOneDay: 'Datos guardados durante 24 horas.',
    storageError: 'No fue posible guardar los datos en este navegador.',
    loadBeforeMarking: 'Carga los cartones antes de marcar números.',
    invalidNumber: 'Escribe un número entero positivo.',
    absentNumber: (number) => 'El número ' + number + ' no está en estos cartones.',
    markRemoved: (number) => 'Número sorteado ' + number + ' eliminado.',
    importSuccess: (count) => count + (count === 1 ? ' cartón cargado' : ' cartones cargados') + ' y guardados durante 24 horas.',
    invalidJson: 'Estructura no válida. Usa de 1 a 4 cartones y mantén la misma cantidad de columnas en todas las filas de cada cartón.',
    emptyTextJson: 'Pega o escribe un JSON antes de cargarlo.',
    loaderTitle: 'Cargar cartones',
    loaderDescription: 'Elige un origen y revisa los datos antes de empezar.',
    loadFromFile: 'Archivo JSON',
    loadFromImage: 'Imagen',
    loadFromJson: 'Escribir JSON',
    chooseJsonFile: 'Seleccionar archivo JSON',
    chooseJsonFileHint: 'Acepta archivos .json con hasta 4 cartones.',
    chooseImage: 'Seleccionar imagen del cartón',
    chooseImageHint: 'Usa una foto recta y nítida. El sistema detectará filas y columnas.',
    pasteJsonLabel: 'Pega o escribe los cartones en JSON',
    pasteJsonHint: 'Acepta JSON y JSON5: comillas simples, claves sin comillas y comas finales.',
    jsonExampleLabel: 'Ejemplo de estructura',
    loadTextJson: 'Cargar JSON escrito',
    back: 'Volver a los cartones',
    close: 'Cerrar',
    imageProcessing: (progress) => 'Leyendo imagen… ' + progress + '%',
    imageDetected: (rows, columnsCount) => rows + ' filas × ' + columnsCount + ' columnas detectadas',
    imageDetectedHint: 'Revisa el JSON extraído y haz ajustes antes de cargarlo.',
    imageError: 'No fue posible reconocer una cuadrícula numérica. Prueba con una foto más recta y nítida.',
  },
  en: {
    brandLabel: 'Bingo marker',
    cardsInPlay: 'Cards in play',
    changeLanguage: (language) => 'Change language to ' + language,
    cardComplete: (title) => 'Card ' + title + ' complete',
    cardsComplete: (count) => count + ' cards complete',
    cardsPanelLabel: 'Bingo cards',
    liveTracking: 'LIVE TRACKING',
    yourCards: 'Your cards',
    calledCount: (count) => count + ' numbers called',
    loadingCards: 'Loading cards…',
    noCards: 'No cards loaded',
    noCardsHint: 'Load a file, paste JSON, or use an image of the card to get started.',
    openLoader: 'Load cards',
    card: 'CARD',
    cardProgress: (marked, total) => marked + ' of ' + total + ' marked',
    freeSpace: 'Free space',
    numberCell: (number, marked) => 'Number ' + number + (marked ? ', marked' : ''),
    controlPanelLabel: 'Marking panel',
    marker: 'MARKER',
    whichNumber: 'What number was called?',
    markInstruction: 'Enter the number and press Enter.',
    loadInstruction: 'Load a card to enable marking.',
    calledNumber: 'Called number',
    confirmNumber: 'Confirm number',
    mark: 'Mark',
    called: 'Called',
    collapse: 'Collapse',
    showAll: 'Show all',
    noCalledNumbers: 'No numbers called yet.',
    edit: 'Edit',
    finishEditing: 'Done',
    removeCalledNumber: (number) => 'Remove called number ' + number,
    undoLast: 'Undo last',
    clearMarks: 'Clear called numbers',
    otherCards: 'Other cards?',
    letsStart: 'Ready to start?',
    savedForOneDay: 'Data saved for 24 hours.',
    storageError: 'Unable to save data in this browser.',
    loadBeforeMarking: 'Load cards before marking numbers.',
    invalidNumber: 'Enter a positive whole number.',
    absentNumber: (number) => 'Number ' + number + ' is not on these cards.',
    markRemoved: (number) => 'Called number ' + number + ' removed.',
    importSuccess: (count) => count + (count === 1 ? ' card loaded' : ' cards loaded') + ' and saved for 24 hours.',
    invalidJson: 'Invalid structure. Use 1 to 4 cards and keep the same number of columns in every row of each card.',
    emptyTextJson: 'Paste or type JSON before loading.',
    loaderTitle: 'Load cards',
    loaderDescription: 'Choose a source and review the data before starting.',
    loadFromFile: 'JSON file',
    loadFromImage: 'Image',
    loadFromJson: 'Type JSON',
    chooseJsonFile: 'Select JSON file',
    chooseJsonFileHint: 'Accepts .json files with up to 4 cards.',
    chooseImage: 'Select card image',
    chooseImageHint: 'Use a straight, clear photo. The app will detect rows and columns.',
    pasteJsonLabel: 'Paste or type cards as JSON',
    pasteJsonHint: 'Accepts JSON and JSON5: single quotes, unquoted keys, and trailing commas.',
    jsonExampleLabel: 'Structure example',
    loadTextJson: 'Load typed JSON',
    back: 'Back to cards',
    close: 'Close',
    imageProcessing: (progress) => 'Reading image… ' + progress + '%',
    imageDetected: (rows, columnsCount) => rows + ' rows × ' + columnsCount + ' columns detected',
    imageDetectedHint: 'Review the extracted JSON and adjust it before loading.',
    imageError: 'A numeric grid could not be recognized in this image. Try a straighter, clearer photo.',
  },
};

function isValidCard(value: unknown): value is BingoCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<BingoCard>;
  const columnCount =
    Array.isArray(card.numbers) && Array.isArray(card.numbers[0])
      ? card.numbers[0].length
      : 0;
  return (
    typeof card.title === 'string' &&
    card.title.trim().length > 0 &&
    Array.isArray(card.numbers) &&
    card.numbers.length > 0 &&
    columnCount > 0 &&
    card.numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === columnCount &&
        row.every(
          (cell) =>
            cell === null ||
            (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 9999),
        ),
    )
  );
}

function isValidMarkedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9999;
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

function getCardProgress(card: BingoCard, calledNumbers: Set<number>) {
  const playable = card.numbers.flat().filter((number): number is number => number !== null);
  return {
    marked: playable.filter((number) => calledNumbers.has(number)).length,
    total: playable.length,
  };
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

function saveGameToStorage(cards: BingoCard[], numbers: Set<number>) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      expiresAt: Date.now() + storageDuration,
      cards,
      calledNumbers: Array.from(numbers),
    }),
  );
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function detectCardFromWords(words: OcrWord[], filename: string): {
  card: BingoCard;
  rows: number;
  columns: number;
} {
  if (words.length < 8) throw new Error('not-enough-numbers');

  const tolerance = Math.max(8, median(words.map((word) => word.height)) * 0.85);
  const rowGroups: Array<{ y: number; words: OcrWord[] }> = [];

  [...words].sort((a, b) => a.y - b.y).forEach((word) => {
    const group = rowGroups.find((candidate) => Math.abs(candidate.y - word.y) <= tolerance);
    if (group) {
      group.words.push(word);
      group.y = group.words.reduce((sum, item) => sum + item.y, 0) / group.words.length;
    } else {
      rowGroups.push({ y: word.y, words: [word] });
    }
  });

  const maximumColumns = Math.max(...rowGroups.map((group) => group.words.length));
  if (maximumColumns < 3) throw new Error('not-enough-columns');

  const gridRows = rowGroups
    .filter((group) => group.words.length >= Math.max(2, maximumColumns - 1))
    .sort((a, b) => a.y - b.y);
  if (gridRows.length < 3) throw new Error('not-enough-rows');

  const anchorRow = [...gridRows].sort((a, b) => b.words.length - a.words.length)[0];
  const anchors = [...anchorRow.words].sort((a, b) => a.x - b.x).map((word) => word.x);
  const detectedNumbers = gridRows.map((group) => {
    const row: CellValue[] = Array.from({ length: anchors.length }, () => null);
    [...group.words].sort((a, b) => a.x - b.x).forEach((word) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      anchors.forEach((anchor, index) => {
        const distance = Math.abs(anchor - word.x);
        if (distance < bestDistance && row[index] === null) {
          bestIndex = index;
          bestDistance = distance;
        }
      });
      row[bestIndex] = word.value;
    });
    return row;
  });

  const firstGridY = gridRows[0].y;
  const titleFromImage = words
    .filter((word) => word.y < firstGridY - tolerance && word.text.length <= 4)
    .sort((a, b) => b.y - a.y)[0]?.text;
  const titleFromFilename = filename.match(/\d{1,4}/)?.[0];
  const title = titleFromImage || titleFromFilename || 'IMG';

  return {
    card: { title, numbers: detectedNumbers },
    rows: detectedNumbers.length,
    columns: anchors.length,
  };
}

export default function Home() {
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

  function persistGame(cardsToSave: BingoCard[], numbersToSave: Set<number>) {
    try {
      saveGameToStorage(cardsToSave, numbersToSave);
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

  function openLoader(mode: LoadMode = 'file') {
    setLoadMode(mode);
    setImageDetection(null);
    setShowLoader(true);
  }

  function importCards(value: unknown) {
    const importedCards = getCards(value);
    if (!importedCards) throw new Error('invalid-cards');
    const next = new Set<number>();
    setCards(importedCards);
    setCalledNumbers(next);
    persistGame(importedCards, next);
    setNotice({ type: 'info', text: t.importSuccess(importedCards.length) });
    setEditingHistory(false);
    setShowLoader(false);
  }

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
    const appearsOnCard = activeCards.some((card) =>
      card.numbers.some((row) => row.includes(parsed)),
    );
    const next = new Set(calledNumbers);
    next.add(parsed);
    setCalledNumbers(next);
    setNumberInput('');
    setNotice(appearsOnCard ? null : { type: 'info', text: t.absentNumber(parsed) });
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

    let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null = null;
    try {
      const { createWorker, PSM } = await import('tesseract.js');
      worker = await createWorker('eng', undefined, {
        logger: (message) => {
          if (message.status.includes('recognizing text')) {
            setImageProgress(Math.round(message.progress * 100));
          }
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      const result = await worker.recognize(file, {}, { blocks: true, text: true });
      const words: OcrWord[] = (result.data.blocks ?? [])
        .flatMap((block) => block.paragraphs)
        .flatMap((paragraph) => paragraph.lines)
        .flatMap((line) => line.words)
        .map((word) => {
          const normalized = word.text.replace(/\D/g, '');
          return {
            text: normalized,
            value: Number(normalized),
            x: (word.bbox.x0 + word.bbox.x1) / 2,
            y: (word.bbox.y0 + word.bbox.y1) / 2,
            height: word.bbox.y1 - word.bbox.y0,
          };
        })
        .filter(
          (word) =>
            word.text.length > 0 &&
            Number.isInteger(word.value) &&
            word.value >= 1 &&
            word.value <= 75,
        );

      const detected = detectCardFromWords(words, file.name);
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
      if (worker) await worker.terminate();
      setImageProgress(null);
      event.target.value = '';
    }
  }

  function isNumberOnAnyCard(number: number) {
    return activeCards.some((card) => card.numbers.some((row) => row.includes(number)));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label={t.brandLabel}>
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </span>
          <span className="brand-name">MARCA BINGO</span>
        </div>
        <div className="topbar-actions">
          <div className="topbar-meta">
            <span className="live-dot" aria-hidden="true" />
            <span>{t.cardsInPlay}</span>
            <strong>{activeCards.length.toString().padStart(2, '0')}</strong>
          </div>
          <button
            type="button"
            className="language-switch"
            onClick={changeLocale}
            aria-label={t.changeLanguage(localeNames[nextLocale])}
            title={t.changeLanguage(localeNames[nextLocale])}
          >
            <span aria-hidden="true">◎</span>
            <strong>{localeShortNames[locale]}</strong>
          </button>
        </div>
      </header>

      {winners.length > 0 && (
        <section className="bingo-alert" role="alert" aria-live="assertive">
          <span aria-hidden="true">★</span>
          <div>
            <strong>BINGO!</strong>
            <small>
              {winners.length === 1
                ? t.cardComplete(winners[0].title)
                : t.cardsComplete(winners.length)}
            </small>
          </div>
          <span aria-hidden="true">★</span>
        </section>
      )}

      <div className="workspace">
        <section className="cards-panel" aria-label={t.cardsPanelLabel}>
          <div className="section-heading">
            <div>
              <p>{t.liveTracking}</p>
              <h1>{t.yourCards}</h1>
            </div>
            <span>{t.calledCount(calledNumbers.size)}</span>
          </div>

          {cards === null ? (
            <section className="empty-cards" aria-live="polite">
              <strong>{t.loadingCards}</strong>
            </section>
          ) : activeCards.length === 0 ? (
            <section className="empty-cards" aria-live="polite">
              <span aria-hidden="true">↥</span>
              <h2>{t.noCards}</h2>
              <p>{t.noCardsHint}</p>
              <button type="button" onClick={() => openLoader('file')}>
                {t.openLoader}
              </button>
            </section>
          ) : (
            <div className={'cards-grid cards-' + activeCards.length}>
              {activeCards.map((card, cardIndex) => {
                const winner = hasBingo(card, calledNumbers);
                const progress = getCardProgress(card, calledNumbers);
                const columnCount = card.numbers[0].length;
                const columnLabels = getColumnLabels(columnCount);
                const gridStyle = {
                  gridTemplateColumns: 'repeat(' + columnCount + ', minmax(0, 1fr))',
                };
                return (
                  <article
                    className={'bingo-card' + (winner ? ' is-winner' : '') + (columnCount > 6 ? ' dense-card' : '')}
                    key={card.title + '-' + cardIndex}
                  >
                    <div className="card-topline">
                      <div className="mini-brand" aria-hidden="true">
                        <span className="mini-mark">•••</span>
                        <span>BINGO</span>
                      </div>
                      <div className="card-meta">
                        <div className="card-title">
                          <small>{t.card}</small>
                          <strong>{card.title}</strong>
                        </div>
                        <span className="card-progress">
                          {t.cardProgress(progress.marked, progress.total)}
                        </span>
                      </div>
                    </div>
                    {winner && <div className="winner-ribbon">BINGO!</div>}
                    <div className="bingo-table" role="table" aria-label={t.card + ' ' + card.title}>
                      <div className="bingo-row bingo-header" role="row" style={gridStyle}>
                        {columnLabels.map((column) => (
                          <div role="columnheader" key={column}>{column}</div>
                        ))}
                      </div>
                      {card.numbers.map((row, rowIndex) => (
                        <div className="bingo-row" role="row" key={rowIndex} style={gridStyle}>
                          {row.map((number, columnIndex) => {
                            const marked = number === null || calledNumbers.has(number);
                            return (
                              <div
                                role="cell"
                                className={(marked ? 'marked' : '') + (number === null ? ' free' : '')}
                                key={rowIndex + '-' + columnIndex}
                                aria-label={
                                  number === null ? t.freeSpace : t.numberCell(number, marked)
                                }
                              >
                                {number === null ? <span aria-hidden="true">★</span> : number}
                              </div>
                            );
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
          <div className="control-title">
            <span>{t.marker}</span>
            <h2>{t.whichNumber}</h2>
            <p>{canMark ? t.markInstruction : t.loadInstruction}</p>
          </div>

          <form onSubmit={markNumber} className="number-form">
            <label htmlFor="bingo-number">{t.calledNumber}</label>
            <div className="input-row">
              <input
                ref={inputRef}
                id="bingo-number"
                type="number"
                inputMode="numeric"
                min="1"
                max="9999"
                autoComplete="off"
                placeholder="00"
                value={numberInput}
                disabled={!canMark}
                onChange={(event) => {
                  setNumberInput(event.target.value);
                  setNotice(null);
                }}
              />
              <button
                type="submit"
                className="confirm-button"
                aria-label={t.confirmNumber}
                disabled={!canMark}
              >
                <span>{t.mark}</span>
                <b aria-hidden="true">→</b>
              </button>
            </div>
          </form>

          {notice && (
            <p className={'notice ' + notice.type} role="status">
              {notice.text}
            </p>
          )}

          <div className="recent-section">
            <div className="recent-heading">
              <h3>{t.called}</h3>
              <div className="recent-controls">
                <button
                  type="button"
                  onClick={() => setShowHistory((value) => !value)}
                  disabled={!sortedCalledNumbers.length}
                >
                  {showHistory ? t.collapse : t.showAll}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingHistory((value) => !value);
                    setShowHistory(true);
                  }}
                  disabled={!sortedCalledNumbers.length}
                >
                  {editingHistory ? t.finishEditing : t.edit}
                </button>
              </div>
            </div>
            {sortedCalledNumbers.length ? (
              <div
                className={
                  'number-history' +
                  (showHistory ? ' expanded' : '') +
                  (editingHistory ? ' editing' : '')
                }
              >
                {sortedCalledNumbers.map((number, index) => (
                  <button
                    type="button"
                    className={
                      (index === 0 ? 'latest ' : '') +
                      (isNumberOnAnyCard(number) ? 'matched-card' : '')
                    }
                    key={number}
                    onClick={() => removeCalledNumber(number)}
                    disabled={!editingHistory}
                    aria-label={
                      editingHistory ? t.removeCalledNumber(number) : t.calledNumber + ' ' + number
                    }
                  >
                    {number}
                    {editingHistory && <small aria-hidden="true">×</small>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-history">{t.noCalledNumbers}</p>
            )}
          </div>

          <div className="panel-actions">
            <button type="button" onClick={undoLast} disabled={!calledNumbers.size}>
              {t.undoLast}
            </button>
            <button type="button" onClick={clearMarks} disabled={!calledNumbers.size}>
              {t.clearMarks}
            </button>
          </div>

          <div className="json-loader">
            <div>
              <strong>{canMark ? t.otherCards : t.letsStart}</strong>
              <span>{canMark ? t.savedForOneDay : t.noCardsHint}</span>
            </div>
            <button type="button" onClick={() => openLoader('file')}>
              {t.openLoader}
            </button>
          </div>
        </aside>
      </div>

      {showLoader && (
        <div className="loader-overlay" role="presentation">
          <section
            className="loader-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loader-title"
          >
            <header className="loader-header">
              <div>
                <h2 id="loader-title">{t.loaderTitle}</h2>
                <p>{t.loaderDescription}</p>
              </div>
              <button
                type="button"
                className="loader-close"
                onClick={() => setShowLoader(false)}
                aria-label={t.close}
              >
                ×
              </button>
            </header>

            <nav className="loader-tabs" aria-label={t.loaderTitle}>
              {([
                ['file', t.loadFromFile],
                ['image', t.loadFromImage],
                ['json', t.loadFromJson],
              ] as Array<[LoadMode, string]>).map(([mode, label]) => (
                <button
                  type="button"
                  className={loadMode === mode ? 'active' : ''}
                  onClick={() => setLoadMode(mode)}
                  aria-pressed={loadMode === mode}
                  key={mode}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="loader-content">
              {loadMode === 'file' && (
                <div className="upload-pane">
                  <button type="button" className="upload-target" onClick={() => fileRef.current?.click()}>
                    <span aria-hidden="true">JSON</span>
                    <strong>{t.chooseJsonFile}</strong>
                    <small>{t.chooseJsonFileHint}</small>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={loadJsonFile}
                    hidden
                  />
                </div>
              )}

              {loadMode === 'image' && (
                <div className="upload-pane">
                  <button
                    type="button"
                    className="upload-target image-target"
                    onClick={() => imageRef.current?.click()}
                    disabled={imageProgress !== null}
                  >
                    <span aria-hidden="true">▦</span>
                    <strong>
                      {imageProgress === null
                        ? t.chooseImage
                        : t.imageProcessing(imageProgress)}
                    </strong>
                    <small>{t.chooseImageHint}</small>
                    {imageProgress !== null && (
                      <i className="ocr-progress" aria-hidden="true">
                        <b style={{ width: imageProgress + '%' }} />
                      </i>
                    )}
                  </button>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={loadImage}
                    hidden
                  />
                </div>
              )}

              {loadMode === 'json' && (
                <div className="modal-json-editor">
                  {imageDetection && (
                    <div className="image-detection" role="status">
                      <strong>
                        {t.imageDetected(imageDetection.rows, imageDetection.columns)}
                      </strong>
                      <span>{t.imageDetectedHint}</span>
                    </div>
                  )}
                  <label htmlFor="cards-json-text">{t.pasteJsonLabel}</label>
                  <textarea
                    id="cards-json-text"
                    value={cardsJsonInput}
                    onChange={(event) => setCardsJsonInput(event.target.value)}
                    placeholder={t.pasteJsonLabel}
                    aria-describedby="cards-json-hint"
                    spellCheck="false"
                  />
                  <section className="json-example-block" aria-label={t.jsonExampleLabel}>
                    <strong>{t.jsonExampleLabel}</strong>
                    <pre>{cardsJsonExample}</pre>
                  </section>
                  <div className="modal-json-actions">
                    <span id="cards-json-hint">{t.pasteJsonHint}</span>
                    <button type="button" onClick={loadJsonText}>
                      {t.loadTextJson}
                    </button>
                  </div>
                </div>
              )}

              {notice && (
                <p className={'loader-notice ' + notice.type} role="status">
                  {notice.text}
                </p>
              )}
            </div>

            {canMark && (
              <footer className="loader-footer">
                <button type="button" onClick={() => setShowLoader(false)}>
                  ← {t.back}
                </button>
              </footer>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
