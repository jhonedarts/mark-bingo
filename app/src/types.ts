export type CellValue = number | null;

export type BingoCard = {
  title: string;
  numbers: CellValue[][];
};

export type Notice = { type: 'error' | 'info'; text: string } | null;

export type Locale = 'pt-BR' | 'es' | 'en';

export type LoadMode = 'image' | 'json';

export type JsonLoadMode = 'file' | 'text';

export type ImageDetection = {
  title: string;
  rows: number;
  columns: number;
};

export type Translation = {
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
  loadFromImage: string;
  loadFromJson: string;
  importJson: string;
  typeJson: string;
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
