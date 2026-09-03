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
  fileName: string;
  title: string;
  rows: number;
  columns: number;
};

export type ImageProgress = {
  current: number;
  total: number;
  percent: number;
  fileName: string;
};
